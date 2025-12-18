import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import port from './src/port.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dependencies for the app to read user input and to return JSONs.
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.listen(port, '127.0.0.1', () => {
    console.log(`App running on port ${port}`);
});

// END BOILERPLATE.

app.post('/api/course', async (req, res) => {
    try {
        console.log('Request Received!');
        const { courseNames, college } = req.body;
        const courses = [];
        const promises = [];
        courseNames.forEach((name) => {
            const urlString = `https://classes.sis.maricopa.edu/?keywords=${name}&institutions[]=${college}`;
            console.log(urlString);
            promises.push(axios.get(urlString));
        });

        // Parses all sites in parallel.
        const responses = await Promise.all(promises);
        responses.forEach(response => {
            const html = response.data;
            const options = getCourseInfo(html);
            courses.push(options);
        })
        console.log('Courses Parsed!');
        let schedules = [[]];

        // Creates a Cartesian Product for all the options of each course input.
        courses.forEach(course => {
            const newSchedules = [];
            schedules.forEach(schedule => {
                course.forEach(option => {
                    const newSchedule = schedule.map((schedule) => { return schedule });
                    newSchedule.push(option);
                    newSchedules.push(newSchedule);
                });
            });
            schedules = newSchedules;
        });

        // At this point, a schedule is an array of options.

        const validSchedules = [];
        const invalidSchedules = [];
        schedules.forEach(schedule => {
            console.log(schedule);
            for (let i = 0; i < schedule.length; i++) {
                for (let j = i + 1; j < schedule.length; j++) {
                    if (schedule[i].isInvalidDelivery() || schedule[j].isInvalidDelivery()) {
                        invalidSchedules.push(schedule);
                        return;
                    }
                    if (schedule[i].isOverlap(schedule[j])) {
                        invalidSchedules.push(schedule);
                        return;
                    }
                }
            }
            validSchedules.push(schedule);
        });

        return res.status(200).json({ validSchedules, invalidSchedules });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err: err.message });
    }
});

class Option {
    constructor(name, number, location, delivery, dates, days, times, instructors, availability) {
        this.name = name;
        this.number = number;
        this.location = location.replace('\n        ', ' @ ');
        this.delivery = delivery;
        this.dates = dates;
        this.days = days;
        this.times = times;
        this.instructors = instructors;
        this.availability = availability;
    }

    isOverlap(otherClass) {
        console.log(this, otherClass);
        const thisDays = this.days.split(',');
        const otherDays = otherClass.days.split(',');

        // Splits the time from "XX:XXLM – XX:XXLM".
        const thisTimes = this.times.split(' – ');
        const otherTimes = otherClass.times.split(' – ');

        const thisStart = convertToMinutes(thisTimes[0]);
        const thisEnd = convertToMinutes(thisTimes[1]);

        const otherStart = convertToMinutes(otherTimes[0]);
        const otherEnd = convertToMinutes(otherTimes[1]);

        const isTimeOverlap = thisEnd > otherStart && thisStart < otherEnd;
        const isDayOverlap = !thisDays.every(day => {
            return !otherDays.includes(day);
        });
        return isTimeOverlap && isDayOverlap;
    }
    isInvalidDelivery() {
        return !this.delivery.includes('Person');
    }
}

/**
 * Converts the time from XX:XXLM to minutes since midnight for easy comparisons.
 * @param {string} time The time string to convert
 */
function convertToMinutes(time) {
    console.log(time);
    const splitTime = time.split(':');
    const modifier = splitTime[1].slice(2); // AM or PM
    let actualHours;
    if (splitTime[0] === '12' && modifier === 'PM') {
        actualHours = 12;
    } else if (splitTime[0] === '12' && modifier === 'AM') {
        actualHours = 0;
    } else {
        actualHours = Number(splitTime[0]);
    }
    const actualMinutes = actualHours * 60 + Number(splitTime[1].slice(0, 2));
    return actualMinutes;
}

function getCourseInfo(html) {
    const $ = cheerio.load(html);

    const optionSpecs = $('.class-specs');
    const optionName = $('div.course h3').text().trim().slice(0, 6);
    const options = [];

    optionSpecs.each((i, element) => {
        const option = [optionName];
        const specs = $(element).find('td');

        specs.each((i, spec) => {
            option.push($(spec).text().trim());
        });
        const optionObject = new Option(...option);
        options.push(optionObject);
    });
    return options;
}

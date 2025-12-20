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
        console.time('timer');
        console.log('Request Received!');
        const { courseNames, colleges, times } = req.body;

        const courses = [];
        const promises = []; // Requirement for parallel HTTP request.
        courseNames.forEach(courseName => {
            const urlString = `https://classes.sis.maricopa.edu/`;
            promises.push(axios.get(urlString, {
                params: {
                    keywords: courseName,
                    institutions: colleges,
                }
            }));
        });

        // GETs all sites in parallel.
        const responses = await Promise.all(promises);

        // Parses responses
        responses.forEach(response => {
            const html = response.data;
            const options = getCourseInfo(html);
            courses.push(options);
        })
        console.log('Courses Parsed!');
        // let validSchedules = [[]];
        // let validSchedulesCount = 0;
        // let invalidSchedulesCount = 0;
        // let parseCount = 0;

        // Creates a Cartesian Product for all the options of each course input.
        // courses.forEach(course => {
        //     const newSchedules = [];
        //     validSchedules.forEach(schedule => {
        //         course.forEach(option => {
        //             console.log(`Parse Count: ${++parseCount}`);
        //             if (option.isInvalidDelivery() || option.isInvalidTime(times)) {
        //                 invalidSchedulesCount++;
        //                 return;
        //             }

        //             const newSchedule = schedule.slice();
        //             const isOverlap = newSchedule.some(oldOption => { return option.isOverlap(oldOption) })
        //             if (isOverlap) {
        //                 invalidSchedulesCount++;
        //                 return;
        //             }
        //             newSchedule.push(option);
        //             newSchedules.push(newSchedule);
        //             validSchedulesCount++;
        //         });
        //     });
        //     validSchedules = newSchedules;
        // });

        // const newValids = courses.reduce((schedules, course) => {
        //     const newSchedules = course.flatMap(option => {
        //         if (option.isInvalidDelivery() || option.isInvalidTime(times)) {
        //             return [];
        //         }
        //         return schedules.flatMap(schedule => {
        //             if (schedule.some(oldOption => { return oldOption.isOverlap(option) })) {
        //                 return [];
        //             }
        //             return [schedule.concat(option)];
        //         });
        //     });
        //     return newSchedules;
        // }, [[]]);

        console.log('Creating Valid Schedules!');
        // Creates a Cartesian Product for all the options of each course input and filters accordingly.
        let rejects = 0;
        const validSchedules = courses.reduce((schedules, course) => {
            const newSchedules = [];
            for (const newOption of course) {
                if (newOption.isInvalidDelivery() || newOption.isInvalidTime(times)) {
                    rejects++;
                    continue;
                };
                for (const schedule of schedules) {
                    if (schedule.some(oldOption => oldOption.isOverlap(newOption))) {
                        rejects++;
                        continue;
                    }
                    newSchedules.push(schedule.concat(newOption));
                }
            }
            return newSchedules;
        }, [[]]);

        console.log(`Valid Schedules: ${validSchedules.length}, Rejected Attempts: ${rejects}`);
        console.timeEnd('timer');
        return res.status(200).json({ validSchedules });
    } catch (err) {
        console.timeEnd('timer');
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
        this.dates = dates.split('\n')[0];
        this.days = days;
        this.times = times;
        this.instructors = instructors;
        this.availability = availability.split('\n')[3];
    }

    isOverlap(otherClass) {
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
    isInvalidTime(times) {
        const thisTimes = this.times.split(' – ');
        const startTime = convertToMinutes(thisTimes[0]);
        const endTime = convertToMinutes(thisTimes[1]);
        return (startTime < times[0] || endTime > times[1]);
    }
}

/**
 * Converts the time from XX:XXLM to minutes since midnight for easy comparisons.
 * @param {string} time The time string to convert
 */
function convertToMinutes(time) {
    const splitTime = time.split(':');
    const modifier = splitTime[1].slice(2); // AM or PM
    let actualHours = 0;
    if (modifier === 'PM') {
        actualHours += 12;
    }
    if (splitTime[0] === '12' && modifier === 'PM') {
        actualHours = 12;
    } else if (splitTime[1] === '12' && modifier === 'AM') {
        actualHours = 0;
    } else {
        actualHours += Number(splitTime[0]);
    }
    const actualMinutes = actualHours * 60 + Number(splitTime[1].slice(0, 2));
    return actualMinutes;
}

function getCourseInfo(html) {
    const $ = cheerio.load(html);

    const optionSpecs = $('.class-specs');
    const optionName = $('div.course h3').text().trim().slice(0, 6);
    const options = [];

    optionSpecs.each((_, element) => {
        const option = [optionName];
        const specs = $(element).find('td');

        specs.each((_, spec) => {
            option.push($(spec).text().trim());
        });
        const optionObject = new Option(...option);
        options.push(optionObject);
    });
    return options;
}

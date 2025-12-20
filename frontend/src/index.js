import elements from "./utils/elements.js";
import axios from "axios";
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

async function main() {
    document.addEventListener('keypress', e => {
        if (e.key === '`') handleSubmit();
    })
    elements.button.submit.addEventListener('click', handleSubmit);
    elements.button.add.addEventListener('click', handleAdd);
    elements.button.clear.addEventListener('click', handleClear);
    elements.input.name.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdd();
    });
    elements.input.name.addEventListener('input', function () {
        this.value = this.value.replaceAll(/[^A-Za-z0-9]/g, '');
        this.value = this.value.toUpperCase();
    });
    noUiSlider.create(elements.div.time, {
        start: [480, 1020],
        connect: true,
        range: {
            'min': [360],
            'max': [1320]
        },
        step: 15
    });
    elements.div.time.noUiSlider.on('update', (values) => {
        const startTime = convertToTime(values[0]);
        const endTime = convertToTime(values[1]);
        elements.span.textContent = `${startTime} - ${endTime}`
    });
}

async function handleSubmit() {
    try {
        const list = elements.ul.courseList.children;
        if (list.length === 0) {
            return window.alert('Enter a course!');
        }
        const courseNames = Array.from(elements.ul.courseList.children).map(li => li.textContent);
        const colleges = Array.from(document.querySelectorAll('input[name="college"]:checked')).map(checkbox => checkbox.value);
        const times = elements.div.time.noUiSlider.get(true);

        console.log('Request Sent!');

        const { data: { validSchedules } } = await axios.post('/api/course', { courseNames, colleges, times }, { timeout: 10000 });

        console.log('Schedules Received!');
        console.log({ validSchedules });
    } catch (err) {
        console.log(err);
        window.alert(err.message);
    }
}

function handleAdd() {
    const courseName = elements.input.name.value.trim().toUpperCase();
    if (/^[A-Za-z]{3}\d{3}$/.test(courseName)) {
        const newListElement = document.createElement('li');
        newListElement.addEventListener('click', function () { this.remove() });
        newListElement.textContent = courseName;
        elements.ul.courseList.append(newListElement);
    } else {
        window.alert('Enter a valid course name (ex: ECE102)');
    }
    elements.input.name.value = '';
}

function handleClear() {
    elements.ul.courseList.replaceChildren();
}

function convertToTime(minutes) {
    let timeHours = Math.floor(minutes / 60);
    let modifier = 'AM';
    const timeMinutes = Math.floor(minutes % 60);
    if (timeHours === 0) {
        timeHours = 12;
    } else if (timeHours === 12) {
        modifier = 'PM';
    } else if (timeHours > 12) {
        modifier = 'PM';
        timeHours -= 12;
    }
    const time = `${timeHours}:${String(timeMinutes).padStart(2, '0')} ${modifier}`;
    return time;
}

main();
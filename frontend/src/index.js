import elements from "./utils/elements.js";
import axios from "axios";

async function main() {
    try {
        elements.submitButton.addEventListener('click', handleSubmit);
    } catch (err) {
        console.error(err);
        window.alert('Something went wrong: ', err);
    }
}

async function handleSubmit() {
    const courseNames = elements.input.name.value.split(' ');
    const college = document.querySelector('input[name="college"]:checked').value;
    const { data: { validSchedules, invalidSchedules } } = await axios.post('/api/course', { courseNames, college });
    console.log({ validSchedules, invalidSchedules });
}

main();
import elements from "./utils/elements.js";
async function main() {
    elements.submitButton.addEventListener('click', handleSubmit);
    const {data} = await (await fetch('/api/cool')).json();
    elements.span.textContent = data.activity;
}

async function handleSubmit() {
    try {
        const name = elements.first.value;
        const age = elements.second.value;
        const response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ name, age })
        })
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.err || 'Something went wrong with the API call.');
        }
        window.alert('Everything is okay :)');
    } catch (err) {
        console.log(err.stack);
        window.alert(err.message);
    }
}

main();
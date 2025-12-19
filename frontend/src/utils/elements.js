const elements = {
    input: {
        /** @type HTMLInputElement*/
        name: document.getElementById('name'),
        college: document.querySelectorAll('input[name="college"]'),
    },
    div: {
        time: document.getElementById('time')
    },
    second: document.getElementById('second'),
    submitButton: document.getElementById('submit'),
    span: document.getElementById('span')
}  
export default elements;
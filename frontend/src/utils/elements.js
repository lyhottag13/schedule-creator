const elements = {
    input: {
        /** @type HTMLInputElement*/
        name: document.getElementById('name'),
        college: document.querySelectorAll('input[name="college"]'),
    },
    div: {
        time: document.getElementById('time')
    },
    button: {
        submit: document.getElementById('submit'),
        add: document.getElementById('add'),
        clear: document.getElementById('clear')
    },
    ul: {
        /** @type HTMLUListElement*/
        courseList: document.getElementById('course-list')
    },
    span: document.getElementById('span')
}  
export default elements;
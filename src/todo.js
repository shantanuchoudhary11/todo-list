export class Todo {
    constructor({ title, description = '', dueDate, priority = 'low', done = false }) {
        this.id = crypto.randomUUID();
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.done = done;
    }
    toggleDone() {
        this.done = !this.done;
    }
}
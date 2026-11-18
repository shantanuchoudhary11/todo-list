export const PRIORITIES = Object.freeze(['low', 'medium', 'high']);

// One rule per editable field: each normalizes the incoming value
// (GUI inputs hand us strings) and throws if it's invalid.
const FIELD_RULES = {
    title(value) {
        const title = String(value ?? '').trim();
        if (!title) throw new Error('Title cannot be empty');
        return title;
    },
    description(value) {
        return String(value ?? '');
    },
    dueDate(value) {
        return value || null; // date input gives "" when cleared
    },
    priority(value) {
        if (!PRIORITIES.includes(value)) {
            throw new Error(`Priority must be one of: ${PRIORITIES.join(', ')}`);
        }
        return value;
    },
    done(value) {
        return Boolean(value);
    },
};

export class Todo {
    // `id` is only passed when restoring a saved todo; new todos get a fresh one.
    constructor({ id = crypto.randomUUID(), title, description = '', dueDate = null, priority = 'low', done = false }) {
        this.id = id;
        Object.assign(this, Todo.#validate({ title, description, dueDate, priority, done }));
    }

    // Apply one or more field changes, e.g. todo.update({ priority: 'high' }).
    // All values are validated first, so a bad value leaves the todo untouched.
    update(changes) {
        Object.assign(this, Todo.#validate(changes));
        return this;
    }

    toggleDone() {
        this.done = !this.done;
    }

    static #validate(changes) {
        const clean = {};
        for (const [field, value] of Object.entries(changes)) {
            const rule = FIELD_RULES[field];
            if (!rule) throw new Error(`Unknown field: ${field}`);
            clean[field] = rule(value);
        }
        return clean;
    }
}

import { Todo } from "./todo.js";

export class Project {
  // `id` is only passed when restoring a saved project; new projects get a fresh one.
  constructor(name, id = crypto.randomUUID()) {
    this.id = id;
    this.name = Project.#cleanName(name);
    this.todos = [];
  }

  rename(name) {
    this.name = Project.#cleanName(name);
    return this;
  }

  addTodo(todo) {
    if (!(todo instanceof Todo)) {
      throw new Error("addTodo expects an existing Todo");
    }
    if (this.getTodo(todo.id)) {
      throw new Error("Todo is already in this project");
    }
    this.todos.push(todo);
    return todo;
  }

  removeTodo(id) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
  }

  getTodo(id) {
    return this.todos.find((todo) => todo.id === id);
  }

  updateTodo(id, changes) {
    const todo = this.getTodo(id);
    if (!todo) {
      throw new Error(`No todo with id ${id}`);
    }
    return todo.update(changes);
  }

  static #cleanName(name) {
    const clean = String(name ?? "").trim();
    if (!clean) {
      throw new Error("Project name cannot be empty");
    }
    return clean;
  }
}

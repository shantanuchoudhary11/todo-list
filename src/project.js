import { Todo } from "./todo.js";

export class Project {
  constructor(name) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.todos = [];
  }

  addTodo(todo) {
    if (!(todo instanceof Todo)) {
      throw new Error("addTodo expects an existing Todo");
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
}
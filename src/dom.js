// dom.js — everything you see on the page.
//
// How it works:
//   1. Read the data from app.js and draw it.
//   2. When the user does something, call app.js (it checks and saves the change).
//   3. Draw again so the page shows the new data.

import * as app from "./app.js";
import { parseISO, differenceInCalendarDays } from "date-fns";

// ---------- Elements from template.html ----------

const projectList = document.querySelector("#project-list");
const newProjectForm = document.querySelector("#new-project-form");
const newProjectName = document.querySelector("#new-project-name");

const projectNameInput = document.querySelector("#project-name");
const deleteProjectButton = document.querySelector("#delete-project");
const errorMessage = document.querySelector("#error");

const newTodoForm = document.querySelector("#new-todo-form");
const newTodoTitle = document.querySelector("#new-todo-title");
const newTodoDueDate = document.querySelector("#new-todo-due-date");
const newTodoPriority = document.querySelector("#new-todo-priority");

const todoList = document.querySelector("#todo-list");
const emptyMessage = document.querySelector("#empty-message");
const todoTemplate = document.querySelector("#todo-template");

// ---------- Start ----------

export function setupDom() {
  newProjectForm.addEventListener("submit", handleAddProject);
  projectNameInput.addEventListener("change", handleRenameProject);
  deleteProjectButton.addEventListener("click", handleDeleteProject);
  newTodoForm.addEventListener("submit", handleAddTodo);

  render();
}

// ---------- Drawing ----------

// Redraw the whole page from the data in app.js
function render() {
  renderSidebar();
  renderProject();
}

// Left side: one button per project
function renderSidebar() {
  projectList.innerHTML = ""; // remove the old buttons

  const currentProject = app.getCurrentProject();

  for (const project of app.getProjects()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-button";
    if (project === currentProject) {
      button.classList.add("selected");
    }

    const name = document.createElement("span");
    name.className = "project-button-name";
    name.textContent = project.name;

    // How many todos are not done yet (left empty when it's 0)
    const count = document.createElement("span");
    count.className = "count";
    const unfinished = project.todos.filter((todo) => !todo.done).length;
    if (unfinished > 0) {
      count.textContent = unfinished;
    }

    button.append(name, count);

    // Clicking the button opens that project
    button.addEventListener("click", () => {
      app.setCurrentProject(project.id);
      render();
    });

    const li = document.createElement("li");
    li.append(button);
    projectList.append(li);
  }
}

// Right side: the selected project's name and its todos
function renderProject() {
  const project = app.getCurrentProject();

  projectNameInput.value = project.name;

  // You can't delete your only project
  deleteProjectButton.disabled = app.getProjects().length === 1;

  todoList.innerHTML = ""; // remove the old todos
  for (const todo of project.todos) {
    todoList.append(createTodoElement(todo));
  }

  // Show "No todos here yet" only when the list is empty
  emptyMessage.hidden = project.todos.length > 0;
}

// Build the <li> for one todo, by copying <template id="todo-template">
function createTodoElement(todo) {
  const li = todoTemplate.content.firstElementChild.cloneNode(true);

  // Find each part of the copy
  const doneCheckbox = li.querySelector(".todo-done");
  const titleInput = li.querySelector(".todo-title");
  const prioritySelect = li.querySelector(".todo-priority");
  const dueDateInput = li.querySelector(".todo-due-date");
  const deleteButton = li.querySelector(".todo-delete");
  const notesInput = li.querySelector(".todo-notes");

  // Put this todo's values into it
  doneCheckbox.checked = todo.done;
  titleInput.value = todo.title;
  prioritySelect.value = todo.priority;
  dueDateInput.value = todo.dueDate || ""; // a date input can't show null
  notesInput.value = todo.description;
  updateTodoStyle(li, todo);
  updateDueLabel(li, todo);

  // When the user changes something, save it.
  // ("change" fires when the user leaves the box, not on every key press.)

  doneCheckbox.addEventListener("change", () => {
    changeTodo(todo, { done: doneCheckbox.checked });
    updateTodoStyle(li, todo);
    updateDueLabel(li, todo); // a done todo is no longer shown as overdue
    renderSidebar(); // the "not done" count in the sidebar changed
  });

  titleInput.addEventListener("change", () => {
    changeTodo(todo, { title: titleInput.value });
    // Show the title that was actually saved:
    // the trimmed one, or the old one if the new title was rejected
    titleInput.value = todo.title;
  });

  prioritySelect.addEventListener("change", () => {
    changeTodo(todo, { priority: prioritySelect.value });
    updateTodoStyle(li, todo);
  });

  dueDateInput.addEventListener("change", () => {
    changeTodo(todo, { dueDate: dueDateInput.value });
    updateDueLabel(li, todo);
  });

  notesInput.addEventListener("change", () => {
    changeTodo(todo, { description: notesInput.value });
  });

  deleteButton.addEventListener("click", () => {
    app.removeTodo(todo.id);
    render();
  });

  return li;
}

// Styling that depends on the todo's values (see styles.css)
function updateTodoStyle(li, todo) {
  // Crossed-out title when done
  if (todo.done) {
    li.classList.add("is-done");
  } else {
    li.classList.remove("is-done");
  }

  // Coloured left edge: sets data-priority="low" / "medium" / "high" on the <li>
  li.dataset.priority = todo.priority;
}

// The text under a todo, like "Due in 3 days" or "Overdue by 2 days".
// Also turns it red (is-overdue) when the date has passed and it's not done.
function updateDueLabel(li, todo) {
  const dueLabel = li.querySelector(".todo-due-label");

  // No due date: no text, never overdue
  if (!todo.dueDate) {
    dueLabel.textContent = "";
    li.classList.remove("is-overdue");
    return;
  }

  // parseISO turns the saved text "2026-11-25" into a real Date.
  // differenceInCalendarDays counts days from today to that date:
  //   3 = in three days, 0 = today, -2 = two days ago
  const dueDate = parseISO(todo.dueDate);
  const daysLeft = differenceInCalendarDays(dueDate, new Date());

  if (daysLeft === 0) {
    dueLabel.textContent = "Due today";
  } else if (daysLeft === 1) {
    dueLabel.textContent = "Due tomorrow";
  } else if (daysLeft > 1) {
    dueLabel.textContent = `Due in ${daysLeft} days`;
  } else if (daysLeft === -1) {
    dueLabel.textContent = "Overdue by 1 day";
  } else {
    dueLabel.textContent = `Overdue by ${-daysLeft} days`;
  }

  if (daysLeft < 0 && !todo.done) {
    li.classList.add("is-overdue");
  } else {
    li.classList.remove("is-overdue");
  }
}

// ---------- Changing a todo ----------

// Ask app.js to change a todo. app.js checks the new value and saves it.
// If the value isn't allowed, the todo stays as it was and we show why.
function changeTodo(todo, changes) {
  try {
    app.updateTodo(todo.id, changes);
    hideError();
  } catch (err) {
    showError(err.message);
  }
}

// ---------- Form and button handlers ----------

function handleAddProject(event) {
  event.preventDefault(); // stop the form from reloading the page

  try {
    const project = app.addProject(newProjectName.value);
    app.setCurrentProject(project.id); // open the new project
    newProjectForm.reset(); // empty the input
    hideError();
    render();
  } catch (err) {
    showError(err.message);
  }
}

function handleRenameProject() {
  const project = app.getCurrentProject();

  try {
    app.renameProject(project.id, projectNameInput.value);
    hideError();
  } catch (err) {
    showError(err.message);
  }

  // Show the name that was actually saved (or the old one if it was rejected)
  projectNameInput.value = project.name;
  renderSidebar();
}

function handleDeleteProject() {
  const project = app.getCurrentProject();

  const sure = confirm(`Delete "${project.name}" and all its todos?`);
  if (!sure) {
    return;
  }

  try {
    app.removeProject(project.id);
    hideError();
    render();
  } catch (err) {
    showError(err.message);
  }
}

function handleAddTodo(event) {
  event.preventDefault(); // stop the form from reloading the page

  try {
    app.addTodo({
      title: newTodoTitle.value,
      dueDate: newTodoDueDate.value,
      priority: newTodoPriority.value,
    });
    newTodoForm.reset(); // empty the inputs
    hideError();
    render();
    newTodoTitle.focus(); // ready to type the next todo
  } catch (err) {
    showError(err.message);
  }
}

// ---------- Error message ----------

let hideErrorTimer;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;

  // Hide it again after 4 seconds
  clearTimeout(hideErrorTimer);
  hideErrorTimer = setTimeout(hideError, 4000);
}

function hideError() {
  errorMessage.hidden = true;
}

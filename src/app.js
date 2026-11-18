// App state: owns every project, which one is selected, and saving/loading.
// Knows nothing about the DOM. All changes go through here so each one is saved.
import { Project } from "./project.js";
import { Todo } from "./todo.js";

const STORAGE_KEY = "todo-list";
const DEFAULT_PROJECT_NAME = "Inbox";

let projects = [];
let currentProjectId = null;

// ---------- Startup ----------

export function init() {
  const saved = readSaved();

  if (saved) {
    try {
      projects = restoreProjects(saved);
      currentProjectId = saved.currentProjectId;
    } catch (err) {
      console.warn("Saved data was invalid, starting fresh:", err);
      projects = [];
    }
  }

  if (projects.length === 0) {
    projects.push(new Project(DEFAULT_PROJECT_NAME));
  }
  if (!getProject(currentProjectId)) {
    currentProjectId = projects[0].id;
  }

  save();
}

// ---------- Projects ----------

export function getProjects() {
  return [...projects];
}

export function getProject(id) {
  return projects.find((project) => project.id === id);
}

export function addProject(name) {
  const project = new Project(name);
  projects.push(project);
  save();
  return project;
}

export function renameProject(id, name) {
  const project = requireProject(id).rename(name);
  save();
  return project;
}

export function removeProject(id) {
  requireProject(id);
  if (projects.length === 1) {
    throw new Error("Cannot delete the last project");
  }

  projects = projects.filter((project) => project.id !== id);
  if (currentProjectId === id) {
    currentProjectId = projects[0].id;
  }
  save();
}

export function getCurrentProject() {
  return getProject(currentProjectId);
}

export function setCurrentProject(id) {
  requireProject(id);
  currentProjectId = id;
  save();
}

// ---------- Todos ----------

export function addTodo(fields, projectId = currentProjectId) {
  const todo = requireProject(projectId).addTodo(new Todo(fields));
  save();
  return todo;
}

export function updateTodo(todoId, changes) {
  const todo = findTodoOwner(todoId).updateTodo(todoId, changes);
  save();
  return todo;
}

export function toggleTodo(todoId) {
  const todo = findTodoOwner(todoId).getTodo(todoId);
  todo.toggleDone();
  save();
  return todo;
}

export function removeTodo(todoId) {
  findTodoOwner(todoId).removeTodo(todoId);
  save();
}

// ---------- Helpers ----------

function requireProject(id) {
  const project = getProject(id);
  if (!project) {
    throw new Error(`No project with id ${id}`);
  }
  return project;
}

function findTodoOwner(todoId) {
  const project = projects.find((p) => p.getTodo(todoId));
  if (!project) {
    throw new Error(`No todo with id ${todoId}`);
  }
  return project;
}

// ---------- Saving / loading ----------

function save() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ projects, currentProjectId }),
    );
  } catch (err) {
    console.warn("Could not save todos:", err);
  }
}

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Could not load saved todos:", err);
    return null;
  }
}

// Saved data comes back as plain objects; rebuild real Project/Todo instances
// (keeping their ids) so methods and validation work again.
function restoreProjects(data) {
  return data.projects.map((saved) => {
    const project = new Project(saved.name, saved.id);
    for (const todo of saved.todos) {
      project.addTodo(new Todo(todo));
    }
    return project;
  });
}

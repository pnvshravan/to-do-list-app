/**
 * storage.js — Data layer
 * Pure data logic: read/write tasks and theme preference from localStorage.
 * No DOM access. No side-effects beyond localStorage.
 */

export const Storage = (() => {
  const TASKS_KEY = 'listado_tasks';
  const THEME_KEY = 'listado_theme';

  /** @returns {Task[]} */
  function getTasks() {
    try {
      return JSON.parse(localStorage.getItem(TASKS_KEY)) ?? [];
    } catch {
      return [];
    }
  }

  /** @param {Task[]} tasks */
  function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  /** @returns {'light'|'dark'} */
  function getTheme() {
    return localStorage.getItem(THEME_KEY) ?? 'dark';
  }

  /** @param {'light'|'dark'} theme */
  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} Task
   */

  /** @param {string} text @returns {Task} */
  function createTask(text) {
    return {
      id:        crypto.randomUUID(),
      text:      text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
  }

  /** @param {Task[]} tasks @param {string} id @returns {Task[]} */
  function addTask(tasks, text) {
    return [...tasks, createTask(text)];
  }

  /** @param {Task[]} tasks @param {string} id @returns {Task[]} */
  function toggleTask(tasks, id) {
    return tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  }

  /** @param {Task[]} tasks @param {string} id @returns {Task[]} */
  function deleteTask(tasks, id) {
    return tasks.filter(t => t.id !== id);
  }

  /** @param {Task[]} tasks @returns {Task[]} */
  function clearCompleted(tasks) {
    return tasks.filter(t => !t.completed);
  }

  /** @param {Task[]} tasks @param {'all'|'active'|'completed'} filter @returns {Task[]} */
  function filterTasks(tasks, filter) {
    if (filter === 'active')    return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t =>  t.completed);
    return tasks;
  }

  /** @param {Task[]} tasks @returns {number} */
  function countActive(tasks) {
    return tasks.filter(t => !t.completed).length;
  }

  /** @param {Task[]} tasks @returns {number} */
  function countCompleted(tasks) {
    return tasks.filter(t => t.completed).length;
  }

  return {
    getTasks, saveTasks,
    getTheme, saveTheme,
    addTask, toggleTask, deleteTask, clearCompleted,
    filterTasks, countActive, countCompleted,
  };
})();

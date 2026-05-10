/**
 * app.js — DOM / UI layer
 * Depends on Storage (storage.js). No data logic here.
 * Reads state from Storage, renders the UI, wires events.
 */
import {Storage} from './storage.js';

const App = (() => {
  /* ── State ─────────────────────────────────── */
  let tasks  = Storage.getTasks();
  let filter = 'all';  // 'all' | 'active' | 'completed'

  /* ── DOM refs ──────────────────────────────── */
  const taskList         = document.getElementById('task-list');
  const taskInput        = document.getElementById('task-input');
  const addBtn           = document.getElementById('add-btn');
  const filterBtns       = document.querySelectorAll('.filter-btn');
  const clearBtn         = document.getElementById('clear-completed-btn');
  const tasksLeftLabel   = document.getElementById('tasks-left-label');
  const emptyState       = document.getElementById('empty-state');
  const emptyTitle       = document.getElementById('empty-title');
  const emptySub         = document.getElementById('empty-sub');
  const appFooter        = document.getElementById('app-footer');
  const themeToggle      = document.getElementById('theme-toggle');

  /* ── Render ────────────────────────────────── */

  function render() {
    const visible       = Storage.filterTasks(tasks, filter);
    const activeCount   = Storage.countActive(tasks);
    const completedCount= Storage.countCompleted(tasks);
    const allEmpty      = tasks.length === 0;
    const filterEmpty   = visible.length === 0 && !allEmpty;

    // Sync task list
    syncTaskList(visible);

    // Empty state messaging
    if (allEmpty || filterEmpty) {
      emptyState.hidden = false;
      if (allEmpty) {
        emptyTitle.textContent = 'All clear!';
        emptySub.textContent   = 'Add a task above to get started.';
      } else {
        emptyTitle.textContent = filter === 'active' ? 'No active tasks.' : 'Nothing completed yet.';
        emptySub.textContent   = filter === 'active'
          ? 'Everything is done — great work!'
          : 'Check off some tasks to see them here.';
      }
    } else {
      emptyState.hidden = true;
    }

    // Footer
    appFooter.hidden = tasks.length === 0;
    tasksLeftLabel.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} left`;
    clearBtn.hidden = completedCount === 0;
  }

  /**
   * Efficiently sync the list DOM with the visible tasks array.
   * Removes items not in the new set, adds new ones, keeps existing.
   * @param {import('./storage.js').Task[]} visible
   */
  function syncTaskList(visible) {
    const existingIds = new Set(
      [...taskList.querySelectorAll('.task-item')].map(el => el.dataset.id)
    );
    const newIds = new Set(visible.map(t => t.id));

    // Remove items not in visible set (with exit animation)
    taskList.querySelectorAll('.task-item').forEach(el => {
      if (!newIds.has(el.dataset.id)) {
        removeItemWithAnimation(el);
      }
    });

    // Add new items or update existing
    visible.forEach((task, index) => {
      const existing = taskList.querySelector(`[data-id="${task.id}"]`);
      if (existing) {
        updateItemDOM(existing, task);
        // Maintain visual order
        taskList.appendChild(existing);
      } else {
        const li = createItemDOM(task);
        taskList.appendChild(li);
      }
    });
  }

  /** @param {import('./storage.js').Task} task @returns {HTMLLIElement} */
  function createItemDOM(task) {
    const li = document.createElement('li');
    li.className   = `task-item${task.completed ? ' is-done' : ''}`;
    li.dataset.id  = task.id;
    li.innerHTML   = itemHTML(task);
    bindItemEvents(li, task.id);
    return li;
  }

  /** @param {HTMLLIElement} li @param {import('./storage.js').Task} task */
  function updateItemDOM(li, task) {
    li.classList.toggle('is-done', task.completed);
    const cb   = li.querySelector('.task-check');
    const span = li.querySelector('.task-text');
    if (cb.checked !== task.completed) cb.checked = task.completed;
    if (span.textContent !== task.text) span.textContent = task.text;
  }

  /** @param {import('./storage.js').Task} task @returns {string} */
  function itemHTML(task) {
    const checked = task.completed ? 'checked' : '';
    const safeText = escapeHTML(task.text);
    return `
      <input
        type="checkbox"
        class="task-check"
        ${checked}
        aria-label="Mark '${safeText}' as ${task.completed ? 'incomplete' : 'complete'}"
      />
      <span class="task-text">${safeText}</span>
      <button class="delete-btn" aria-label="Delete task '${safeText}'" title="Delete">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="11" y1="1" x2="1"  y2="11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>`;
  }

  /** @param {HTMLLIElement} li @param {string} id */
  function bindItemEvents(li, id) {
    li.querySelector('.task-check').addEventListener('change', () => handleToggle(id));
    li.querySelector('.delete-btn').addEventListener('click',  () => handleDelete(id));
  }

  /** @param {HTMLElement} el */
  function removeItemWithAnimation(el) {
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  /* ── Handlers ──────────────────────────────── */

  function handleAdd() {
    const text = taskInput.value.trim();
    if (!text) {
      taskInput.focus();
      shakeInput();
      return;
    }
    tasks = Storage.addTask(tasks, text);
    Storage.saveTasks(tasks);
    taskInput.value = '';
    taskInput.focus();
    render();
  }

  /** @param {string} id */
  function handleToggle(id) {
    tasks = Storage.toggleTask(tasks, id);
    Storage.saveTasks(tasks);
    render();
  }

  /** @param {string} id */
  function handleDelete(id) {
    tasks = Storage.deleteTask(tasks, id);
    Storage.saveTasks(tasks);
    render();
  }

  function handleClearCompleted() {
    tasks = Storage.clearCompleted(tasks);
    Storage.saveTasks(tasks);
    render();
  }

  /** @param {'all'|'active'|'completed'} newFilter */
  function handleFilterChange(newFilter) {
    filter = newFilter;
    filterBtns.forEach(btn => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    render();
  }

  function handleThemeToggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Storage.saveTheme(next);
  }

  /* ── Theme ─────────────────────────────────── */

  /** @param {'light'|'dark'} theme */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }

  /* ── Helpers ───────────────────────────────── */

  function shakeInput() {
    taskInput.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 300, easing: 'ease-in-out' }
    );
  }

  /** @param {string} str @returns {string} */
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Bootstrap ─────────────────────────────── */

  function init() {
    // Apply saved theme
    applyTheme(Storage.getTheme());

    // Wire global events
    addBtn.addEventListener('click', handleAdd);

    taskInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleAdd();
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => handleFilterChange(btn.dataset.filter));
    });

    clearBtn.addEventListener('click', handleClearCompleted);

    themeToggle.addEventListener('click', handleThemeToggle);

    // Initial render
    render();
  }

  return { init };
})();

// Kick off
document.addEventListener('DOMContentLoaded', App.init);

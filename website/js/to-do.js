// Selectors
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskTagsInput = document.getElementById('taskTags');
const taskDueInput = document.getElementById('taskDue');
const taskList = document.getElementById('taskList');
const filterStatus = document.getElementById('filterStatus');
const sortBy = document.getElementById('sortBy');
const searchInput = document.getElementById('searchInput');
const clearCompletedBtn = document.getElementById('clearCompleted');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFile');

let tasks = [];
let undoStack = [];
let undoTimeoutId = null;

// Utility: Generate simple UUID
function generateId() {
  return 'xxxx-xxxx-xxxx'.replace(/[x]/g, () =>
    ((Math.random() * 16) | 0).toString(16)
  );
}

// Load tasks from localStorage
function loadTasks() {
  const data = localStorage.getItem('tasks');
  tasks = data ? JSON.parse(data) : [];
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Debounce function for inputs
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Sort tasks according to current sort method
function sortTasks(arr) {
  return arr.slice().sort((a, b) => {
    if (sortBy.value === 'newest') return b.createdAt - a.createdAt;
    if (sortBy.value === 'oldest') return a.createdAt - b.createdAt;
    if (sortBy.value === 'due-asc') {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    }
    if (sortBy.value === 'due-desc') {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(b.due) - new Date(a.due);
    }
    return 0;
  });
}

// Filter and search tasks
function filterAndSearchTasks() {
  let filtered = tasks.filter(task => {
    if (filterStatus.value === 'active') return !task.completed;
    if (filterStatus.value === 'completed') return task.completed;
    return true;
  });

  const searchText = searchInput.value.trim().toLowerCase();
  if (searchText) {
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchText) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchText))
    );
  }

  return sortTasks(filtered);
}

// Render tasks
function renderTasks() {
  taskList.innerHTML = '';
  const visibleTasks = filterAndSearchTasks();

  if (visibleTasks.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.style.textAlign = 'center';
    emptyLi.style.color = '#888';
    emptyLi.textContent = 'No tasks found';
    taskList.appendChild(emptyLi);
    return;
  }

  visibleTasks.forEach(task => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
  });
}

// Create task list item with inline edit support
function createTaskElement(task) {
  const li = document.createElement('li');
  li.classList.toggle('completed', task.completed);
  li.dataset.id = task.id;

  // Info container
  const info = document.createElement('div');
  info.className = 'task-info';

  // Title - inline editable
  const titleEl = document.createElement('input');
  titleEl.type = 'text';
  titleEl.className = 'task-title';
  titleEl.value = task.title;
  titleEl.title = 'Click to edit task title';
  titleEl.readOnly = true;

  // Make editable on double click
  titleEl.addEventListener('dblclick', () => {
    titleEl.readOnly = false;
    titleEl.focus();
  });

  // Save changes on blur or Enter key
  function saveTitleEdit() {
    if (!titleEl.readOnly) {
      const val = titleEl.value.trim();
      if (val === '') {
        alert('Task title cannot be empty.');
        titleEl.value = task.title;
      } else if (val !== task.title) {
        task.title = val;
        saveTasks();
        renderTasks();
      }
      titleEl.readOnly = true;
    }
  }
  titleEl.addEventListener('blur', saveTitleEdit);
  titleEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      titleEl.blur();
    } else if (e.key === 'Escape') {
      titleEl.value = task.title;
      titleEl.readOnly = true;
    }
  });

  // Click title toggles complete
  titleEl.addEventListener('click', () => {
    if (titleEl.readOnly) toggleTaskComplete(task.id);
  });

  info.appendChild(titleEl);

  // Tags display (comma separated, editable on dblclick)
  const tagsEl = document.createElement('input');
  tagsEl.type = 'text';
  tagsEl.className = 'task-tags';
  tagsEl.value = task.tags.join(', ');
  tagsEl.readOnly = true;
  tagsEl.title = 'Click to edit tags';
  tagsEl.style.fontSize = '0.8rem';
  tagsEl.style.color = '#999';
  tagsEl.style.marginTop = '3px';

  tagsEl.addEventListener('dblclick', () => {
    tagsEl.readOnly = false;
    tagsEl.focus();
  });

  function saveTagsEdit() {
    if (!tagsEl.readOnly) {
      const tagsArr = tagsEl.value
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      task.tags = tagsArr;
      saveTasks();
      renderTasks();
      tagsEl.readOnly = true;
    }
  }
  tagsEl.addEventListener('blur', saveTagsEdit);
  tagsEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      tagsEl.blur();
    } else if (e.key === 'Escape') {
      tagsEl.value = task.tags.join(', ');
      tagsEl.readOnly = true;
    }
  });

  info.appendChild(tagsEl);

  // Due date display + inline edit on dblclick
  const dueEl = document.createElement('input');
  dueEl.type = 'date';
  dueEl.className = 'task-due';
  dueEl.value = task.due || '';
  dueEl.readOnly = true;
  dueEl.style.marginTop = '3px';
  dueEl.title = 'Click to edit due date';

  dueEl.addEventListener('dblclick', () => {
    dueEl.readOnly = false;
    dueEl.focus();
  });

  dueEl.addEventListener('blur', () => {
    if (!dueEl.readOnly) {
      task.due = dueEl.value || null;
      saveTasks();
      renderTasks();
      dueEl.readOnly = true;
    }
  });
  dueEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      dueEl.blur();
    } else if (e.key === 'Escape') {
      dueEl.value = task.due || '';
      dueEl.readOnly = true;
    }
  });

  info.appendChild(dueEl);

  li.appendChild(info);

  // Actions container
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  // Complete toggle button (icon)
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.title = task.completed ? 'Mark as Active' : 'Mark as Completed';
  toggleBtn.innerHTML = task.completed ? '✅' : '⬜';
  toggleBtn.addEventListener('click', () => toggleTaskComplete(task.id));
  actions.appendChild(toggleBtn);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.title = 'Delete task';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.addEventListener('click', () => confirmDeleteTask(task.id));
  actions.appendChild(deleteBtn);

  li.appendChild(actions);

  return li;
}

// Toggle task complete
function toggleTaskComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

// Confirm delete with modal (custom)
function confirmDeleteTask(id) {
  // Create modal elements
  const modalBg = document.createElement('div');
  modalBg.style.position = 'fixed';
  modalBg.style.top = 0;
  modalBg.style.left = 0;
  modalBg.style.width = '100vw';
  modalBg.style.height = '100vh';
  modalBg.style.background = 'rgba(0,0,0,0.5)';
  modalBg.style.display = 'flex';
  modalBg.style.alignItems = 'center';
  modalBg.style.justifyContent = 'center';
  modalBg.style.zIndex = 9999;

  const modalBox = document.createElement('div');
  modalBox.style.background = '#fff';
  modalBox.style.padding = '20px 30px';
  modalBox.style.borderRadius = '8px';
  modalBox.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
  modalBox.style.textAlign = 'center';
  modalBox.style.maxWidth = '300px';

  const msg = document.createElement('p');
  msg.textContent = 'Are you sure you want to delete this task?';
  msg.style.marginBottom = '20px';
  modalBox.appendChild(msg);

  const btnYes = document.createElement('button');
  btnYes.textContent = 'Yes, delete';
  btnYes.style.marginRight = '15px';
  btnYes.style.padding = '8px 15px';
  btnYes.style.background = '#e74c3c';
  btnYes.style.color = 'white';
  btnYes.style.border = 'none';
  btnYes.style.borderRadius = '6px';
  btnYes.style.cursor = 'pointer';

  const btnNo = document.createElement('button');
  btnNo.textContent = 'Cancel';
  btnNo.style.padding = '8px 15px';
  btnNo.style.background = '#aaa';
  btnNo.style.color = 'white';
  btnNo.style.border = 'none';
  btnNo.style.borderRadius = '6px';
  btnNo.style.cursor = 'pointer';

  modalBox.appendChild(btnYes);
  modalBox.appendChild(btnNo);
  modalBg.appendChild(modalBox);
  document.body.appendChild(modalBg);

  // Button handlers
  btnYes.addEventListener('click', () => {
    deleteTask(id);
    document.body.removeChild(modalBg);
  });

  btnNo.addEventListener('click', () => {
    document.body.removeChild(modalBg);
  });
}

// Delete task with fade out animation
function deleteTask(id) {
  const li = taskList.querySelector(`li[data-id="${id}"]`);
  if (!li) return;

  // Animate fade out and slide
  li.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  li.style.opacity = '0';
  li.style.transform = 'translateX(-30px)';

  setTimeout(() => {
    // Remove from data and save
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();

    // Save to undo stack
    undoStack.push({ action: 'delete', task: tasks.find(t => t.id === id) });
    renderTasks();

    showUndoClearCompleted(); // reset undo toast if any
  }, 400);
}

// Add new task handler
taskForm.addEventListener('submit', e => {
  e.preventDefault();

  const title = taskInput.value.trim();
  if (!title) {
    alert('Task title cannot be empty.');
    return;
  }

  const tags = taskTagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const due = taskDueInput.value || null;

  const newTask = {
    id: generateId(),
    title,
    tags,
    due,
    completed: false,
    createdAt: Date.now(),
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  taskForm.reset();
});

// Clear completed tasks with undo
clearCompletedBtn.addEventListener('click', () => {
  const completedTasks = tasks.filter(t => t.completed);
  if (completedTasks.length === 0) {
    alert('No completed tasks to clear.');
    return;
  }

  // Save for undo
  undoStack.push({ action: 'clearCompleted', tasks: completedTasks });

  // Remove completed tasks
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();

  showUndoClearCompleted();
});

// Undo clear completed notification
function showUndoClearCompleted() {
  clearTimeout(undoTimeoutId);

  let undoToast = document.getElementById('undoToast');
  if (!undoToast) {
    undoToast = document.createElement('div');
    undoToast.id = 'undoToast';
    undoToast.style.position = 'fixed';
    undoToast.style.bottom = '20px';
    undoToast.style.left = '50%';
    undoToast.style.transform = 'translateX(-50%)';
    undoToast.style.background = '#333';
    undoToast.style.color = '#fff';
    undoToast.style.padding = '10px 20px';
    undoToast.style.borderRadius = '30px';
    undoToast.style.fontSize = '1rem';
    undoToast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    undoToast.style.zIndex = 10000;
    undoToast.style.display = 'flex';
    undoToast.style.alignItems = 'center';
    undoToast.style.gap = '15px';

    const undoText = document.createElement('span');
    undoText.textContent = 'Completed tasks cleared';

    const undoBtn = document.createElement('button');
    undoBtn.textContent = 'Undo';
    undoBtn.style.background = '#4a90e2';
    undoBtn.style.color = '#fff';
    undoBtn.style.border = 'none';
    undoBtn.style.borderRadius = '15px';
    undoBtn.style.padding = '5px 15px';
    undoBtn.style.cursor = 'pointer';
    undoBtn.style.fontWeight = '600';

    undoBtn.addEventListener('click', () => {
      undoClearCompleted();
      hideUndoToast();
    });

    undoToast.appendChild(undoText);
    undoToast.appendChild(undoBtn);
    document.body.appendChild(undoToast);
  }

  undoToast.style.display = 'flex';

  undoTimeoutId = setTimeout(() => {
    hideUndoToast();
    undoStack = [];
  }, 5000);
}

function hideUndoToast() {
  const undoToast = document.getElementById('undoToast');
  if (undoToast) {
    undoToast.style.display = 'none';
  }
}

// Undo last clear completed
function undoClearCompleted() {
  const last = undoStack.pop();
  if (!last || last.action !== 'clearCompleted') return;
  tasks = tasks.concat(last.tasks);
  saveTasks();
  renderTasks();
}

// Event listeners for filter, sort, search (with debounce)
filterStatus.addEventListener('change', renderTasks);
sortBy.addEventListener('change', renderTasks);
searchInput.addEventListener('input', debounce(renderTasks, 300));

// Export tasks as JSON file
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.json';
  a.click();

  URL.revokeObjectURL(url);
});

// Import tasks from JSON file
importFileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedTasks = JSON.parse(reader.result);
      if (Array.isArray(importedTasks)) {
        // Simple validation
        importedTasks.forEach(t => {
          if (!t.id) t.id = generateId();
          if (!t.title) t.title = 'Untitled Task';
          if (!Array.isArray(t.tags)) t.tags = [];
          if (!t.createdAt) t.createdAt = Date.now();
        });

        tasks = importedTasks;
        saveTasks();
        renderTasks();
      } else {
        alert('Invalid file format.');
      }
    } catch (error) {
      alert('Error reading file: ' + error.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// Initialize
loadTasks();
renderTasks();

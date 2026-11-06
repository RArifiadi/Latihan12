/* ══════════════════════════════════════════════════════════════
   Life Dashboard – app.js
   Features:
     • Live clock & date display
     • Time-based greeting with custom name (Challenge 2)
     • Focus / Pomodoro timer with configurable duration (Challenge 3)
     • To-Do list – add / edit (contenteditable) / check / delete
     • Quick Links – add & remove, stored in localStorage
     • Light / Dark mode toggle (Challenge 1)
     • Settings modal for name + Pomodoro duration
   ══════════════════════════════════════════════════════════════ */

// ─── Storage helpers ──────────────────────────────────────────
const store = {
  get: (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// ─── State ────────────────────────────────────────────────────
let tasks         = store.get('dashboard_tasks', []);
let links         = store.get('dashboard_links', [
  { name: 'Google',   url: 'https://google.com' },
  { name: 'Gmail',    url: 'https://mail.google.com' },
  { name: 'Calendar', url: 'https://calendar.google.com' },
]);
let isDark        = store.get('dashboard_dark', false);
let userName      = store.get('dashboard_name', '');
let pomoDuration  = store.get('dashboard_pomodoro', 25); // minutes

let timerSeconds  = pomoDuration * 60;
let timerInterval = null;
let timerRunning  = false;

// ─── DOM refs ─────────────────────────────────────────────────
const clockEl       = document.getElementById('clock');
const dateEl        = document.getElementById('date-display');
const greetingEl    = document.getElementById('greeting');

const timerDisplay  = document.getElementById('timer-display');
const startBtn      = document.getElementById('start-btn');
const stopBtn       = document.getElementById('stop-btn');
const resetBtn      = document.getElementById('reset-btn');

const taskInput     = document.getElementById('task-input');
const addTaskBtn    = document.getElementById('add-task-btn');
const taskList      = document.getElementById('task-list');

const linkName      = document.getElementById('link-name');
const linkUrl       = document.getElementById('link-url');
const addLinkBtn    = document.getElementById('add-link-btn');
const linksContainer= document.getElementById('links-container');

const themeToggle   = document.getElementById('theme-toggle');
const settingsBtn   = document.getElementById('settings-btn');
const settingsOverlay= document.getElementById('settings-overlay');
const settingName   = document.getElementById('setting-name');
const settingPomodoro= document.getElementById('setting-pomodoro');
const saveSettings  = document.getElementById('save-settings');
const closeSettings = document.getElementById('close-settings');

// ══════════════════════════════════════════
// 1. CLOCK & GREETING
// ══════════════════════════════════════════
function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;

  // Date string
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  dateEl.textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  // Greeting
  const hour = now.getHours();
  let period;
  if (hour < 12)      period = 'Good Morning';
  else if (hour < 17) period = 'Good Afternoon';
  else if (hour < 20) period = 'Good Evening';
  else                period = 'Good Night';

  const name = userName.trim();
  greetingEl.textContent = name ? `${period}, ${name}!` : `${period}!`;
}

setInterval(updateClock, 1000);
updateClock();

// ══════════════════════════════════════════
// 2. FOCUS TIMER
// ══════════════════════════════════════════
function formatTime(totalSecs) {
  const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const s = String(totalSecs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.textContent = '00:00';
      // Subtle alert when timer ends
      timerDisplay.style.color = 'var(--danger)';
      setTimeout(() => { timerDisplay.style.color = ''; }, 3000);
      return;
    }
    timerSeconds--;
    renderTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function resetTimer() {
  stopTimer();
  timerSeconds = pomoDuration * 60;
  timerDisplay.style.color = '';
  renderTimer();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

renderTimer();

// ══════════════════════════════════════════
// 3. TO-DO LIST
// ══════════════════════════════════════════
function saveTasks() {
  store.set('dashboard_tasks', tasks);
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => {
      tasks[index].done = checkbox.checked;
      label.classList.toggle('done', checkbox.checked);
      saveTasks();
    });

    // Editable label
    const label = document.createElement('span');
    label.className = 'task-label' + (task.done ? ' done' : '');
    label.textContent = task.text;
    label.contentEditable = 'true';
    label.spellcheck = false;
    label.setAttribute('aria-label', 'Edit task');
    // Save edits on blur
    label.addEventListener('blur', () => {
      const newText = label.textContent.trim();
      if (newText === '') {
        // Remove empty tasks on blur
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
        return;
      }
      tasks[index].text = newText;
      saveTasks();
    });
    // Prevent newlines in the editable span
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); label.blur(); }
    });

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-task-btn';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ text, done: false });
  saveTasks();
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

renderTasks();

// ══════════════════════════════════════════
// 4. QUICK LINKS
// ══════════════════════════════════════════
function saveLinks() {
  store.set('dashboard_links', links);
}

function renderLinks() {
  linksContainer.innerHTML = '';
  links.forEach((link, index) => {
    const pill = document.createElement('a');
    pill.className = 'link-pill';
    pill.href = link.url;
    pill.target = '_blank';
    pill.rel = 'noopener noreferrer';
    pill.setAttribute('aria-label', `Open ${link.name}`);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = link.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-link';
    removeBtn.textContent = '✕';
    removeBtn.title = `Remove ${link.name}`;
    removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });

    pill.appendChild(nameSpan);
    pill.appendChild(removeBtn);
    linksContainer.appendChild(pill);
  });
}

function addLink() {
  const name = linkName.value.trim();
  let url    = linkUrl.value.trim();
  if (!name || !url) return;

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  links.push({ name, url });
  saveLinks();
  renderLinks();
  linkName.value = '';
  linkUrl.value  = '';
  linkName.focus();
}

addLinkBtn.addEventListener('click', addLink);
linkUrl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

renderLinks();

// ══════════════════════════════════════════
// 5. LIGHT / DARK MODE  (Challenge 1)
// ══════════════════════════════════════════
function applyTheme() {
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
  themeToggle.textContent = isDark ? '☀ Light Mode' : '🌙 Dark Mode';
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  store.set('dashboard_dark', isDark);
  applyTheme();
});

applyTheme();

// ══════════════════════════════════════════
// 6. SETTINGS MODAL
//    – Custom name  (Challenge 2)
//    – Change Pomodoro time  (Challenge 3)
// ══════════════════════════════════════════
function openSettings() {
  settingName.value     = userName;
  settingPomodoro.value = pomoDuration;
  settingsOverlay.classList.remove('hidden');
  settingName.focus();
}

function closeSettingsModal() {
  settingsOverlay.classList.add('hidden');
}

settingsBtn.addEventListener('click', openSettings);
closeSettings.addEventListener('click', closeSettingsModal);
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeSettingsModal();
});

saveSettings.addEventListener('click', () => {
  const newName = settingName.value.trim();
  const newPomo = parseInt(settingPomodoro.value, 10);

  userName = newName;
  store.set('dashboard_name', userName);

  if (!isNaN(newPomo) && newPomo >= 1 && newPomo <= 120) {
    pomoDuration = newPomo;
    store.set('dashboard_pomodoro', pomoDuration);
    // Only reset timer if it isn't currently running
    if (!timerRunning) {
      timerSeconds = pomoDuration * 60;
      renderTimer();
    }
  }

  updateClock(); // refresh greeting with new name immediately
  closeSettingsModal();
});

// Allow keyboard Escape to close the modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsOverlay.classList.contains('hidden')) {
    closeSettingsModal();
  }
});

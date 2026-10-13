const STORAGE_KEY = 'ciclalia-registro-v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function safeLoad() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      periodStarts: Array.isArray(stored.periodStarts) ? stored.periodStarts.filter(isIsoDate) : [],
      cycleLength: clampNumber(stored.cycleLength, 15, 120, 28),
      periodLength: clampNumber(stored.periodLength, 1, 20, 5),
      symptoms: Array.isArray(stored.symptoms) ? stored.symptoms.filter(item => item && isIsoDate(item.date) && Array.isArray(item.items)) : []
    };
  } catch {
    return { periodStarts: [], cycleLength: 28, periodLength: 5, symptoms: [] };
  }
}

let state = safeLoad();
let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDate = toIsoDate(new Date());
let toastTimer;

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback;
}
function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseIsoDate(value).getTime());
}
function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseIsoDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
function addDays(date, days) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}
function diffDays(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}
function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value || !isIsoDate(value)) return '—';
  return new Intl.DateTimeFormat('es', options).format(parseIsoDate(value));
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showToast('No se pudo guardar. Revisa el espacio disponible en este navegador.');
    return false;
  }
}
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}
function updateSettingsControls() {
  $('#cycle-length').value = state.cycleLength;
  $('#period-length').value = state.periodLength;
  $('#period-start').value = state.periodStarts.at(-1) || '';
}
function cyclePrediction() {
  const last = state.periodStarts.at(-1);
  if (!last) return null;
  const start = parseIsoDate(last);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const estimated = addDays(start, state.cycleLength);
  return { last, estimated, cycleDay: diffDays(start, today) + 1, daysUntil: diffDays(today, estimated) };
}
function dateHasSymptoms(dateIso) {
  return state.symptoms.some(item => item.date === dateIso);
}
function isRecordedPeriod(date) {
  return state.periodStarts.some(startIso => {
    const delta = diffDays(parseIsoDate(startIso), date);
    return delta >= 0 && delta < state.periodLength;
  });
}
function isEstimatedPeriod(date) {
  const prediction = cyclePrediction();
  if (!prediction || prediction.daysUntil < 0) return false;
  const delta = diffDays(prediction.estimated, date);
  return delta >= 0 && delta < state.periodLength && !isRecordedPeriod(date);
}
function renderCalendar() {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  $('#calendar-month').textContent = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(displayedMonth);
  const grid = $('#calendar-grid');
  grid.replaceChildren();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstWeekday; i += 1) {
    const empty = document.createElement('span');
    empty.className = 'day-cell is-empty';
    empty.setAttribute('aria-hidden', 'true');
    grid.append(empty);
  }
  const todayIso = toIsoDate(new Date());
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const iso = toIsoDate(date);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day-cell';
    button.textContent = String(day);
    button.dataset.date = iso;
    button.setAttribute('aria-label', formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    button.setAttribute('aria-pressed', String(iso === selectedDate));
    if (iso === todayIso) button.classList.add('is-today');
    if (iso === selectedDate) button.classList.add('is-selected');
    if (isRecordedPeriod(date)) button.classList.add('is-period');
    else if (isEstimatedPeriod(date)) button.classList.add('is-estimate');
    if (dateHasSymptoms(iso)) button.classList.add('is-symptom');
    grid.append(button);
  }
  $('#selected-date-label').textContent = formatDate(selectedDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  renderPrediction();
}
function renderPrediction() {
  const prediction = cyclePrediction();
  if (!prediction) {
    $('#next-period').textContent = 'Agrega una fecha para empezar';
    $('#next-period-note').textContent = 'Cada ciclo puede variar.';
    $('#cycle-status').textContent = '';
    return;
  }
  $('#next-period').textContent = formatDate(toIsoDate(prediction.estimated));
  $('#next-period-note').textContent = prediction.daysUntil < 0 ? `La estimación venció hace ${Math.abs(prediction.daysUntil)} días.` : prediction.daysUntil === 0 ? 'La estimación es para hoy.' : prediction.daysUntil === 1 ? 'La estimación es para mañana.' : `Aproximadamente en ${prediction.daysUntil} días.`;
  const status = prediction.cycleDay > state.cycleLength ? `Han pasado ${prediction.cycleDay - 1} días desde el último inicio registrado. Si tu periodo ya comenzó, agrega la nueva fecha.` : `Día ${prediction.cycleDay} de tu ciclo, según la última fecha que registraste.`;
  $('#cycle-status').textContent = status;
}
function renderSymptoms() {
  const sorted = [...state.symptoms].sort((a, b) => b.date.localeCompare(a.date));
  const list = $('#symptom-list');
  list.replaceChildren();
  $('#symptom-count').textContent = `${sorted.length} ${sorted.length === 1 ? 'registro' : 'registros'}`;
  if (sorted.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Todavía no hay síntomas guardados. Puedes empezar cuando quieras.';
    list.append(empty);
  }
  sorted.slice(0, 24).forEach(entry => {
    const article = document.createElement('article');
    article.className = 'symptom-entry';
    const main = document.createElement('div');
    main.className = 'symptom-entry-main';
    const time = document.createElement('time');
    time.dateTime = entry.date;
    time.textContent = formatDate(entry.date, { day: 'numeric', month: 'long', year: 'numeric' });
    const title = document.createElement('strong');
    title.textContent = `${entry.items.join(', ')} · intensidad ${entry.intensity}/5`;
    main.append(time, title);
    if (entry.note) {
      const note = document.createElement('p');
      note.textContent = entry.note;
      main.append(note);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-symptom';
    remove.dataset.deleteSymptom = entry.id;
    remove.textContent = 'Quitar';
    remove.setAttribute('aria-label', `Quitar registro del ${formatDate(entry.date)}`);
    article.append(main, remove);
    list.append(article);
  });
  renderDoctorReport(sorted);
}
function renderDoctorReport(sorted = [...state.symptoms].sort((a, b) => b.date.localeCompare(a.date))) {
  const content = $('#doctor-summary-content');
  content.replaceChildren();
  if (sorted.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Aquí aparecerán las fechas y síntomas que guardes.';
    content.append(p);
    return;
  }
  const recent = sorted.slice(0, 20);
  const intro = document.createElement('p');
  intro.textContent = `Incluye ${recent.length} ${recent.length === 1 ? 'registro reciente' : 'registros recientes'}. Preparado desde los datos de este dispositivo.`;
  content.append(intro);
  recent.forEach(entry => {
    const p = document.createElement('p');
    p.className = 'report-line';
    const date = document.createElement('span');
    date.className = 'report-date';
    date.textContent = `${formatDate(entry.date, { day: 'numeric', month: 'short', year: 'numeric' })}: `;
    p.append(date, document.createTextNode(`${entry.items.join(', ')} · intensidad ${entry.intensity}/5${entry.note ? ` · ${entry.note}` : ''}`));
    content.append(p);
  });
}
function refreshCalendarAndLogs() {
  renderCalendar();
  renderSymptoms();
}

$('#prev-month').addEventListener('click', () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  renderCalendar();
});
$('#next-month').addEventListener('click', () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  renderCalendar();
});
$('#calendar-grid').addEventListener('click', event => {
  const day = event.target.closest('button[data-date]');
  if (!day) return;
  selectedDate = day.dataset.date;
  $('#period-start').value = selectedDate;
  $('#symptom-date').value = selectedDate;
  renderCalendar();
});
$('#period-form').addEventListener('submit', event => {
  event.preventDefault();
  const date = $('#period-start').value || selectedDate;
  const cycleLength = Number($('#cycle-length').value);
  const periodLength = Number($('#period-length').value);
  if (!isIsoDate(date)) return showToast('Elige una fecha válida para guardar.');
  if (date > toIsoDate(new Date())) return showToast('El inicio del periodo debe ser hoy o una fecha anterior.');
  if (!Number.isInteger(cycleLength) || cycleLength < 15 || cycleLength > 120) return showToast('El ciclo debe estar entre 15 y 120 días.');
  if (!Number.isInteger(periodLength) || periodLength < 1 || periodLength > 20) return showToast('El periodo debe estar entre 1 y 20 días.');
  state.cycleLength = cycleLength;
  state.periodLength = periodLength;
  state.periodStarts = [...new Set([...state.periodStarts, date])].sort();
  selectedDate = date;
  displayedMonth = new Date(parseIsoDate(date).getFullYear(), parseIsoDate(date).getMonth(), 1);
  persist();
  refreshCalendarAndLogs();
  showToast('Fecha guardada en este dispositivo.');
});
$('#cycle-length').addEventListener('change', () => {
  const value = Number($('#cycle-length').value);
  if (Number.isInteger(value) && value >= 15 && value <= 120) {
    state.cycleLength = value;
    persist();
    renderCalendar();
  }
});
$('#period-length').addEventListener('change', () => {
  const value = Number($('#period-length').value);
  if (Number.isInteger(value) && value >= 1 && value <= 20) {
    state.periodLength = value;
    persist();
    renderCalendar();
  }
});
$('#symptom-date').value = selectedDate;
$('#symptom-form').addEventListener('submit', event => {
  event.preventDefault();
  const date = $('#symptom-date').value;
  const items = $$('input[name="symptom"]:checked').map(input => input.value);
  if (!isIsoDate(date)) return showToast('Elige una fecha válida.');
  if (date > toIsoDate(new Date())) return showToast('Elige hoy o una fecha anterior para tu registro.');
  if (items.length === 0) return showToast('Elige al menos un síntoma para guardar.');
  const intensity = Number($('#symptom-intensity').value);
  const note = $('#symptom-notes').value.trim();
  state.symptoms.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date, items, intensity, note });
  persist();
  event.currentTarget.reset();
  $('#symptom-date').value = date;
  $('#symptom-intensity').value = 3;
  $('#intensity-value').textContent = '3 / 5';
  selectedDate = date;
  const parsed = parseIsoDate(date);
  displayedMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  refreshCalendarAndLogs();
  showToast('Síntoma guardado en este dispositivo.');
});
$('#symptom-intensity').addEventListener('input', event => {
  $('#intensity-value').textContent = `${event.currentTarget.value} / 5`;
});
$('#symptom-list').addEventListener('click', event => {
  const button = event.target.closest('[data-delete-symptom]');
  if (!button) return;
  state.symptoms = state.symptoms.filter(item => item.id !== button.dataset.deleteSymptom);
  persist();
  refreshCalendarAndLogs();
  showToast('Registro quitado de este dispositivo.');
});
$('#print-report-button').addEventListener('click', () => {
  renderDoctorReport();
  window.print();
});
$('#pregnancy-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#pregnancy-lmp').value;
  const result = $('#pregnancy-result');
  result.hidden = false;
  if (!isIsoDate(input)) {
    result.textContent = 'Elige una fecha válida para ver la estimación.';
    return;
  }
  const lastPeriod = parseIsoDate(input);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsed = diffDays(lastPeriod, today);
  if (elapsed < 0) {
    result.textContent = 'La fecha debe ser hoy o anterior.';
    return;
  }
  const weeks = Math.floor(elapsed / 7);
  const days = elapsed % 7;
  const trimester = weeks < 13 ? 'Primer trimestre' : weeks < 28 ? 'Segundo trimestre' : 'Tercer trimestre';
  const dueDate = toIsoDate(addDays(lastPeriod, 280));
  result.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = `Semana ${weeks} + ${days} días · ${trimester}`;
  const span = document.createElement('span');
  span.textContent = `Fecha probable de parto: ${formatDate(dueDate)}. Es un cálculo orientativo; un profesional puede confirmar la edad gestacional.`;
  result.append(strong, span);
});
$('#clear-data-button').addEventListener('click', () => {
  if (!window.confirm('¿Borrar de este navegador todas las fechas y síntomas guardados? Esta acción no se puede deshacer.')) return;
  state = { periodStarts: [], cycleLength: 28, periodLength: 5, symptoms: [] };
  persist();
  updateSettingsControls();
  $('#symptom-date').value = toIsoDate(new Date());
  $('#pregnancy-form').reset();
  $('#pregnancy-result').hidden = true;
  refreshCalendarAndLogs();
  showToast('Se borraron los datos de este navegador.');
});

function enableRevealAnimations() {
  const elements = $$('.topic-section, .source-group, .phase-card, .topic-pill');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  elements.forEach(element => element.classList.add('reveal-ready'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  elements.forEach(element => observer.observe(element));
}

updateSettingsControls();
$('#symptom-date').value = selectedDate;
renderCalendar();
renderSymptoms();
enableRevealAnimations();

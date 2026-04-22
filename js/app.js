import { computeStats, formatDistance, formatPace, toKilometers, weekStartISO, renderWeeklyChart } from './dashboard.js';
import { removeRun, upsertRun } from './runForm.js';
import { exportData, getRuns, getTrainingTargets, overwriteAllData, saveTrainingTargets } from './storage.js';

const dom = {
  form: document.getElementById('run-form'),
  id: document.getElementById('run-id'),
  date: document.getElementById('run-date'),
  distance: document.getElementById('run-distance'),
  unit: document.getElementById('run-unit'),
  duration: document.getElementById('run-duration'),
  effort: document.getElementById('run-effort'),
  notes: document.getElementById('run-notes'),
  cancelEdit: document.getElementById('cancel-edit-btn'),
  historyBody: document.getElementById('run-history-body'),
  historyFilter: document.getElementById('history-filter'),
  historySort: document.getElementById('history-sort'),
  statTotalDistance: document.getElementById('stat-total-distance'),
  statLongestRun: document.getElementById('stat-longest-run'),
  statAveragePace: document.getElementById('stat-average-pace'),
  weeklyChart: document.getElementById('weekly-mileage-chart'),
  trainingPlanBody: document.getElementById('training-plan-body'),
  exportBtn: document.getElementById('export-btn'),
  importFile: document.getElementById('import-file'),
};

const formatDuration = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs ? `${hrs}h ${mins}m` : `${mins}m`;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const resetForm = () => {
  dom.form.reset();
  dom.id.value = '';
  dom.cancelEdit.hidden = true;
};

const getFilteredSortedRuns = () => {
  const term = dom.historyFilter.value.trim().toLowerCase();
  const sortBy = dom.historySort.value;

  const runs = getRuns().filter((run) => {
    if (!term) {
      return true;
    }
    return run.date.toLowerCase().includes(term) || run.notes.toLowerCase().includes(term);
  });

  const sorters = {
    'date-desc': (a, b) => b.date.localeCompare(a.date),
    'date-asc': (a, b) => a.date.localeCompare(b.date),
    'distance-desc': (a, b) => toKilometers(b.distance, b.unit) - toKilometers(a.distance, a.unit),
    'distance-asc': (a, b) => toKilometers(a.distance, a.unit) - toKilometers(b.distance, b.unit),
    'duration-asc': (a, b) => a.duration - b.duration,
    'duration-desc': (a, b) => b.duration - a.duration,
  };

  runs.sort(sorters[sortBy] || sorters['date-desc']);
  return runs;
};

const renderHistory = () => {
  const runs = getFilteredSortedRuns();

  if (!runs.length) {
    dom.historyBody.innerHTML = '<tr><td colspan="7">No runs found.</td></tr>';
    return;
  }

  dom.historyBody.innerHTML = runs
    .map((run) => {
      const km = toKilometers(run.distance, run.unit);
      const pace = run.duration / km;
      return `<tr>
        <td>${escapeHtml(run.date)}</td>
        <td>${escapeHtml(run.distance)} ${escapeHtml(run.unit)}</td>
        <td>${formatDuration(run.duration)}</td>
        <td>${formatPace(pace)}</td>
        <td>${escapeHtml(run.effort)}</td>
        <td>${escapeHtml(run.notes || '-')}</td>
        <td>
          <button type="button" data-action="edit" data-id="${escapeHtml(run.id)}">Edit</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(run.id)}" class="secondary">Delete</button>
        </td>
      </tr>`;
    })
    .join('');
};

const renderDashboard = () => {
  const stats = computeStats(getRuns());
  dom.statTotalDistance.textContent = formatDistance(stats.totalKm);
  dom.statLongestRun.textContent = formatDistance(stats.longestKm);
  dom.statAveragePace.textContent = formatPace(stats.averagePace);
  renderWeeklyChart(dom.weeklyChart, stats.weeklyTotals);
};

const renderTrainingPlan = () => {
  const runs = getRuns();
  const targets = getTrainingTargets();
  const { weeklyTotals } = computeStats(runs);
  const weeks = Array.from(new Set([...Object.keys(weeklyTotals), ...Object.keys(targets)])).sort((a, b) =>
    a.localeCompare(b),
  );

  if (!weeks.length) {
    const thisWeek = weekStartISO(new Date().toISOString().slice(0, 10));
    weeks.push(thisWeek);
  }

  dom.trainingPlanBody.innerHTML = weeks
    .map((week) => {
      const target = Number(targets[week] || 0);
      const actual = Number((weeklyTotals[week] || 0).toFixed(1));
      const met = actual >= target;
      const statusClass = met ? 'status-met' : 'status-short';
      const statusText = target === 0 ? 'No target' : met ? 'On track' : 'Below target';

      return `<tr>
        <td>${escapeHtml(week)}</td>
        <td><input type="number" min="0" step="0.1" data-target-week="${escapeHtml(week)}" value="${target}" /></td>
        <td>${actual.toFixed(1)}</td>
        <td class="${statusClass}">${statusText}</td>
      </tr>`;
    })
    .join('');
};

const refresh = () => {
  renderHistory();
  renderDashboard();
  renderTrainingPlan();
};

const fillFormForEdit = (run) => {
  dom.id.value = run.id;
  dom.date.value = run.date;
  dom.distance.value = run.distance;
  dom.unit.value = run.unit;
  dom.duration.value = run.duration;
  dom.effort.value = run.effort;
  dom.notes.value = run.notes;
  dom.cancelEdit.hidden = false;
  dom.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const onFormSubmit = (event) => {
  event.preventDefault();

  upsertRun({
    id: dom.id.value || undefined,
    date: dom.date.value,
    distance: dom.distance.value,
    unit: dom.unit.value,
    duration: dom.duration.value,
    effort: dom.effort.value,
    notes: dom.notes.value,
  });

  resetForm();
  refresh();
};

const onHistoryClick = (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const id = button.dataset.id;
  if (button.dataset.action === 'delete') {
    removeRun(id);
    refresh();
    return;
  }

  const run = getRuns().find((entry) => entry.id === id);
  if (run) {
    fillFormForEdit(run);
  }
};

const onTrainingTargetChange = (event) => {
  const input = event.target.closest('input[data-target-week]');
  if (!input) {
    return;
  }

  const week = input.dataset.targetWeek;
  const value = Number.parseFloat(input.value);
  const targets = getTrainingTargets();
  targets[week] = Number.isFinite(value) ? value : 0;
  saveTrainingTargets(targets);
  renderTrainingPlan();
};

const onExport = () => {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marathon-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const onImport = async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.runs) || typeof data.trainingTargets !== 'object' || data.trainingTargets === null) {
      alert('Invalid backup format.');
      return;
    }

    const safeRuns = data.runs
      .filter((run) => run && typeof run === 'object')
      .map((run) => ({
        id: typeof run.id === 'string' ? run.id : crypto.randomUUID(),
        date: typeof run.date === 'string' ? run.date : '',
        distance: Number.parseFloat(run.distance) || 0,
        unit: run.unit === 'mi' ? 'mi' : 'km',
        duration: Number.parseInt(run.duration, 10) || 0,
        effort: Math.max(1, Math.min(10, Number.parseInt(run.effort, 10) || 1)),
        notes: typeof run.notes === 'string' ? run.notes : '',
      }))
      .filter((run) => run.date && run.distance > 0 && run.duration > 0);

    const safeTargets = Object.fromEntries(
      Object.entries(data.trainingTargets).map(([week, target]) => [week, Number.parseFloat(target) || 0]),
    );

    overwriteAllData({
      runs: safeRuns,
      trainingTargets: safeTargets,
    });
    resetForm();
    refresh();
  } catch {
    alert('Could not import file.');
  } finally {
    event.target.value = '';
  }
};

const init = () => {
  dom.form.addEventListener('submit', onFormSubmit);
  dom.cancelEdit.addEventListener('click', resetForm);
  dom.historyBody.addEventListener('click', onHistoryClick);
  dom.historyFilter.addEventListener('input', renderHistory);
  dom.historySort.addEventListener('change', renderHistory);
  dom.trainingPlanBody.addEventListener('change', onTrainingTargetChange);
  dom.exportBtn.addEventListener('click', onExport);
  dom.importFile.addEventListener('change', onImport);
  refresh();
};

init();

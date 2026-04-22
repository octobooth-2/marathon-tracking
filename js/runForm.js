import { getRuns, saveRuns } from './storage.js';

const toNumber = (value) => Number.parseFloat(value);

export const upsertRun = (runInput) => {
  const runs = getRuns();
  const run = {
    id: runInput.id || crypto.randomUUID(),
    date: runInput.date,
    distance: toNumber(runInput.distance),
    unit: runInput.unit,
    duration: Number.parseInt(runInput.duration, 10),
    effort: Number.parseInt(runInput.effort, 10),
    notes: runInput.notes?.trim() || '',
  };

  const existingIndex = runs.findIndex((entry) => entry.id === run.id);
  if (existingIndex >= 0) {
    runs[existingIndex] = run;
  } else {
    runs.push(run);
  }

  saveRuns(runs);
};

export const removeRun = (id) => {
  const runs = getRuns().filter((run) => run.id !== id);
  saveRuns(runs);
};

const RUNS_KEY = 'marathonTracker:runs';
const TRAINING_TARGETS_KEY = 'marathonTracker:trainingTargets';

const parseJson = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const getRuns = () => {
  const raw = localStorage.getItem(RUNS_KEY);
  return raw ? parseJson(raw, []) : [];
};

export const saveRuns = (runs) => {
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
};

export const getTrainingTargets = () => {
  const raw = localStorage.getItem(TRAINING_TARGETS_KEY);
  return raw ? parseJson(raw, {}) : {};
};

export const saveTrainingTargets = (targets) => {
  localStorage.setItem(TRAINING_TARGETS_KEY, JSON.stringify(targets));
};

export const overwriteAllData = ({ runs = [], trainingTargets = {} }) => {
  saveRuns(runs);
  saveTrainingTargets(trainingTargets);
};

export const exportData = () => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  runs: getRuns(),
  trainingTargets: getTrainingTargets(),
});

const KM_PER_MI = 1.60934;

export const toKilometers = (distance, unit) => (unit === 'mi' ? distance * KM_PER_MI : distance);

export const formatDistance = (distanceKm) => `${distanceKm.toFixed(1)} km`;

export const formatPace = (minutesPerKm) => {
  if (!Number.isFinite(minutesPerKm) || minutesPerKm <= 0) {
    return '0:00 /km';
  }
  const wholeMinutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - wholeMinutes) * 60);
  const carryMinute = seconds === 60 ? 1 : 0;
  const safeSeconds = seconds === 60 ? 0 : seconds;
  return `${wholeMinutes + carryMinute}:${String(safeSeconds).padStart(2, '0')} /km`;
};

export const weekStartISO = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
};

export const computeStats = (runs) => {
  if (!runs.length) {
    return {
      totalKm: 0,
      longestKm: 0,
      averagePace: 0,
      weeklyTotals: {},
    };
  }

  let totalKm = 0;
  let totalDuration = 0;
  let longestKm = 0;
  const weeklyTotals = {};

  runs.forEach((run) => {
    const distanceKm = toKilometers(run.distance, run.unit);
    totalKm += distanceKm;
    totalDuration += run.duration;
    longestKm = Math.max(longestKm, distanceKm);

    const week = weekStartISO(run.date);
    weeklyTotals[week] = (weeklyTotals[week] || 0) + distanceKm;
  });

  return {
    totalKm,
    longestKm,
    averagePace: totalDuration / totalKm,
    weeklyTotals,
  };
};

let chart;

export const renderWeeklyChart = (canvas, weeklyTotals) => {
  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  const labels = Object.keys(weeklyTotals).sort((a, b) => a.localeCompare(b));
  const data = labels.map((label) => Number(weeklyTotals[label].toFixed(2)));

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Weekly distance (km)',
          data,
          borderWidth: 1,
          backgroundColor: 'rgba(31, 111, 235, 0.55)',
          borderColor: 'rgba(31, 111, 235, 1)',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'km',
          },
        },
      },
    },
  });
};

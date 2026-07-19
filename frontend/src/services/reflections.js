export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function reflectionDayKeys(now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    today: localDayKey(now),
    yesterday: localDayKey(yesterday),
  };
}

function previousDayKey(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return localDayKey(date);
}

export function calculateReflectionStreak(reflections, now = new Date()) {
  const byDay = new Map(reflections.map((item) => [item.day_key, item.status]));
  const { today, yesterday } = reflectionDayKeys(now);

  if (byDay.get(today) === 'slipped') return 0;

  let cursor = byDay.get(today) === 'clean' ? today : yesterday;
  let streak = 0;

  while (byDay.get(cursor) === 'clean') {
    streak += 1;
    cursor = previousDayKey(cursor);
  }

  return streak;
}

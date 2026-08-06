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

/**
 * Gambling-free streak from consecutive "clean" daily reflections.
 *
 * Rules:
 * - Slip today → 0
 * - One-day grace: if today is not confirmed yet, keep counting from yesterday
 * - If BOTH today and yesterday are not clean, the catch-up window is gone → 0
 *   (older clean days cannot keep a live streak)
 */
export function calculateReflectionStreak(reflections, now = new Date()) {
  const byDay = new Map(reflections.map((item) => [item.day_key, item.status]));
  const { today, yesterday } = reflectionDayKeys(now);

  if (byDay.get(today) === 'slipped') return 0;

  const todayClean = byDay.get(today) === 'clean';
  const yesterdayClean = byDay.get(yesterday) === 'clean';

  // Missed more than one day — streak cannot continue.
  if (!todayClean && !yesterdayClean) {
    return 0;
  }

  let cursor = todayClean ? today : yesterday;
  let streak = 0;

  while (byDay.get(cursor) === 'clean') {
    streak += 1;
    cursor = previousDayKey(cursor);
  }

  return streak;
}

/** True when the user can no longer continue a prior run (gap past catch-up). */
export function isStreakCatchUpExpired(reflections, now = new Date()) {
  const byDay = new Map(reflections.map((item) => [item.day_key, item.status]));
  const { today, yesterday } = reflectionDayKeys(now);
  const todayConfirmed = byDay.has(today);
  const yesterdayClean = byDay.get(yesterday) === 'clean';
  const hasOlderClean = reflections.some(
    (item) => item.status === 'clean' && item.day_key !== today && item.day_key !== yesterday
  );

  return !todayConfirmed && !yesterdayClean && hasOlderClean;
}

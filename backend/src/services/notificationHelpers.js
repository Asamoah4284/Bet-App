const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

/**
 * Parts of "now" in an IANA timezone.
 * Falls back to Africa/Accra if the timezone is invalid.
 */
function localTimeParts(date = new Date(), timeZone = 'Africa/Accra') {
  const zone = timeZone || 'Africa/Accra';
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [part.type, part.value])
    );
    return {
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      localDate: `${parts.year}-${parts.month}-${parts.day}`,
      timeZone: zone,
    };
  } catch {
    if (zone !== 'Africa/Accra') {
      return localTimeParts(date, 'Africa/Accra');
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return {
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      localDate: `${year}-${month}-${day}`,
      timeZone: 'UTC',
    };
  }
}

function matchesLocalMinute(prefsHour, prefsMinute, parts) {
  return Number(prefsHour) === parts.hour && Number(prefsMinute) === parts.minute;
}

function crossedMilestones(previousStreak, nextStreak) {
  const prev = Math.max(0, Math.floor(Number(previousStreak) || 0));
  const next = Math.max(0, Math.floor(Number(nextStreak) || 0));
  return STREAK_MILESTONES.filter((milestone) => prev < milestone && next >= milestone);
}

function clampHour(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback;
}

function clampMinute(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 && value <= 59 ? value : fallback;
}

function isValidTimezone(value) {
  if (!value || typeof value !== 'string' || value.length > 64) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  STREAK_MILESTONES,
  localTimeParts,
  matchesLocalMinute,
  crossedMilestones,
  clampHour,
  clampMinute,
  isValidTimezone,
};

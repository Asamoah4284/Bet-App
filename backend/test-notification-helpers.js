const {
  crossedMilestones,
  matchesLocalMinute,
  localTimeParts,
  isValidTimezone,
} = require('./src/services/notificationHelpers');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exitCode = 1;
  } else {
    console.log('ok:', message);
  }
}

assert(crossedMilestones(6, 7).includes(7), 'crosses 7-day milestone');
assert(crossedMilestones(7, 7).length === 0, 'no re-fire at same streak');
assert(crossedMilestones(6, 30).join(',') === '7,14,30', 'crosses multiple milestones');
assert(matchesLocalMinute(20, 0, { hour: 20, minute: 0 }), 'minute match');
assert(!matchesLocalMinute(20, 0, { hour: 20, minute: 1 }), 'minute mismatch');
assert(isValidTimezone('Africa/Accra'), 'valid timezone');
assert(!isValidTimezone('Not/AZone'), 'invalid timezone');

const parts = localTimeParts(new Date('2026-01-15T12:00:00.000Z'), 'UTC');
assert(parts.hour === 12 && parts.minute === 0, 'UTC local parts');
assert(parts.localDate === '2026-01-15', 'UTC local date');

if (!process.exitCode) {
  console.log('All notification helper checks passed.');
}

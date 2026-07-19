import {
  calculateReflectionStreak,
  localDayKey,
  reflectionDayKeys,
} from '../services/reflections';

const row = (day_key, status = 'clean') => ({ day_key, status });
const now = new Date(2026, 0, 10, 12);

describe('daily reflection streaks', () => {
  test('counts consecutive confirmed clean days including today', () => {
    expect(
      calculateReflectionStreak(
        [row('2026-01-10'), row('2026-01-09'), row('2026-01-08')],
        now
      )
    ).toBe(3);
  });

  test('keeps the run ending yesterday while today is unconfirmed', () => {
    expect(calculateReflectionStreak([row('2026-01-09'), row('2026-01-08')], now)).toBe(2);
  });

  test('a confirmed slip today resets the current streak', () => {
    expect(
      calculateReflectionStreak([row('2026-01-10', 'slipped'), row('2026-01-09')], now)
    ).toBe(0);
  });

  test('a missing previous day breaks the run rather than counting silence', () => {
    expect(calculateReflectionStreak([row('2026-01-10'), row('2026-01-08')], now)).toBe(1);
  });

  test('supports a clean catch-up for yesterday across a year boundary', () => {
    const newYear = new Date(2026, 0, 1, 12);
    expect(
      calculateReflectionStreak([row('2025-12-31'), row('2025-12-30')], newYear)
    ).toBe(2);
  });

  test('uses local calendar arithmetic for yesterday', () => {
    const date = new Date(2026, 2, 9, 12);
    expect(reflectionDayKeys(date)).toEqual({
      today: '2026-03-09',
      yesterday: '2026-03-08',
    });
    expect(localDayKey(date)).toBe('2026-03-09');
  });
});

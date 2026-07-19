import { DEFAULT_REMINDERS, parseReminderSettings } from '../store/reminderStore';

jest.mock('../services/localDb', () => ({
  getSetting: jest.fn(),
  setSetting: jest.fn(),
}));

jest.mock('../services/notifications', () => ({
  ensurePermissions: jest.fn(),
  syncReminders: jest.fn(),
  cancelAllReminders: jest.fn(),
}));

describe('parseReminderSettings', () => {
  it('returns defaults for missing or malformed values', () => {
    expect(parseReminderSettings(null)).toEqual(DEFAULT_REMINDERS);
    expect(parseReminderSettings('not json')).toEqual(DEFAULT_REMINDERS);
  });

  it('coerces booleans and keeps valid times', () => {
    const value = JSON.stringify({
      checkinEnabled: 1,
      checkinHour: 7,
      checkinMinute: 30,
      encouragementEnabled: 0,
      encouragementHour: 21,
      encouragementMinute: 45,
    });

    expect(parseReminderSettings(value)).toEqual({
      checkinEnabled: true,
      checkinHour: 7,
      checkinMinute: 30,
      encouragementEnabled: false,
      encouragementHour: 21,
      encouragementMinute: 45,
    });
  });

  it('clamps out-of-range times back to defaults', () => {
    const value = JSON.stringify({
      checkinHour: 99,
      checkinMinute: -5,
      encouragementHour: 24,
      encouragementMinute: 60,
    });

    const result = parseReminderSettings(value);
    expect(result.checkinHour).toBe(DEFAULT_REMINDERS.checkinHour);
    expect(result.checkinMinute).toBe(DEFAULT_REMINDERS.checkinMinute);
    expect(result.encouragementHour).toBe(DEFAULT_REMINDERS.encouragementHour);
    expect(result.encouragementMinute).toBe(DEFAULT_REMINDERS.encouragementMinute);
  });
});

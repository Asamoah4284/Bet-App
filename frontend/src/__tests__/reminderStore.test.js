import { DEFAULT_REMINDERS, parseReminderSettings } from '../store/reminderStore';

jest.mock('../services/localDb', () => ({
  getSetting: jest.fn(),
  setSetting: jest.fn(),
}));

jest.mock('../services/notifications', () => ({
  ensurePermissions: jest.fn(),
  syncReminders: jest.fn(),
  cancelAllReminders: jest.fn(),
  getDeviceTimezone: jest.fn(() => 'Africa/Accra'),
}));

jest.mock('../services/pushRegistration', () => ({
  getCachedPushToken: jest.fn(() => null),
  registerPushDevice: jest.fn(async () => null),
}));

jest.mock('../services/api', () => ({
  notificationsApi: {
    updatePrefs: jest.fn(),
  },
}));

jest.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: null }),
  },
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
      buddyEventsEnabled: 0,
      streakMilestonesEnabled: 1,
      urgeFollowupEnabled: 0,
      timezone: 'Europe/London',
    });

    expect(parseReminderSettings(value)).toEqual({
      checkinEnabled: true,
      checkinHour: 7,
      checkinMinute: 30,
      encouragementEnabled: false,
      encouragementHour: 21,
      encouragementMinute: 45,
      buddyEventsEnabled: false,
      streakMilestonesEnabled: true,
      urgeFollowupEnabled: false,
      timezone: 'Europe/London',
    });
  });

  it('defaults event toggles to on when omitted', () => {
    const value = JSON.stringify({
      checkinEnabled: true,
      checkinHour: 8,
      checkinMinute: 0,
    });

    const result = parseReminderSettings(value);
    expect(result.buddyEventsEnabled).toBe(true);
    expect(result.streakMilestonesEnabled).toBe(true);
    expect(result.urgeFollowupEnabled).toBe(true);
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

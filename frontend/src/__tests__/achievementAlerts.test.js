import {
  consumeNewlyUnlockedAchievements,
  unlockedAchievements,
} from '../services/achievementAlerts';
import { ACHIEVEMENTS } from '../services/achievements';
import { getSetting, setSetting } from '../services/localDb';

jest.mock('../services/localDb', () => ({
  getSetting: jest.fn(),
  setSetting: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

describe('consumeNewlyUnlockedAchievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('seeds existing unlocks on first run without reporting them as new', async () => {
    getSetting.mockResolvedValue(null);
    setSetting.mockResolvedValue(undefined);

    const newly = await consumeNewlyUnlockedAchievements({
      streakDays: 7,
      journalEntries: 0,
      urgesLogged: 0,
      moneyKept: 0,
    });

    expect(newly).toEqual([]);
    expect(setSetting).toHaveBeenCalledWith(
      'seen_achievements',
      expect.stringContaining('one-week')
    );
  });

  it('returns only newly crossed achievements', async () => {
    getSetting.mockResolvedValue(JSON.stringify(['first-day', 'three-days']));
    setSetting.mockResolvedValue(undefined);

    const newly = await consumeNewlyUnlockedAchievements({
      streakDays: 7,
      journalEntries: 0,
      urgesLogged: 0,
      moneyKept: 0,
    });

    expect(newly.map((item) => item.id)).toEqual(['one-week']);
    expect(unlockedAchievements({ streakDays: 7 }).map((item) => item.id)).toEqual(
      expect.arrayContaining(['first-day', 'three-days', 'one-week'])
    );
    expect(ACHIEVEMENTS.some((item) => item.id === 'one-week')).toBe(true);
  });
});

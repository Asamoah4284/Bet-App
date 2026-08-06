import { getSetting, setSetting } from './localDb';
import { ACHIEVEMENTS, achievementProgress } from './achievements';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const SEEN_KEY = 'seen_achievements';

async function readSeenIds() {
  const raw = await getSetting(SEEN_KEY);
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function writeSeenIds(ids) {
  await setSetting(SEEN_KEY, JSON.stringify([...new Set(ids.map(String))]));
}

export function unlockedAchievements(stats) {
  return ACHIEVEMENTS.filter((achievement) => achievementProgress(achievement, stats).unlocked);
}

/**
 * Returns newly unlocked achievements since the last check.
 * On first run, seeds current unlocks without treating them as "new".
 */
export async function consumeNewlyUnlockedAchievements(stats) {
  const unlocked = unlockedAchievements(stats);
  const unlockedIds = unlocked.map((item) => item.id);
  const seen = await readSeenIds();

  if (seen == null) {
    await writeSeenIds(unlockedIds);
    return [];
  }

  const newly = unlocked.filter((item) => !seen.includes(item.id));
  if (newly.length > 0) {
    await writeSeenIds([...seen, ...unlockedIds]);
  }
  return newly;
}

export async function presentAchievementNotification(achievement) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('milestones', {
        name: 'Milestones',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Achievement unlocked',
        body: achievement.title,
        data: {
          type: 'achievement',
          screen: 'Achievements',
          achievementId: achievement.id,
        },
        ...(Platform.OS === 'android' ? { channelId: 'milestones' } : {}),
      },
      trigger: null,
    });
  } catch {
    // Toast still shows even if the OS notification is unavailable.
  }
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export const DAILY_CHECKIN_ID = 'daily-checkin';
export const ENCOURAGEMENT_ID = 'daily-encouragement';
export const URGE_FOLLOWUP_ID = 'urge-followup';

const ENCOURAGEMENTS = [
  'Every hour you stay the course is a quiet win.',
  'You are more than one urge. Keep going.',
  'Progress, not perfection. You are doing the work.',
  'The calm you build today compounds tomorrow.',
  'You have gotten through 100% of your hardest days.',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync('social', {
      name: 'Buddies',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync('milestones', {
      name: 'Milestones',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync('support', {
      name: 'Support',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
  ]);
}

export async function ensurePermissions() {
  if (!Device.isDevice) {
    // Notifications only fire on physical devices; treat simulators as granted
    // so the settings UI still works for development.
    return true;
  }

  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;

  if (status !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  if (status === 'granted') {
    await ensureAndroidChannels();
  }

  return status === 'granted';
}

export async function getExpoPushToken() {
  if (!Device.isDevice) {
    return null;
  }

  const granted = await ensurePermissions();
  if (!granted) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  if (!projectId) {
    return null;
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data || null;
  } catch {
    return null;
  }
}

async function scheduleDaily(identifier, hour, minute, content) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      ...content,
      ...(Platform.OS === 'android' ? { channelId: content.channelId || 'reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: content.channelId || 'reminders' } : {}),
    },
  });
}

function pickEncouragement() {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

export async function syncReminders(settings) {
  await Notifications.cancelScheduledNotificationAsync(DAILY_CHECKIN_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(ENCOURAGEMENT_ID).catch(() => {});

  if (settings.checkinEnabled) {
    await scheduleDaily(DAILY_CHECKIN_ID, settings.checkinHour, settings.checkinMinute, {
      title: 'Daily reflection',
      body: 'Did you stay gambling-free today? One honest answer keeps your streak meaningful.',
      data: { type: 'daily_checkin', screen: 'DailyReflection' },
      channelId: 'reminders',
    });
  }

  if (settings.encouragementEnabled) {
    await scheduleDaily(
      ENCOURAGEMENT_ID,
      settings.encouragementHour,
      settings.encouragementMinute,
      {
        title: 'A note for you',
        body: pickEncouragement(),
        data: { type: 'daily_encouragement', screen: 'Home' },
        channelId: 'reminders',
      }
    );
  }
}

export async function cancelAllReminders() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_CHECKIN_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(ENCOURAGEMENT_ID).catch(() => {});
}

export async function scheduleUrgeFollowupLocal(secondsFromNow = 2 * 60 * 60) {
  await Notifications.cancelScheduledNotificationAsync(URGE_FOLLOWUP_ID).catch(() => {});
  await ensureAndroidChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: URGE_FOLLOWUP_ID,
    content: {
      title: 'Still with you',
      body: 'Checking in gently — how are you feeling after that urge?',
      data: { type: 'urge_followup', screen: 'Home' },
      ...(Platform.OS === 'android' ? { channelId: 'support' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, secondsFromNow),
      ...(Platform.OS === 'android' ? { channelId: 'support' } : {}),
    },
  });
}

export async function cancelUrgeFollowupLocal() {
  await Notifications.cancelScheduledNotificationAsync(URGE_FOLLOWUP_ID).catch(() => {});
}

export function formatTime(hour, minute) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Accra';
  } catch {
    return 'Africa/Accra';
  }
}

export {
  Notifications,
};

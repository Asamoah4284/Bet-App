import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const DAILY_CHECKIN_ID = 'daily-checkin';
const ENCOURAGEMENT_ID = 'daily-encouragement';

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

  if (status === 'granted' && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return status === 'granted';
}

async function scheduleDaily(identifier, hour, minute, content) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      ...content,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
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
      }
    );
  }
}

export async function cancelAllReminders() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_CHECKIN_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(ENCOURAGEMENT_ID).catch(() => {});
}

export function formatTime(hour, minute) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

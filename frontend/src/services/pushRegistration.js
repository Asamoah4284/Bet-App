import { Platform } from 'react-native';
import { notificationsApi } from './api';
import { getExpoPushToken } from './notifications';

let cachedToken = null;

export function getCachedPushToken() {
  return cachedToken;
}

export async function registerPushDevice(authToken) {
  if (!authToken) {
    cachedToken = null;
    return null;
  }

  const pushToken = await getExpoPushToken();
  cachedToken = pushToken;
  if (!pushToken) {
    return null;
  }

  try {
    await notificationsApi.registerDevice(authToken, {
      token: pushToken,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'unknown',
    });
  } catch {
    // Registration is best-effort; local reminders remain as fallback.
  }

  return pushToken;
}

export async function unregisterPushDevice(authToken) {
  const pushToken = cachedToken || (await getExpoPushToken().catch(() => null));
  cachedToken = null;
  if (!authToken || !pushToken) {
    return;
  }

  try {
    await notificationsApi.unregisterDevice(authToken, { token: pushToken });
  } catch {
    // Ignore logout unregister failures.
  }
}

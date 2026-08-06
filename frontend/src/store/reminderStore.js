import { create } from 'zustand';
import { getSetting, setSetting } from '../services/localDb';
import {
  cancelAllReminders,
  ensurePermissions,
  getDeviceTimezone,
  syncReminders,
} from '../services/notifications';
import { getCachedPushToken, registerPushDevice } from '../services/pushRegistration';
import { notificationsApi } from '../services/api';
import { useAuthStore } from './authStore';

const REMINDER_KEY = 'reminder_settings';

export const DEFAULT_REMINDERS = {
  checkinEnabled: true,
  checkinHour: 20,
  checkinMinute: 0,
  encouragementEnabled: false,
  encouragementHour: 9,
  encouragementMinute: 0,
  buddyEventsEnabled: true,
  streakMilestonesEnabled: true,
  urgeFollowupEnabled: true,
  timezone: 'Africa/Accra',
};

export function parseReminderSettings(value) {
  if (!value) return { ...DEFAULT_REMINDERS };

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_REMINDERS };

    return {
      checkinEnabled: Boolean(parsed.checkinEnabled),
      checkinHour: clampHour(parsed.checkinHour, DEFAULT_REMINDERS.checkinHour),
      checkinMinute: clampMinute(parsed.checkinMinute, DEFAULT_REMINDERS.checkinMinute),
      encouragementEnabled: Boolean(parsed.encouragementEnabled),
      encouragementHour: clampHour(parsed.encouragementHour, DEFAULT_REMINDERS.encouragementHour),
      encouragementMinute: clampMinute(
        parsed.encouragementMinute,
        DEFAULT_REMINDERS.encouragementMinute
      ),
      buddyEventsEnabled:
        parsed.buddyEventsEnabled === undefined ? true : Boolean(parsed.buddyEventsEnabled),
      streakMilestonesEnabled:
        parsed.streakMilestonesEnabled === undefined
          ? true
          : Boolean(parsed.streakMilestonesEnabled),
      urgeFollowupEnabled:
        parsed.urgeFollowupEnabled === undefined ? true : Boolean(parsed.urgeFollowupEnabled),
      timezone:
        typeof parsed.timezone === 'string' && parsed.timezone.trim()
          ? parsed.timezone.trim()
          : DEFAULT_REMINDERS.timezone,
    };
  } catch {
    return { ...DEFAULT_REMINDERS };
  }
}

function clampHour(value, fallback) {
  return Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback;
}

function clampMinute(value, fallback) {
  return Number.isInteger(value) && value >= 0 && value <= 59 ? value : fallback;
}

function prefsPayload(settings) {
  return {
    checkinEnabled: settings.checkinEnabled,
    checkinHour: settings.checkinHour,
    checkinMinute: settings.checkinMinute,
    encouragementEnabled: settings.encouragementEnabled,
    encouragementHour: settings.encouragementHour,
    encouragementMinute: settings.encouragementMinute,
    buddyEventsEnabled: settings.buddyEventsEnabled,
    streakMilestonesEnabled: settings.streakMilestonesEnabled,
    urgeFollowupEnabled: settings.urgeFollowupEnabled,
    timezone: settings.timezone || getDeviceTimezone(),
  };
}

async function applyLocalOwnership(settings, serverOwnsDailies) {
  const wantsNotifications =
    settings.checkinEnabled ||
    settings.encouragementEnabled ||
    settings.buddyEventsEnabled ||
    settings.streakMilestonesEnabled ||
    settings.urgeFollowupEnabled;

  let permissionDenied = false;

  if (wantsNotifications) {
    const granted = await ensurePermissions();
    if (!granted) {
      permissionDenied = true;
      await cancelAllReminders();
      return permissionDenied;
    }
  }

  if (serverOwnsDailies) {
    await cancelAllReminders();
  } else if (settings.checkinEnabled || settings.encouragementEnabled) {
    await syncReminders(settings);
  } else {
    await cancelAllReminders();
  }

  return permissionDenied;
}

async function syncPrefsToServer(settings) {
  const token = useAuthStore.getState().token;
  if (!token) return { hasPushToken: false };

  try {
    const result = await notificationsApi.updatePrefs(token, prefsPayload(settings));
    return { hasPushToken: Boolean(result?.hasPushToken || getCachedPushToken()) };
  } catch {
    return { hasPushToken: Boolean(getCachedPushToken()) };
  }
}

export const useReminderStore = create((set, get) => ({
  settings: { ...DEFAULT_REMINDERS },
  hydrated: false,
  permissionDenied: false,
  saving: false,
  serverOwnsDailies: false,

  hydrate: async () => {
    try {
      const saved = await getSetting(REMINDER_KEY);
      let settings = parseReminderSettings(saved);
      settings = { ...settings, timezone: getDeviceTimezone() };

      // One-time: turn on daily reflection reminder so people don't miss the streak window.
      const reflectionDefaulted = await getSetting('reflection_reminder_defaulted_v1');
      if (!reflectionDefaulted) {
        settings = { ...settings, checkinEnabled: true };
        await setSetting('reflection_reminder_defaulted_v1', '1');
      }

      const authToken = useAuthStore.getState().token;
      let pushToken = getCachedPushToken();
      if (authToken) {
        pushToken = (await registerPushDevice(authToken)) || pushToken;
        const synced = await syncPrefsToServer(settings);
        const serverOwnsDailies = Boolean(authToken && (pushToken || synced.hasPushToken));
        const permissionDenied = await applyLocalOwnership(settings, serverOwnsDailies);
        set({
          settings,
          hydrated: true,
          permissionDenied,
          serverOwnsDailies,
        });
        await setSetting(REMINDER_KEY, JSON.stringify(settings));
        return;
      }

      const permissionDenied = await applyLocalOwnership(settings, false);
      set({
        settings,
        hydrated: true,
        permissionDenied,
        serverOwnsDailies: false,
      });
      await setSetting(REMINDER_KEY, JSON.stringify(settings));
    } catch {
      set({ hydrated: true });
    }
  },

  update: async (partial) => {
    const next = {
      ...get().settings,
      ...partial,
      timezone: getDeviceTimezone(),
    };
    set({ settings: next, saving: true });

    let permissionDenied = false;
    let serverOwnsDailies = false;

    try {
      const authToken = useAuthStore.getState().token;
      let pushToken = getCachedPushToken();
      if (authToken && !pushToken) {
        pushToken = await registerPushDevice(authToken);
      }

      const synced = await syncPrefsToServer(next);
      serverOwnsDailies = Boolean(authToken && (pushToken || synced.hasPushToken));
      permissionDenied = await applyLocalOwnership(next, serverOwnsDailies);
      await setSetting(REMINDER_KEY, JSON.stringify(next));
    } catch {
      await setSetting(REMINDER_KEY, JSON.stringify(next)).catch(() => {});
    }

    set({ permissionDenied, saving: false, serverOwnsDailies });
  },
}));

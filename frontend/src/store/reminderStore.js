import { create } from 'zustand';
import { getSetting, setSetting } from '../services/localDb';
import {
  cancelAllReminders,
  ensurePermissions,
  syncReminders,
} from '../services/notifications';

const REMINDER_KEY = 'reminder_settings';

export const DEFAULT_REMINDERS = {
  checkinEnabled: false,
  checkinHour: 20,
  checkinMinute: 0,
  encouragementEnabled: false,
  encouragementHour: 9,
  encouragementMinute: 0,
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

export const useReminderStore = create((set, get) => ({
  settings: { ...DEFAULT_REMINDERS },
  hydrated: false,
  permissionDenied: false,
  saving: false,

  hydrate: async () => {
    try {
      const saved = await getSetting(REMINDER_KEY);
      set({ settings: parseReminderSettings(saved), hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  update: async (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next, saving: true });

    const wantsNotifications = next.checkinEnabled || next.encouragementEnabled;
    let permissionDenied = false;

    try {
      if (wantsNotifications) {
        const granted = await ensurePermissions();
        if (granted) {
          await syncReminders(next);
        } else {
          permissionDenied = true;
          await cancelAllReminders();
        }
      } else {
        await cancelAllReminders();
      }

      await setSetting(REMINDER_KEY, JSON.stringify(next));
    } catch {
      // Persist the preference even if scheduling failed on this device.
      await setSetting(REMINDER_KEY, JSON.stringify(next)).catch(() => {});
    }

    set({ permissionDenied, saving: false });
  },
}));

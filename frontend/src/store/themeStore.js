import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const THEME_KEY = 'betapp.themePreference';

export const useThemeStore = create((set, get) => ({
  preference: 'system',
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ preference: saved, hydrated: true });
        return;
      }
      set({ hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setPreference: async (preference) => {
    set({ preference });
    try {
      await AsyncStorage.setItem(THEME_KEY, preference);
    } catch {
      // Preference still applies for the current session.
    }
  },

  cyclePreference: async () => {
    const order = ['system', 'light', 'dark'];
    const current = get().preference;
    const next = order[(order.indexOf(current) + 1) % order.length];
    await get().setPreference(next);
    return next;
  },
}));

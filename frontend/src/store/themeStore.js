import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const THEME_KEY = 'betapp.themePreference';
const CANVAS_MIGRATION_KEY = 'betapp.themeCanvas.v2';

export const useThemeStore = create((set, get) => ({
  // Default to light so main screens use #F5F7FA (system dark was applying navy canvases).
  preference: 'light',
  hydrated: false,

  hydrate: async () => {
    try {
      // One-time: exit legacy system/dark navy canvases onto the light design system.
      const migrated = await AsyncStorage.getItem(CANVAS_MIGRATION_KEY);
      if (!migrated) {
        await AsyncStorage.multiSet([
          [THEME_KEY, 'light'],
          [CANVAS_MIGRATION_KEY, '1'],
        ]);
        set({ preference: 'light', hydrated: true });
        return;
      }

      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        set({ preference: saved, hydrated: true });
        return;
      }
      // Treat leftover "system" as light so OS dark mode cannot override the canvas.
      set({ preference: 'light', hydrated: true });
    } catch {
      set({ preference: 'light', hydrated: true });
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
    const order = ['light', 'dark'];
    const current = get().preference;
    const index = order.indexOf(current);
    const next = order[(index === -1 ? 0 : index + 1) % order.length];
    await get().setPreference(next);
    return next;
  },
}));

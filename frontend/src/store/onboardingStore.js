import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const ONBOARDING_KEY = 'betapp.onboardingComplete';

export const useOnboardingStore = create((set) => ({
  hasCompletedOnboarding: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({
        hasCompletedOnboarding: value === 'true',
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  completeOnboarding: async () => {
    set({ hasCompletedOnboarding: true });
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // Still continue into auth for this session.
    }
  },
}));

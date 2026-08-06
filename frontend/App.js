import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/themeStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import { useAuthStore } from './src/store/authStore';
import { useReminderStore } from './src/store/reminderStore';

// Keep native splash up only until the in-app splash has painted, then drop it instantly.
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});
ExpoSplashScreen.setOptions({ duration: 0, fade: false });

/** In-app Quibet splash duration while stores hydrate. */
const MIN_BRANDED_SPLASH_MS = 1800;

export default function App() {
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const hydrateOnboarding = useOnboardingStore((state) => state.hydrate);
  const bootstrapAuth = useAuthStore((state) => state.bootstrap);
  const hydrateReminders = useReminderStore((state) => state.hydrate);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const [brandedSplashDone, setBrandedSplashDone] = useState(false);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    if (!themeHydrated) {
      return;
    }

    let mounted = true;
    const startedAt = Date.now();

    async function finishBootstrap() {
      await Promise.all([hydrateOnboarding(), bootstrapAuth(), hydrateReminders()]);
      const remaining = Math.max(0, MIN_BRANDED_SPLASH_MS - (Date.now() - startedAt));
      await new Promise((resolve) => setTimeout(resolve, remaining));

      if (mounted) {
        setBrandedSplashDone(true);
      }
    }

    finishBootstrap();

    return () => {
      mounted = false;
    };
  }, [themeHydrated, hydrateOnboarding, bootstrapAuth, hydrateReminders]);

  const bootstrapping =
    !themeHydrated || !onboardingHydrated || !authHydrated || !brandedSplashDone;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator bootstrapping={bootstrapping} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

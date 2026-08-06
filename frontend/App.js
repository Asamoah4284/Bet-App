import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/themeStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import { setAuthSessionListener, useAuthStore } from './src/store/authStore';
import { useReminderStore } from './src/store/reminderStore';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

const MIN_BRANDED_SPLASH_MS = 2800;

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const hydrateOnboarding = useOnboardingStore((state) => state.hydrate);
  const bootstrapAuth = useAuthStore((state) => state.bootstrap);
  const hydrateReminders = useReminderStore((state) => state.hydrate);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const [brandedSplashDone, setBrandedSplashDone] = useState(false);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  useEffect(() => {
    setAuthSessionListener(() => {
      useReminderStore.getState().hydrate();
    });
    return () => setAuthSessionListener(null);
  }, []);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    if (!themeHydrated || !fontsLoaded || nativeSplashHidden) {
      return;
    }

    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setNativeSplashHidden(true));
  }, [themeHydrated, fontsLoaded, nativeSplashHidden]);

  useEffect(() => {
    if (!nativeSplashHidden) {
      return;
    }

    let mounted = true;
    const startedAt = Date.now();

    async function finishBootstrap() {
      await Promise.all([hydrateOnboarding(), bootstrapAuth()]);
      // Reminders need auth token (if any) so push vs local ownership is correct.
      await hydrateReminders();
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
  }, [nativeSplashHidden, hydrateOnboarding, bootstrapAuth, hydrateReminders]);

  const bootstrapping =
    !fontsLoaded ||
    !themeHydrated ||
    !nativeSplashHidden ||
    !onboardingHydrated ||
    !authHydrated ||
    !brandedSplashDone;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator bootstrapping={bootstrapping} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

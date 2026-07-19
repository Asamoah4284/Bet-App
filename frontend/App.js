import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/themeStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import { useAuthStore } from './src/store/authStore';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

const MIN_BRANDED_SPLASH_MS = 1200;

export default function App() {
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const hydrateOnboarding = useOnboardingStore((state) => state.hydrate);
  const bootstrapAuth = useAuthStore((state) => state.bootstrap);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const [brandedSplashDone, setBrandedSplashDone] = useState(false);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    if (!themeHydrated || nativeSplashHidden) {
      return;
    }

    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setNativeSplashHidden(true));
  }, [themeHydrated, nativeSplashHidden]);

  useEffect(() => {
    if (!nativeSplashHidden) {
      return;
    }

    let mounted = true;
    const startedAt = Date.now();

    async function finishBootstrap() {
      await Promise.all([hydrateOnboarding(), bootstrapAuth()]);
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
  }, [nativeSplashHidden, hydrateOnboarding, bootstrapAuth]);

  const bootstrapping =
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

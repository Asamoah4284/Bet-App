import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { BrandMark } from '../components/BrandMark';
import { AppBackground } from '../components/AppBackground';
import { useTheme } from '../theme';

/** Brief beat with logo alone before copy fades in. */
const COPY_DELAY_MS = 850;

export function SplashScreen() {
  const theme = useTheme();
  // Start matched to the native splash frame so the handoff is invisible.
  const logoFade = useRef(new Animated.Value(1)).current;
  const logoY = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const copyFade = useRef(new Animated.Value(0)).current;
  const copyY = useRef(new Animated.Value(14)).current;

  // Drop the native splash the moment this (matching) screen is painted.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ExpoSplashScreen.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // Gentle settle after handoff, then bring in copy.
    Animated.parallel([
      Animated.timing(logoY, {
        toValue: -6,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1.03,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(copyFade, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(copyY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, COPY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [logoFade, logoY, logoScale, copyFade, copyY]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBackground />
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: logoFade,
            transform: [{ translateY: logoY }, { scale: logoScale }],
          }}
        >
          <BrandMark size={196} />
        </Animated.View>
        <Animated.View
          style={{
            opacity: copyFade,
            transform: [{ translateY: copyY }],
            alignItems: 'center',
          }}
        >
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Quiet momentum for recovery
          </Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.footer, { opacity: copyFade }]}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Progress over perfection
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  center: {
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

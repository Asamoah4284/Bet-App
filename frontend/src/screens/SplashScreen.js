import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { BrandMark } from '../components/BrandMark';

export function SplashScreen() {
  const theme = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  return (
    <LinearGradient colors={theme.colors.splashGradient} style={styles.container}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
        <BrandMark size={92} />
        <Text style={[styles.title, { color: theme.colors.textInverse }]}>Betapp</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textInverse }]}>
          Quiet momentum for recovery
        </Text>
      </Animated.View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textInverse }]}>
          Progress over perfection
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 18,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  footerText: {
    fontSize: 13,
    opacity: 0.8,
    fontWeight: '500',
  },
});

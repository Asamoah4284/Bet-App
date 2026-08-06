import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useToastStore } from '../store/toastStore';

const AUTO_DISMISS_MS = 4200;

function ToastBanner({ toast, onDismiss }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDismiss(toast.id);
      });
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [toast.id, translateY, opacity, onDismiss]);

  const tint = theme.colors[toast.tint] || theme.colors.secondary;
  const tintMuted = theme.colors[`${toast.tint}Muted`] || theme.colors.secondaryMuted;

  const handlePress = () => {
    onDismiss(toast.id);
    toast.onPress?.();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.bannerWrap,
        {
          paddingTop: Math.max(insets.top, 8) + 4,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${toast.title}. ${toast.body || ''}`}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.banner,
          theme.elevation.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: tintMuted }]}>
          <Ionicons name={toast.icon || 'trophy-outline'} size={22} color={tint} />
        </View>
        <View style={styles.copy}>
          <Text style={[theme.typography.caption, { color: tint, fontFamily: theme.fonts.bodyBold }]}>
            {toast.title}
          </Text>
          {toast.body ? (
            <Text
              style={[theme.typography.subtitle, { color: theme.colors.text, marginTop: 2 }]}
              numberOfLines={2}
            >
              {toast.body}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
          onPress={() => onDismiss(toast.id)}
          style={styles.close}
        >
          <Ionicons name="close" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const current = toasts[0];

  if (!current) return null;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <ToastBanner key={current.id} toast={current} onDismiss={dismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  bannerWrap: {
    paddingHorizontal: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  close: {
    padding: 4,
  },
});

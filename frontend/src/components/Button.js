import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgrounds = {
    primary: theme.colors.primary,
    // Soft teal fill + dark label keeps WCAG AA contrast (white-on-teal does not).
    secondary: theme.colors.secondaryMuted,
    ghost: 'transparent',
    soft: theme.colors.primaryMuted,
    outline: theme.colors.surface,
  };

  const labels = {
    primary: theme.colors.textInverse,
    secondary: theme.colors.primary,
    ghost: theme.colors.primary,
    soft: theme.colors.primary,
    outline: theme.colors.text,
  };

  const bordered = variant === 'ghost' || variant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgrounds[variant],
          borderColor: bordered ? theme.colors.border : 'transparent',
          borderWidth: bordered ? 1 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
          borderRadius: theme.radii.md,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labels[variant]} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={20} color={labels[variant]} /> : null}
          <Text style={[theme.typography.button, { color: labels[variant] }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

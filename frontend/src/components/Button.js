import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgrounds = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    ghost: 'transparent',
    soft: theme.colors.primaryMuted,
  };

  const labels = {
    primary: theme.colors.textInverse,
    secondary: theme.colors.textInverse,
    ghost: theme.colors.primary,
    soft: theme.colors.primary,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgrounds[variant],
          borderColor: variant === 'ghost' ? theme.colors.border : 'transparent',
          borderWidth: variant === 'ghost' ? 1 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
          borderRadius: theme.radii.md,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labels[variant]} />
      ) : (
        <Text style={[theme.typography.button, { color: labels[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
});

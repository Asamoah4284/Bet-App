import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

export function Chip({ label, selected = false, onPress }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radii.pill,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.caption,
          { color: selected ? theme.colors.textInverse : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
  },
});

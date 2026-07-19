import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useThemeStore } from '../store/themeStore';

const LABELS = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const ICONS = {
  system: 'phone-portrait-outline',
  light: 'sunny-outline',
  dark: 'moon-outline',
};

export function ThemeToggle({ compact = false }) {
  const theme = useTheme();
  const preference = useThemeStore((state) => state.preference);
  const cyclePreference = useThemeStore((state) => state.cyclePreference);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Theme preference ${LABELS[preference]}. Tap to change.`}
      onPress={cyclePreference}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <Ionicons name={ICONS[preference]} size={16} color={theme.colors.primary} />
      {compact ? null : (
        <View>
          <Text style={[theme.typography.caption, { color: theme.colors.text }]}>
            {LABELS[preference]}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
});

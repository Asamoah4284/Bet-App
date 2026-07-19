import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export function Card({ title, children, style }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          ...theme.elevation.card,
        },
        style,
      ]}
    >
      {title ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginBottom: 10 },
          ]}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
});

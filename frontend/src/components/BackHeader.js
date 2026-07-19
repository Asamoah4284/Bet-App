import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export function BackHeader({ title, right }) {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => navigation.goBack()}
        hitSlop={10}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.pill,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </Pressable>
      {title ? (
        <Text style={[theme.typography.subtitle, styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    flex: 1,
  },
  spacer: {
    width: 40,
  },
});

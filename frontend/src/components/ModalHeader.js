import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

/**
 * Header used by every bottom-sheet style modal (matches the Urge SOS look):
 * drag handle, small colored kicker, title, and a round close button.
 */
export function ModalHeader({ kicker, title, subtitle, accent = 'primary' }) {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <View style={styles.wrap}>
      <View style={styles.handleRow}>
        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
      </View>
      <View style={styles.row}>
        <View style={styles.titleWrap}>
          {kicker ? (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors[accent], fontWeight: '700', letterSpacing: 1.1 },
              ]}
            >
              {kicker.toUpperCase()}
            </Text>
          ) : null}
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.close,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="close" size={20} color={theme.colors.text} />
        </Pressable>
      </View>
      {subtitle ? (
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 3,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

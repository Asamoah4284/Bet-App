import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

export function BrandMark({ size = 72, showWordmark = false }) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size * 0.32,
          },
        ]}
      >
        <Text style={[styles.glyph, { fontSize: size * 0.42, color: theme.colors.textInverse }]}>
          B
        </Text>
      </LinearGradient>
      {showWordmark ? (
        <Text style={[theme.typography.title, { color: theme.colors.text, marginTop: 12 }]}>
          Betapp
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '800',
  },
});

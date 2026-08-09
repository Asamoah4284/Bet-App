import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const logoInk = require('../../assets/images/logo-mark.png');
const logoWhite = require('../../assets/images/logo-mark-white.png');

/**
 * Quibet mark. The PNG has large transparent padding around the wordmark;
 * use `tight` on compact headers (login/signup) so the letters fill the space.
 */
export function BrandMark({
  size = 72,
  showWordmark = false,
  forceLight = false,
  tight = false,
}) {
  const theme = useTheme();
  const useWhite = forceLight || theme.mode === 'dark';
  const source = useWhite ? logoWhite : logoInk;

  if (tight) {
    // Wordmark is ~50% × ~20% of the square asset — crop and scale so letters read larger.
    const boxW = size * 1.7;
    const boxH = size * 0.48;
    const scaled = size * 2.4;

    return (
      <View style={[styles.tightWrap, { width: boxW, height: boxH }]}>
        <Image
          source={source}
          accessibilityLabel="Quibet"
          style={{ width: scaled, height: scaled }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Image
        source={source}
        accessibilityLabel="Quibet"
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {showWordmark ? (
        <Text style={[theme.typography.title, { color: theme.colors.text, marginTop: 12 }]}>
          Quibet
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  tightWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

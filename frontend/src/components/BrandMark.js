import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const logoInk = require('../../assets/images/logo-mark.png');
const logoWhite = require('../../assets/images/logo-mark-white.png');

export function BrandMark({ size = 72, showWordmark = false, forceLight = false }) {
  const theme = useTheme();
  const useWhite = forceLight || theme.mode === 'dark';

  return (
    <View style={styles.wrap}>
      <Image
        source={useWhite ? logoWhite : logoInk}
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
});

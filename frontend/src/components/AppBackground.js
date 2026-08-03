import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

/**
 * Soft professional canvas: layered wash + quiet brand orbs.
 * Used behind screen content so UI never sits on raw flat white.
 */
export function AppBackground() {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  const wash = theme.colors.canvasGradient;
  const orbPrimary = isDark ? 'rgba(143, 169, 199, 0.12)' : 'rgba(30, 58, 95, 0.07)';
  const orbTeal = isDark ? 'rgba(77, 184, 169, 0.10)' : 'rgba(42, 157, 143, 0.08)';
  const orbSoft = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(245, 247, 250, 0.9)';
  const grid = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(30, 58, 95, 0.035)';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={wash}
        locations={[0, 0.45, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient brand orbs */}
      <View style={[styles.orb, styles.orbTopRight, { backgroundColor: orbPrimary }]} />
      <View style={[styles.orb, styles.orbMidLeft, { backgroundColor: orbTeal }]} />
      <View style={[styles.orb, styles.orbBottom, { backgroundColor: orbSoft }]} />

      {/* Quiet structural lines — editorial, not busy */}
      <View style={[styles.rule, styles.ruleTop, { backgroundColor: grid }]} />
      <View style={[styles.rule, styles.ruleBottom, { backgroundColor: grid }]} />

      {/* Soft bottom vignette so the tab bar area feels grounded */}
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(20, 22, 26, 0.55)']
            : ['transparent', 'rgba(232, 236, 241, 0.55)']
        }
        style={styles.bottomFade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTopRight: {
    width: 280,
    height: 280,
    top: -90,
    right: -80,
  },
  orbMidLeft: {
    width: 220,
    height: 220,
    top: '38%',
    left: -110,
  },
  orbBottom: {
    width: 320,
    height: 320,
    bottom: -140,
    right: -40,
  },
  rule: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
  },
  ruleTop: {
    top: '22%',
  },
  ruleBottom: {
    top: '68%',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
});

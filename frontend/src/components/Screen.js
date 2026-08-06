import { useContext } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabShellContext } from '../navigation/TabShellContext';
import { useTheme } from '../theme';
import { AppBackground } from './AppBackground';

/** Used before the floating tab bar reports its measured height. */
const FALLBACK_TAB_BAR_HEIGHT = 100;
const TAB_BAR_EXTRA_CLEARANCE = 16;

export function Screen({ children, scroll = false, style, contentStyle, plain = false }) {
  const theme = useTheme();
  const inTabShell = useContext(TabShellContext);
  // Present only inside the tab navigator; keeps content clear of the floating tab bar.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const clearedTabBarHeight = inTabShell
    ? (tabBarHeight > 0 ? tabBarHeight : FALLBACK_TAB_BAR_HEIGHT) + TAB_BAR_EXTRA_CLEARANCE
    : 0;
  // Applied last so screen-level contentStyle cannot override tab clearance.
  const bottomPad = clearedTabBarHeight > 0 ? { paddingBottom: clearedTabBarHeight } : null;
  // Shared tab canvas already paints the atmosphere — keep screens transparent to avoid flashes.
  const useSharedCanvas = Boolean(inTabShell) || plain;

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, contentStyle, bottomPad]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle, bottomPad]}>{children}</View>
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: useSharedCanvas ? 'transparent' : theme.colors.background },
        style,
      ]}
    >
      {useSharedCanvas ? null : <AppBackground />}
      <SafeAreaView
        style={styles.safe}
        // Tab bar owns the bottom inset; paddingBottom already clears the floating bar.
        edges={inTabShell ? ['top', 'left', 'right'] : undefined}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});

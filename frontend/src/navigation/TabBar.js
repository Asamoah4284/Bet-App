import { useContext, useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const TABS = {
  Home: { label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  Habits: { label: 'Habits', icon: 'calendar', iconOutline: 'calendar-outline' },
  Money: { label: 'Money', icon: 'wallet', iconOutline: 'wallet-outline' },
  Buddies: { label: 'Buddies', icon: 'people', iconOutline: 'people-outline' },
  Profile: { label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
};

const FAB_SIZE = 56;
/** How far the Money circle sits above the frosted bar. */
const FAB_LIFT = 26;

function SideTab({ label, icon, iconOutline, focused, onPress, onLongPress, colors }) {
  const color = focused ? colors.primary : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.sideIconWrap, focused && { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name={focused ? icon : iconOutline} size={22} color={color} />
      </View>
      <Text style={[styles.label, { color, fontWeight: focused ? '700' : '500' }]}>{label}</Text>
    </Pressable>
  );
}

function MoneyTab({ focused, onPress, onLongPress, colors }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel="Money"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.moneyTab, { opacity: pressed ? 0.88 : 1 }]}
    >
      <View
        style={[
          styles.fab,
          {
            backgroundColor: focused ? colors.secondary : colors.primary,
            // Lift visually; collapse the leftover layout gap so the label sits close under it.
            transform: [{ translateY: -FAB_LIFT }],
            marginBottom: -FAB_LIFT,
          },
        ]}
      >
        <Ionicons name="wallet" size={24} color="#FFFFFF" />
      </View>
      <Text
        style={[
          styles.label,
          {
            color: focused ? colors.primary : colors.textMuted,
            fontWeight: focused ? '700' : '500',
            marginTop: 2,
          },
        ]}
      >
        Money
      </Text>
    </Pressable>
  );
}

export function TabBar({ state, descriptors, navigation, insets: navInsets }) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const hookInsets = useSafeAreaInsets();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const [keyboardShown, setKeyboardShown] = useState(false);
  // Prefer navigator-provided insets — more reliable for custom tab bars.
  const bottomInset = navInsets?.bottom ?? hookInsets.bottom ?? 0;
  const bottomPad = Math.max(bottomInset, 10);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardShown(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardShown) {
    return null;
  }

  const goTo = (route, index) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const hairline = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(60, 60, 67, 0.18)';
  // Android blur is weaker — lean on a translucent surface; iOS wash stays very light.
  const frostWash = isDark
    ? Platform.OS === 'ios'
      ? 'rgba(26, 34, 48, 0.42)'
      : 'rgba(26, 34, 48, 0.94)'
    : Platform.OS === 'ios'
      ? 'rgba(249, 249, 249, 0.22)'
      : 'rgba(249, 249, 249, 0.94)';
  const blurTint = isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  return (
    <View
      pointerEvents="box-none"
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
      style={[styles.wrap, { paddingTop: FAB_LIFT }]}
    >
      <View style={[styles.bar, { paddingBottom: bottomPad }]} pointerEvents="box-none">
        {/* Frost clipped to bar only — kept separate so the raised FAB isn’t cut off */}
        <View pointerEvents="none" style={styles.frostClip}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 90}
            tint={blurTint}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.frostWash, { backgroundColor: frostWash }]} />
          <View style={[styles.hairline, { backgroundColor: hairline }]} />
        </View>

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const config = TABS[route.name] || {
              label: descriptors[route.key]?.options?.title || route.name,
              icon: 'ellipse',
              iconOutline: 'ellipse-outline',
            };
            const onPress = () => goTo(route, index);
            const onLongPress = () =>
              navigation.emit({ type: 'tabLongPress', target: route.key });

            if (route.name === 'Money') {
              return (
                <MoneyTab
                  key={route.key}
                  focused={focused}
                  colors={theme.colors}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            }

            return (
              <SideTab
                key={route.key}
                label={config.label}
                icon={config.icon}
                iconOutline={config.iconOutline}
                focused={focused}
                colors={theme.colors}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
    zIndex: 10,
  },
  bar: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  frostClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  frostWash: {
    ...StyleSheet.absoluteFillObject,
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 4,
    minHeight: 56,
    zIndex: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingBottom: 2,
  },
  sideIconWrap: {
    width: 42,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  moneyTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    overflow: 'visible',
    zIndex: 3,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
});

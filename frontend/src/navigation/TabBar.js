import { useContext, useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
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
/** How far the Money circle sits above the tab row. */
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
            marginTop: -FAB_LIFT,
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
            marginTop: 4,
          },
        ]}
      >
        Money
      </Text>
    </Pressable>
  );
}

export function TabBar({ state, descriptors, navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const bottomPad = Math.max(insets.bottom, 8);

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

  return (
    <View
      pointerEvents="box-none"
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
      style={styles.wrap}
    >
      {/* Extra top space so the raised Money button isn’t clipped */}
      <View style={{ height: FAB_LIFT }} pointerEvents="none" />

      <View
        style={[
          styles.bar,
          {
            paddingBottom: bottomPad,
            backgroundColor: 'transparent',
          },
        ]}
      >
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
    backgroundColor: 'transparent',
  },
  bar: {},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 4,
    minHeight: 56,
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
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

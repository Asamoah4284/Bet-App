import { Dimensions, Easing, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { BuddiesScreen } from '../screens/BuddiesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppBackground } from '../components/AppBackground';
import { useTheme } from '../theme';
import { TabBar } from './TabBar';
import { TabShellContext } from './TabShellContext';

const Tab = createBottomTabNavigator();

const SCREEN_WIDTH = Dimensions.get('window').width;

const tabSlideSpec = {
  animation: 'timing',
  config: {
    duration: 240,
    easing: Easing.out(Easing.cubic),
  },
};

// Directional slide between tabs — translateX only, no opacity, so nothing fades.
function forTabSlide({ current }) {
  return {
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          }),
        },
      ],
    },
  };
}

export function MainTabs() {
  const theme = useTheme();

  return (
    <TabShellContext.Provider value={true}>
      <View style={[styles.shell, { backgroundColor: theme.colors.background }]}>
        <AppBackground />
        <View style={styles.navigator}>
          <Tab.Navigator
            tabBar={(props) => <TabBar {...props} />}
            detachInactiveScreens={false}
            screenOptions={{
              headerShown: false,
              lazy: false,
              transitionSpec: tabSlideSpec,
              sceneStyleInterpolator: forTabSlide,
              sceneStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Habits" component={HabitsScreen} />
            <Tab.Screen name="Money" component={FinanceScreen} />
            <Tab.Screen name="Buddies" component={BuddiesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        </View>
      </View>
    </TabShellContext.Provider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  navigator: {
    flex: 1,
  },
});

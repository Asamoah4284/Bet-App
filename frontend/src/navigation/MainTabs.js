import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { BuddiesScreen } from '../screens/BuddiesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TabBar } from './TabBar';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Money" component={FinanceScreen} />
      <Tab.Screen name="Buddies" component={BuddiesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

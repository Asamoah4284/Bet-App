import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { BuddiesScreen } from '../screens/BuddiesScreen';
import { SupportScreen } from '../screens/SupportScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Habits: ['leaf', 'leaf-outline'],
  Money: ['wallet', 'wallet-outline'],
  Buddies: ['people', 'people-outline'],
  Support: ['heart', 'heart-outline'],
};

export function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Money" component={FinanceScreen} />
      <Tab.Screen name="Buddies" component={BuddiesScreen} />
      <Tab.Screen name="Support" component={SupportScreen} />
    </Tab.Navigator>
  );
}

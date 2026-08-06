import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import CustomTabBar from '../components/CustomTabBar';

import HomeScreen from '../screens/HomeScreen';
import DailyCheckinScreen from '../screens/DailyCheckinScreen';
import HabitsScreen from '../screens/HabitsScreen';
import LogUrgeScreen from '../screens/LogUrgeScreen';
import JournalEntryScreen from '../screens/JournalEntryScreen';
import FinancesScreen from '../screens/FinancesScreen';
import GoalSetupScreen from '../screens/GoalSetupScreen';
import SupportScreen from '../screens/SupportScreen';
import BuddiesScreen from '../screens/BuddiesScreen';
import BuddyDetailScreen from '../screens/BuddyDetailScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const HabitsStack = createNativeStackNavigator();
const FinancesStack = createNativeStackNavigator();
const SupportStack = createNativeStackNavigator();
const BuddiesStack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  contentStyle: { backgroundColor: colors.background },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Quibet' }} />
      <HomeStack.Screen name="LogUrge" component={LogUrgeScreen} options={{ title: 'Log an urge' }} />
      <HomeStack.Screen
        name="DailyCheckin"
        component={DailyCheckinScreen}
        options={{ title: 'Daily check-in' }}
      />
    </HomeStack.Navigator>
  );
}

function HabitsStackNavigator() {
  return (
    <HabitsStack.Navigator screenOptions={stackScreenOptions}>
      <HabitsStack.Screen name="HabitsMain" component={HabitsScreen} options={{ title: 'Habits' }} />
      <HabitsStack.Screen name="LogUrge" component={LogUrgeScreen} options={{ title: 'Log an urge' }} />
      <HabitsStack.Screen
        name="JournalEntry"
        component={JournalEntryScreen}
        options={{ title: 'Journal' }}
      />
    </HabitsStack.Navigator>
  );
}

function FinancesStackNavigator() {
  return (
    <FinancesStack.Navigator screenOptions={stackScreenOptions}>
      <FinancesStack.Screen
        name="FinancesMain"
        component={FinancesScreen}
        options={{ title: 'Finances' }}
      />
      <FinancesStack.Screen
        name="GoalSetup"
        component={GoalSetupScreen}
        options={{ title: 'Savings goal' }}
      />
    </FinancesStack.Navigator>
  );
}

function SupportStackNavigator() {
  return (
    <SupportStack.Navigator screenOptions={stackScreenOptions}>
      <SupportStack.Screen name="SupportMain" component={SupportScreen} options={{ title: 'Support' }} />
    </SupportStack.Navigator>
  );
}

function BuddiesStackNavigator() {
  return (
    <BuddiesStack.Navigator screenOptions={stackScreenOptions}>
      <BuddiesStack.Screen name="BuddiesMain" component={BuddiesScreen} options={{ title: 'Buddies' }} />
      <BuddiesStack.Screen
        name="BuddyDetail"
        component={BuddyDetailScreen}
        options={{ title: 'Buddy progress' }}
      />
    </BuddiesStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          lazy: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Home · Habits · Finances (green center) · Support · Buddies */}
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen name="Habits" component={HabitsStackNavigator} />
        <Tab.Screen name="Finances" component={FinancesStackNavigator} />
        <Tab.Screen name="Support" component={SupportStackNavigator} />
        <Tab.Screen name="Buddies" component={BuddiesStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
  

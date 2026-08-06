import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { createNavigationTheme, useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { MainTabs } from './MainTabs';
import { LogUrgeScreen } from '../screens/LogUrgeScreen';
import { JournalEntryScreen } from '../screens/JournalEntryScreen';
import { LogMoneyScreen } from '../screens/LogMoneyScreen';
import { CheckinScreen } from '../screens/CheckinScreen';
import { BuddyDetailScreen } from '../screens/BuddyDetailScreen';
import { BuddyChatScreen } from '../screens/BuddyChatScreen';
import { UrgeSOSScreen } from '../screens/UrgeSOSScreen';
import { SafetyPlanScreen } from '../screens/SafetyPlanScreen';
import { ReminderSettingsScreen } from '../screens/ReminderSettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { StreakDetailScreen } from '../screens/StreakDetailScreen';
import { BuddyInviteScreen } from '../screens/BuddyInviteScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { DailyReflectionScreen } from '../screens/DailyReflectionScreen';
import { ShieldScreen } from '../screens/ShieldScreen';
import { createSlideModalOptions, createSlideScreenOptions } from './transitions';
import {
  attachNotificationListeners,
  navigationRef,
} from '../services/notificationRouting';
import { ToastHost } from '../components/ToastHost';
import { AchievementAlertBridge } from '../components/AchievementAlertBridge';

const Stack = createStackNavigator();
const linking = {
  prefixes: ['betapp://'],
  config: {
    screens: {
      BuddyInvite: 'buddy/:buddyCode',
    },
  },
};

function AuthStack() {
  const theme = useTheme();
  const screenOptions = createSlideScreenOptions(theme.colors.background);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator({ bootstrapping }) {
  const theme = useTheme();
  const navigationTheme = createNavigationTheme(theme);
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const user = useAuthStore((state) => state.user);
  const screenOptions = createSlideScreenOptions(theme.colors.background);
  const modalOptions = createSlideModalOptions(theme.colors.background);

  useEffect(() => {
    if (bootstrapping || !user) {
      return undefined;
    }
    return attachNotificationListeners();
  }, [bootstrapping, user]);

  if (bootstrapping) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen />
      </>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
      <StatusBar style={theme.colors.statusBar} />
      <Stack.Navigator screenOptions={screenOptions}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Group screenOptions={modalOptions}>
              <Stack.Screen name="UrgeSOS" component={UrgeSOSScreen} />
              <Stack.Screen name="LogUrge" component={LogUrgeScreen} />
              <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
              <Stack.Screen name="LogMoney" component={LogMoneyScreen} />
              <Stack.Screen name="Checkin" component={CheckinScreen} />
              <Stack.Screen name="SafetyPlan" component={SafetyPlanScreen} />
              <Stack.Screen name="DailyReflection" component={DailyReflectionScreen} />
            </Stack.Group>
            <Stack.Screen name="BuddyDetail" component={BuddyDetailScreen} />
            <Stack.Screen name="BuddyChat" component={BuddyChatScreen} />
            <Stack.Screen name="Reminders" component={ReminderSettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="StreakDetail" component={StreakDetailScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Shield" component={ShieldScreen} />
          </>
        )}
        {hasCompletedOnboarding ? (
          <Stack.Screen name="BuddyInvite" component={BuddyInviteScreen} />
        ) : null}
      </Stack.Navigator>
      {user ? <AchievementAlertBridge /> : null}
      <ToastHost />
    </NavigationContainer>
  );
}

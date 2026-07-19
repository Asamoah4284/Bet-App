import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Stack = createNativeStackNavigator();
const linking = {
  prefixes: ['betapp://'],
  config: {
    screens: {
      BuddyInvite: 'buddy/:buddyCode',
    },
  },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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

  if (bootstrapping) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen />
      </>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme} linking={linking}>
      <StatusBar style={theme.colors.statusBar} />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
              <Stack.Screen name="UrgeSOS" component={UrgeSOSScreen} />
              <Stack.Screen name="LogUrge" component={LogUrgeScreen} />
              <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
              <Stack.Screen name="LogMoney" component={LogMoneyScreen} />
              <Stack.Screen name="Checkin" component={CheckinScreen} />
              <Stack.Screen name="SafetyPlan" component={SafetyPlanScreen} />
            </Stack.Group>
            <Stack.Screen name="BuddyDetail" component={BuddyDetailScreen} />
            <Stack.Screen name="Reminders" component={ReminderSettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="StreakDetail" component={StreakDetailScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        )}
        {hasCompletedOnboarding ? (
          <Stack.Screen name="BuddyInvite" component={BuddyInviteScreen} />
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

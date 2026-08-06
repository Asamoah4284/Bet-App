import { createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { reflectionDayKeys } from './reflections';

export const navigationRef = createNavigationContainerRef();

function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function routeNotificationResponse(response) {
  const data = response?.notification?.request?.content?.data || {};
  const screen = data.screen || mapTypeToScreen(data.type);

  switch (screen) {
    case 'DailyReflection': {
      const { today } = reflectionDayKeys();
      navigate('DailyReflection', { dayKey: data.dayKey || today });
      break;
    }
    case 'StreakDetail':
      navigate('StreakDetail');
      break;
    case 'Achievements':
      navigate('Achievements');
      break;
    case 'Buddies':
      navigate('Main', { screen: 'Buddies' });
      break;
    case 'BuddyChat':
      if (data.userId) {
        navigate('BuddyChat', {
          userId: data.userId,
          displayName: data.displayName || 'Buddy',
        });
      } else {
        navigate('Main', { screen: 'Buddies' });
      }
      break;
    case 'Home':
      navigate('Main', { screen: 'Home' });
      break;
    case 'UrgeSOS':
      navigate('UrgeSOS');
      break;
    default:
      if (data.type === 'daily_checkin') {
        const { today } = reflectionDayKeys();
        navigate('DailyReflection', { dayKey: today });
      }
      break;
  }
}

function mapTypeToScreen(type) {
  switch (type) {
    case 'daily_checkin':
      return 'DailyReflection';
    case 'daily_encouragement':
    case 'urge_followup':
      return 'Home';
    case 'buddy_request':
    case 'buddy_accepted':
    case 'buddy_checkin':
      return 'Buddies';
    case 'buddy_message':
      return 'BuddyChat';
    case 'streak_milestone':
      return 'StreakDetail';
    case 'achievement':
      return 'Achievements';
    default:
      return null;
  }
}

export function attachNotificationListeners() {
  let handledColdStart = false;

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    routeNotificationResponse
  );

  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response && !handledColdStart) {
        handledColdStart = true;
        routeNotificationResponse(response);
      }
    })
    .catch(() => {});

  return () => {
    responseSubscription.remove();
  };
}

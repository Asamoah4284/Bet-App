import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Web OAuth client ID (type "Web application") — required so the SDK returns an idToken
// the backend can verify. Set in .env / EAS as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
// Optional but recommended on iOS: iOS OAuth client ID (type "iOS") for com.betapp.recovery.
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

const isExpoGo = Constants.appOwnership === 'expo';

export class GoogleAuthUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GoogleAuthUnavailableError';
  }
}

/**
 * Runs the native Google sign-in flow and resolves with a Google ID token
 * that the backend can verify at /api/auth/google.
 *
 * Throws GoogleAuthUnavailableError when running in Expo Go (the native
 * module needs a development build) or when no client ID is configured.
 * Resolves with null when the user cancels the account picker.
 */
export async function signInWithGoogle() {
  if (isExpoGo) {
    throw new GoogleAuthUnavailableError(
      'Google sign-in needs a development build — it cannot run inside Expo Go. ' +
        'Use email or username for now, or build with EAS.'
    );
  }
  if (!WEB_CLIENT_ID) {
    throw new GoogleAuthUnavailableError(
      'Google sign-in is not configured yet. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and rebuild.'
    );
  }

  // Lazy require so the app still loads in environments without the native module.
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } =
    require('@react-native-google-signin/google-signin');

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    ...(IOS_CLIENT_ID ? { iosClientId: IOS_CLIENT_ID } : {}),
    offlineAccess: false,
  });

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return null; // User cancelled.
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error(
        'Google did not return an ID token. Confirm EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is a Web client ID.'
      );
    }
    return idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
      throw new GoogleAuthUnavailableError('Google sign-in is already in progress.');
    }
    if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new GoogleAuthUnavailableError(
        'Google Play Services is unavailable on this device. Update Play Services or use email sign-in.'
      );
    }
    throw error;
  }
}

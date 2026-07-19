import Constants from 'expo-constants';

// A Web OAuth client ID from Google Cloud Console. Without it Google sign-in
// stays disabled. Set it in .env / eas.json as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

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
      'Google sign-in needs a development build - it cannot run inside Expo Go. ' +
        'Use email or username for now.'
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

  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return null; // User cancelled.
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token');
    }
    return idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
}

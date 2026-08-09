import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';

const isExpoGo = Constants.appOwnership === 'expo';

export class AppleAuthUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppleAuthUnavailableError';
  }
}

export async function isAppleSignInAvailable() {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Runs Sign in with Apple and returns identityToken + optional profile bits
 * for POST /api/auth/apple.
 *
 * Resolves null when the user cancels.
 */
export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new AppleAuthUnavailableError('Apple sign-in is only available on iPhone and iPad.');
  }
  if (isExpoGo) {
    throw new AppleAuthUnavailableError(
      'Apple sign-in needs a development build — it cannot run inside Expo Go.'
    );
  }

  const available = await isAppleSignInAvailable();
  if (!available) {
    throw new AppleAuthUnavailableError('Apple sign-in is not available on this device.');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    const given = credential.fullName?.givenName || '';
    const family = credential.fullName?.familyName || '';
    const fullName = [given, family].filter(Boolean).join(' ').trim() || null;

    return {
      identityToken: credential.identityToken,
      fullName,
      email: credential.email || null,
    };
  } catch (error) {
    if (error?.code === 'ERR_REQUEST_CANCELED') {
      return null;
    }
    throw error;
  }
}

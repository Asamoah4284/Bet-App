import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import {
  AppleAuthUnavailableError,
  isAppleSignInAvailable,
  signInWithApple,
} from '../services/appleAuth';

export function AppleSignInButton({ style }) {
  const theme = useTheme();
  const loginWithApple = useAuthStore((state) => state.loginWithApple);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    isAppleSignInAvailable().then((value) => {
      if (mounted) setAvailable(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (Platform.OS !== 'ios' || !available) {
    return null;
  }

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await signInWithApple();
      if (result?.identityToken) {
        await loginWithApple(result);
      }
    } catch (error) {
      if (error instanceof AppleAuthUnavailableError) {
        Alert.alert('Apple sign-in unavailable', error.message);
      } else if (error?.message) {
        Alert.alert('Apple sign-in failed', error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.wrap, style]} pointerEvents={busy ? 'none' : 'auto'}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          theme.mode === 'dark'
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={theme.radii.md}
        style={styles.button}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 46,
  },
});

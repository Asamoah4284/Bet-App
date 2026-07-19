import { useState } from 'react';
import { Alert } from 'react-native';
import { Button } from './Button';
import { useAuthStore } from '../store/authStore';
import { GoogleAuthUnavailableError, signInWithGoogle } from '../services/googleAuth';

export function GoogleSignInButton({ style }) {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    setBusy(true);
    try {
      const idToken = await signInWithGoogle();
      if (idToken) {
        await loginWithGoogle({ idToken });
      }
    } catch (error) {
      if (error instanceof GoogleAuthUnavailableError) {
        Alert.alert('Google sign-in unavailable', error.message);
      }
      // Backend errors already land in authStore.error and show on screen.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label="Continue with Google"
      icon="logo-google"
      variant="outline"
      onPress={onPress}
      loading={busy}
      style={style}
    />
  );
}

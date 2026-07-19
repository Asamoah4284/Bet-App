import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { BrandMark } from '../components/BrandMark';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '../utils/validation';

export function SignupScreen({ navigation }) {
  const theme = useTheme();
  const signup = useAuthStore((state) => state.signup);
  const loading = useAuthStore((state) => state.loading);
  const apiError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const onSubmit = async () => {
    clearError();
    const nextErrors = {
      displayName: validateDisplayName(displayName),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);

    if (nextErrors.displayName || nextErrors.email || nextErrors.password) {
      return;
    }

    try {
      await signup({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
    } catch {
      // Error is already stored in authStore.
    }
  };

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <BrandMark size={56} />
        <ThemeToggle />
      </View>

      <Text style={[theme.typography.display, { color: theme.colors.text, marginTop: 28 }]}>
        Create your space
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
        Your recovery notes stay private on this device. Your account keeps buddies and check-ins in
        sync.
      </Text>

      <View style={styles.form}>
        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should we greet you?"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={errors.displayName}
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          error={errors.password}
        />

        {apiError ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: theme.colors.dangerMuted,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>
              {apiError}
            </Text>
          </View>
        ) : null}

        <Button label="Create account" onPress={onSubmit} loading={loading} style={styles.submit} />
      </View>

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.switchRow}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Already have an account?{' '}
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Sign in</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  form: {
    marginTop: 28,
  },
  errorBox: {
    padding: 12,
    marginBottom: 8,
  },
  submit: {
    marginTop: 8,
  },
  switchRow: {
    marginTop: 24,
    marginBottom: 12,
  },
});

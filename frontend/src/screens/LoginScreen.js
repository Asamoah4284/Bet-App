import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { BrandMark } from '../components/BrandMark';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { validateEmail, validatePassword } from '../utils/validation';

export function LoginScreen({ navigation }) {
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const apiError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const onSubmit = async () => {
    clearError();
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    try {
      await login({ email: email.trim(), password });
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
        Welcome back
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
        Sign in to sync your account, buddy connections, and check-ins.
      </Text>

      <View style={styles.form}>
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
          autoComplete="password"
          textContentType="password"
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

        <Button label="Sign in" onPress={onSubmit} loading={loading} style={styles.submit} />
      </View>

      <Pressable onPress={() => navigation.navigate('Signup')} style={styles.switchRow}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          New here?{' '}
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Create an account</Text>
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

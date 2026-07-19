import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { BrandMark } from '../components/BrandMark';
import { ThemeToggle } from '../components/ThemeToggle';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { validateIdentifier, validatePassword } from '../utils/validation';

export function LoginScreen({ navigation }) {
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const apiError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const onSubmit = async () => {
    clearError();
    const nextErrors = {
      identifier: validateIdentifier(identifier),
      password: validatePassword(password),
    };
    setErrors(nextErrors);

    if (nextErrors.identifier || nextErrors.password) {
      return;
    }

    try {
      await login({ identifier: identifier.trim(), password });
    } catch {
      // Error is already stored in authStore.
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <LinearGradient
        colors={theme.colors.splashGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <BrandMark size={48} />
          <ThemeToggle compact />
        </View>
        <Text style={[theme.typography.display, styles.heroTitle]}>Welcome back</Text>
        <Text style={[theme.typography.body, styles.heroSubtitle]}>
          Pick up right where you left off. Your streak is waiting for you.
        </Text>
      </LinearGradient>

      <View
        style={[
          styles.card,
          theme.elevation.card,
          { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg },
        ]}
      >
        <TextField
          label="Email or username"
          icon="person-outline"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@email.com or username"
          keyboardType="email-address"
          autoComplete="username"
          textContentType="username"
          error={errors.identifier}
        />
        <TextField
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          error={errors.password}
        />

        <Pressable
          onPress={() => {
            clearError();
            navigation.navigate('ForgotPassword');
          }}
          style={styles.forgotRow}
          hitSlop={8}
        >
          <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
            Forgot password?
          </Text>
        </Pressable>

        {apiError ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: theme.colors.dangerMuted, borderRadius: theme.radii.md },
            ]}
          >
            <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>
              {apiError}
            </Text>
          </View>
        ) : null}

        <Button label="Sign in" onPress={onSubmit} loading={loading} />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            or continue with
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        <GoogleSignInButton />
      </View>

      <Pressable
        onPress={() => {
          clearError();
          navigation.navigate('Signup');
        }}
        style={styles.switchRow}
      >
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          New here?{' '}
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Create an account</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  hero: {
    paddingTop: 16,
    paddingBottom: 64,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    marginTop: 24,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    marginTop: 8,
  },
  card: {
    marginTop: -36,
    marginHorizontal: 20,
    padding: 20,
    paddingTop: 22,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 14,
  },
  errorBox: {
    padding: 12,
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  switchRow: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
});

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
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../utils/validation';

export function SignupScreen({ navigation }) {
  const theme = useTheme();
  const signup = useAuthStore((state) => state.signup);
  const loading = useAuthStore((state) => state.loading);
  const apiError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const onSubmit = async () => {
    clearError();
    const nextErrors = {
      displayName: validateDisplayName(displayName),
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);

    if (nextErrors.displayName || nextErrors.username || nextErrors.email || nextErrors.password) {
      return;
    }

    try {
      await signup({
        displayName: displayName.trim(),
        username: username.trim() || undefined,
        email: email.trim(),
        password,
      });
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
        <Text style={[theme.typography.display, styles.heroTitle]}>Create your space</Text>
        <Text style={[theme.typography.body, styles.heroSubtitle]}>
          Recovery notes stay private on your device. Your account syncs buddies and check-ins.
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
          label="Display name"
          icon="happy-outline"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should we greet you?"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={errors.displayName}
        />
        <TextField
          label="Username"
          icon="at-outline"
          value={username}
          onChangeText={setUsername}
          placeholder="Optional - sign in with it later"
          autoComplete="username-new"
          textContentType="username"
          error={errors.username}
          hint="3-20 characters: letters, numbers, dots or underscores"
        />
        <TextField
          label="Email"
          icon="mail-outline"
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
          icon="lock-closed-outline"
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
              { backgroundColor: theme.colors.dangerMuted, borderRadius: theme.radii.md },
            ]}
          >
            <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>
              {apiError}
            </Text>
          </View>
        ) : null}

        <Button label="Create account" onPress={onSubmit} loading={loading} />

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
          navigation.navigate('Login');
        }}
        style={styles.switchRow}
      >
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Already have an account?{' '}
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Sign in</Text>
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

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { validateEmail, validatePassword, validateResetCode } from '../utils/validation';

export function ForgotPasswordScreen({ navigation }) {
  const theme = useTheme();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const storeLoading = useAuthStore((state) => state.loading);
  const apiError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState(null);

  const sendCode = async () => {
    setRequestError(null);
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    if (emailError) {
      return;
    }

    setRequesting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setStep('reset');
    } catch (error) {
      setRequestError(error.message || 'Could not request a reset code');
    } finally {
      setRequesting(false);
    }
  };

  const submitReset = async () => {
    clearError();
    const nextErrors = {
      code: validateResetCode(code),
      newPassword: validatePassword(newPassword),
    };
    setErrors(nextErrors);
    if (nextErrors.code || nextErrors.newPassword) {
      return;
    }

    try {
      // Signs the user in directly on success.
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
    } catch {
      // Error is already stored in authStore.
    }
  };

  const errorMessage = step === 'request' ? requestError : apiError;

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow} hitSlop={8}>
        <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
          Back to sign in
        </Text>
      </Pressable>

      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.lg },
        ]}
      >
        <Ionicons
          name={step === 'request' ? 'key-outline' : 'shield-checkmark-outline'}
          size={32}
          color={theme.colors.primary}
        />
      </View>

      <Text style={[theme.typography.title, { color: theme.colors.text, marginTop: 20 }]}>
        {step === 'request' ? 'Forgot your password?' : 'Enter your reset code'}
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
        {step === 'request'
          ? 'Enter the email on your account and we will issue a 6-digit reset code.'
          : `We issued a reset code for ${email.trim()}. Enter it below with your new password.`}
      </Text>

      <View style={styles.form}>
        {step === 'request' ? (
          <>
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
            {errorMessage ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: theme.colors.dangerMuted, borderRadius: theme.radii.md },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}
            <Button label="Send reset code" onPress={sendCode} loading={requesting} />
          </>
        ) : (
          <>
            <TextField
              label="6-digit code"
              icon="keypad-outline"
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              error={errors.code}
            />
            <TextField
              label="New password"
              icon="lock-closed-outline"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              error={errors.newPassword}
            />
            {errorMessage ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: theme.colors.dangerMuted, borderRadius: theme.radii.md },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}
            <Button label="Reset password and sign in" onPress={submitReset} loading={storeLoading} />
            <Button
              label="Use a different email"
              variant="ghost"
              onPress={() => {
                clearError();
                setCode('');
                setNewPassword('');
                setStep('request');
              }}
              style={styles.secondaryAction}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginTop: 28,
  },
  errorBox: {
    padding: 12,
    marginBottom: 12,
  },
  secondaryAction: {
    marginTop: 10,
  },
});

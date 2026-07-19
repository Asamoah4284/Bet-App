import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { profileApi } from '../services/api';
import { useBuddyStore } from '../store/buddyStore';
import { useAuthStore } from '../store/authStore';

export function BuddyInviteScreen({ route, navigation }) {
  const theme = useTheme();
  const buddyCode = route.params?.buddyCode?.toUpperCase();
  const sendRequest = useBuddyStore((state) => state.sendRequest);
  const token = useAuthStore((state) => state.token);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!buddyCode) return;
    profileApi
      .shared(buddyCode)
      .then((result) => setProfile(result.profile))
      .catch((err) => setError(err.message));
  }, [buddyCode]);

  const addBuddy = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendRequest(buddyCode);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <BackHeader title="Buddy invitation" />
      <View style={styles.content}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.pill },
          ]}
        >
          <Text style={[styles.initial, { color: theme.colors.primary }]}>
            {(profile?.displayName || '?')[0].toUpperCase()}
          </Text>
        </View>
        {profile ? (
          <>
            <Text style={[theme.typography.title, { color: theme.colors.text }]}>
              {profile.displayName}
            </Text>
            {profile.username ? (
              <Text style={[theme.typography.body, { color: theme.colors.primary }]}>
                @{profile.username}
              </Text>
            ) : null}
            {profile.bio ? (
              <Text style={[theme.typography.body, styles.bio, { color: theme.colors.textSecondary }]}>
                {profile.bio}
              </Text>
            ) : null}
            <View
              style={[
                styles.code,
                { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md },
              ]}
            >
              <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
              <Text style={[theme.typography.subtitle, { color: theme.colors.primary }]}>
                {profile.buddyCode}
              </Text>
            </View>
            {!token ? (
              <Button
                label="Sign in to add this buddy"
                icon="log-in-outline"
                onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                style={styles.button}
              />
            ) : sent ? (
              <View style={styles.sent}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.secondary} />
                <Text style={[theme.typography.body, { color: theme.colors.secondary }]}>
                  Buddy request sent
                </Text>
              </View>
            ) : (
              <Button
                label={`Add ${profile.displayName} as buddy`}
                icon="person-add-outline"
                onPress={addBuddy}
                loading={busy}
                style={styles.button}
              />
            )}
          </>
        ) : (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Loading invitation...
          </Text>
        )}
        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>{error}</Text>
        ) : null}
        {token ? (
          <Button
            label="Go to Buddies"
            variant="ghost"
            onPress={() => navigation.navigate('Main', { screen: 'Buddies' })}
            style={styles.button}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: 18,
  },
  avatar: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  initial: {
    fontSize: 38,
    fontWeight: '800',
  },
  bio: {
    textAlign: 'center',
    marginTop: 14,
  },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  sent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 20,
  },
});

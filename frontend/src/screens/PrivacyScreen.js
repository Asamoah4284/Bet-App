import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Card } from '../components/Card';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';

const ITEMS = [
  {
    icon: 'phone-portrait-outline',
    title: 'Private on this device',
    text: 'Urges, journal entries, money logs, safety-plan details and your profile photo stay in local device storage.',
  },
  {
    icon: 'cloud-outline',
    title: 'Stored on the server',
    text: 'Your account details, buddy relationships, check-ins you choose to post, and an aggregate streak snapshot for leaderboards.',
  },
  {
    icon: 'podium-outline',
    title: 'Leaderboard is optional',
    text: 'It is off by default. Opting in shows only your display name, username and streak. Money, urges, email, notes and photo are never ranked.',
  },
  {
    icon: 'share-social-outline',
    title: 'Shared buddy profile',
    text: 'Your invitation link reveals your display name, username, bio and buddy code so another person can request to connect.',
  },
];

export function PrivacyScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [savingDiscovery, setSavingDiscovery] = useState(false);
  const [error, setError] = useState(null);

  const toggleDiscovery = async (value) => {
    setSavingDiscovery(true);
    setError(null);
    try {
      await updateProfile({ searchDiscoverable: value });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDiscovery(false);
    }
  };

  return (
    <Screen scroll>
      <BackHeader title="Privacy" />
      <Text style={[theme.typography.body, styles.intro, { color: theme.colors.textSecondary }]}>
        Recovery data deserves careful boundaries. Here is exactly where your information goes.
      </Text>
      <Card>
        <View style={styles.settingRow}>
          <View
            style={[
              styles.icon,
              { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.md },
            ]}
          >
            <Ionicons name="search-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.body}>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
              Allow people to find me
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}
            >
              Let signed-in users find your display name or username. Your email and recovery data
              stay private.
            </Text>
          </View>
          <Switch
            value={Boolean(user?.searchDiscoverable)}
            onValueChange={toggleDiscovery}
            disabled={savingDiscovery}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryMuted }}
            thumbColor={user?.searchDiscoverable ? theme.colors.primary : theme.colors.surface}
          />
        </View>
        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 10 }]}>
            {error}
          </Text>
        ) : null}
      </Card>
      {ITEMS.map((item) => (
        <Card key={item.title}>
          <View style={styles.row}>
            <View
              style={[
                styles.icon,
                { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.md },
              ]}
            >
              <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.body}>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>{item.title}</Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                {item.text}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: -8,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
});

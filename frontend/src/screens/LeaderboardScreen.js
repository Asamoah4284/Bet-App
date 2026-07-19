import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Card } from '../components/Card';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { profileApi } from '../services/api';

export function LeaderboardScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const streakDays = useHabitStore((state) => state.streakDays);
  const urges = useHabitStore((state) => state.urges);
  const journalEntries = useHabitStore((state) => state.journalEntries);
  const moneyKept = useFinanceStore((state) => state.summary.moneyKept);

  const [scope, setScope] = useState('friends');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !user?.leaderboardOptIn) return;
    setLoading(true);
    setError(null);
    try {
      await profileApi.syncStats(token, {
        streakDays,
        moneyKept,
        urgesLogged: urges.length,
        journalEntries: journalEntries.length,
      });
      const result = await profileApi.leaderboard(token, scope);
      setEntries(result.entries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user?.leaderboardOptIn, streakDays, moneyKept, urges.length, journalEntries.length, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleOptIn = async (value) => {
    setError(null);
    try {
      await updateProfile({ leaderboardOptIn: value });
      if (!value) setEntries([]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Screen scroll>
      <BackHeader title="Leaderboard" />

      <Card title="Privacy first">
        <View style={styles.privacyRow}>
          <View style={styles.privacyBody}>
            <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
              Join the leaderboard
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Off by default. Only your display name, username and streak are shown — never money,
              urges, journal entries, email or photo.
            </Text>
          </View>
          <Switch
            value={Boolean(user?.leaderboardOptIn)}
            onValueChange={toggleOptIn}
            trackColor={{ true: theme.colors.secondary, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </Card>

      {user?.leaderboardOptIn ? (
        <>
          <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.pill }]}>
            {['friends', 'global'].map((item) => (
              <Pressable
                key={item}
                onPress={() => setScope(item)}
                style={[
                  styles.tab,
                  scope === item && {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radii.pill,
                    ...theme.elevation.card,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: scope === item ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: '700',
                      textTransform: 'capitalize',
                    },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Card title={scope === 'friends' ? 'Friends ranking' : 'Global ranking'}>
            {loading ? (
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                Updating rankings...
              </Text>
            ) : entries.length === 0 ? (
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                {scope === 'friends'
                  ? 'No opted-in buddies yet. Your own rank appears once your stats sync.'
                  : 'No one has opted in yet. You can be the first.'}
              </Text>
            ) : (
              entries.map((entry) => (
                <View
                  key={entry.id}
                  style={[
                    styles.entry,
                    {
                      borderBottomColor: theme.colors.border,
                      backgroundColor: entry.isMe ? theme.colors.primaryMuted : 'transparent',
                      borderRadius: entry.isMe ? theme.radii.md : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.rank,
                      {
                        backgroundColor:
                          entry.rank <= 3 ? theme.colors.accentMuted : theme.colors.surfaceMuted,
                        borderRadius: theme.radii.pill,
                      },
                    ]}
                  >
                    {entry.rank <= 3 ? (
                      <Ionicons name="trophy" size={15} color={theme.colors.accent} />
                    ) : (
                      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                        {entry.rank}
                      </Text>
                    )}
                  </View>
                  <View style={styles.entryBody}>
                    <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
                      {entry.displayName} {entry.isMe ? '(you)' : ''}
                    </Text>
                    {entry.username ? (
                      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                        @{entry.username}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.streak}>
                    <Ionicons name="flame" size={17} color={theme.colors.accent} />
                    <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
                      {entry.streakDays}
                    </Text>
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>days</Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      ) : (
        <View style={styles.privateEmpty}>
          <Ionicons name="shield-checkmark-outline" size={42} color={theme.colors.primary} />
          <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
            Your recovery stays private
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            Turn on the option above only if friendly streak rankings feel motivating to you.
          </Text>
        </View>
      )}

      {error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.danger, marginBottom: 20 }]}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyBody: {
    flex: 1,
    gap: 4,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryBody: {
    flex: 1,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privateEmpty: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 38,
  },
});

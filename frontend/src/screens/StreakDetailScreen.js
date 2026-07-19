import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { achievementSummary } from '../services/achievements';

export function StreakDetailScreen({ navigation }) {
  const theme = useTheme();
  const streakDays = useHabitStore((state) => state.streakDays);
  const todayKey = useHabitStore((state) => state.todayKey);
  const yesterdayKey = useHabitStore((state) => state.yesterdayKey);
  const todayReflection = useHabitStore((state) => state.todayReflection);
  const yesterdayReflection = useHabitStore((state) => state.yesterdayReflection);
  const refresh = useHabitStore((state) => state.refresh);
  const urges = useHabitStore((state) => state.urges);
  const journalEntries = useHabitStore((state) => state.journalEntries);
  const moneyKept = useFinanceStore((state) => state.summary.moneyKept);
  const summary = achievementSummary({
    streakDays,
    urgesLogged: urges.length,
    journalEntries: journalEntries.length,
    moneyKept,
  });
  const next = summary.next;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <Screen scroll>
      <BackHeader title="Your progress" />
      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderRadius: theme.radii.lg }]}
      >
        <Ionicons name="flame" size={30} color="#FFD59E" />
        <Text style={styles.number}>{streakDays}</Text>
        <Text style={[theme.typography.subtitle, styles.white]}>
          gambling-free {streakDays === 1 ? 'day' : 'days'}
        </Text>
        <Text style={[theme.typography.caption, styles.heroCopy]}>
          Each day counts when you confirm it in your daily reflection.
        </Text>
      </LinearGradient>

      <View
        style={[
          styles.reflection,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <View
          style={[
            styles.reflectionIcon,
            { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.md },
          ]}
        >
          <Ionicons
            name={todayReflection?.status === 'clean' ? 'shield-checkmark' : 'calendar-outline'}
            size={23}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.reflectionBody}>
          <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
            {todayReflection?.status === 'clean'
              ? 'Today is confirmed'
              : todayReflection?.status === 'slipped'
                ? 'Today is recorded as a slip'
                : 'Today is not confirmed yet'}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 3 }]}>
            Missing a reflection does not mean failure—it simply leaves that day unconfirmed.
          </Text>
        </View>
      </View>
      <Button
        label={todayReflection ? "Review today's reflection" : "Complete today's reflection"}
        icon="sunny-outline"
        variant="soft"
        onPress={() => navigation.navigate('DailyReflection', { dayKey: todayKey })}
      />
      {!yesterdayReflection && yesterdayKey ? (
        <Button
          label="Reflect on yesterday"
          icon="time-outline"
          variant="ghost"
          onPress={() => navigation.navigate('DailyReflection', { dayKey: yesterdayKey })}
          style={styles.catchUpButton}
        />
      ) : null}

      {next ? (
        <View
          style={[
            styles.nextCard,
            theme.elevation.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.lg,
            },
          ]}
        >
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            NEXT ACHIEVEMENT
          </Text>
          <View style={styles.nextRow}>
            <View
              style={[
                styles.nextIcon,
                { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.md },
              ]}
            >
              <Ionicons name={next.icon} size={26} color={theme.colors.primary} />
            </View>
            <View style={styles.nextBody}>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
                {next.title}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {next.description}
              </Text>
            </View>
          </View>
          <View style={[styles.track, { backgroundColor: theme.colors.surfaceMuted }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: theme.colors.primary, width: `${next.ratio * 100}%` },
              ]}
            />
          </View>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {Math.floor(next.current)} of {next.target}
          </Text>
        </View>
      ) : null}

      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: theme.colors.secondaryMuted, borderRadius: theme.radii.md }]}>
          <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
            ${Math.max(0, moneyKept).toFixed(0)}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>money kept</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.md }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {summary.unlocked.length}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>unlocked</Text>
        </View>
      </View>

      <Button
        label="View all achievements"
        icon="trophy-outline"
        onPress={() => navigation.navigate('Achievements')}
      />
      <Text style={[theme.typography.caption, styles.note, { color: theme.colors.textSecondary }]}>
        Confirming a slip resets the current streak, but it does not erase the effort or insight that
        got you here. You can begin again with the next clean day.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    padding: 26,
  },
  number: {
    color: '#FFFFFF',
    fontSize: 68,
    lineHeight: 76,
    fontWeight: '800',
  },
  white: {
    color: '#FFFFFF',
  },
  heroCopy: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 10,
  },
  nextCard: {
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
  },
  reflection: {
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reflectionIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionBody: {
    flex: 1,
  },
  catchUpButton: {
    marginTop: 8,
  },
  nextRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginVertical: 14,
  },
  nextIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBody: {
    flex: 1,
    gap: 3,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 7,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  stat: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  note: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
});

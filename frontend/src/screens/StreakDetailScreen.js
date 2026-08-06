import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { achievementSummary } from '../services/achievements';

const STREAK_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

const RANKS = [
  { min: 0, title: 'Day One', subtitle: 'Starting fresh' },
  { min: 3, title: 'Steady', subtitle: 'Building rhythm' },
  { min: 7, title: 'Committed', subtitle: 'A full week' },
  { min: 14, title: 'Resilient', subtitle: 'Two weeks strong' },
  { min: 30, title: 'Anchored', subtitle: 'A month reclaimed' },
  { min: 90, title: 'Transformed', subtitle: 'A new chapter' },
  { min: 180, title: 'Unshaken', subtitle: 'Half a year' },
  { min: 365, title: 'Legend', subtitle: 'A year free' },
];

function rankFor(streakDays) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (streakDays >= rank.min) current = rank;
  }
  return current;
}

function nextMilestone(streakDays) {
  const next = STREAK_MILESTONES.find((m) => m > streakDays);
  if (!next) return null;
  const prev = [...STREAK_MILESTONES].reverse().find((m) => m <= streakDays) || 0;
  const progress = next === prev ? 0 : (streakDays - prev) / (next - prev);
  return { next, prev, progress: Math.min(1, Math.max(0, progress)) };
}

function Panel({ children, style }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function StreakDetailScreen({ navigation }) {
  const theme = useTheme();
  const streakDays = useHabitStore((state) => state.streakDays);
  const todayKey = useHabitStore((state) => state.todayKey);
  const yesterdayKey = useHabitStore((state) => state.yesterdayKey);
  const todayReflection = useHabitStore((state) => state.todayReflection);
  const yesterdayReflection = useHabitStore((state) => state.yesterdayReflection);
  const streakCatchUpExpired = useHabitStore((state) => state.streakCatchUpExpired);
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
  const rank = rankFor(streakDays);
  const milestone = nextMilestone(streakDays);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const reflectionStatus =
    todayReflection?.status === 'clean'
      ? 'confirmed'
      : todayReflection?.status === 'slipped'
        ? 'slipped'
        : 'pending';

  const reflectionCopy = {
    confirmed: {
      title: 'Today is confirmed',
      detail: 'This day counts toward your gambling-free streak.',
      icon: 'shield-checkmark',
      tint: theme.colors.success,
      muted: theme.colors.successMuted,
    },
    slipped: {
      title: 'Today is recorded honestly',
      detail: 'A slip resets the streak — it does not erase the work that got you here.',
      icon: 'heart',
      tint: theme.colors.danger,
      muted: theme.colors.warningMuted,
    },
    pending: {
      title: 'Today is not confirmed yet',
      detail: 'A short reflection keeps your streak accurate and meaningful.',
      icon: 'sunny-outline',
      tint: theme.colors.primary,
      muted: theme.colors.primaryMuted,
    },
  }[reflectionStatus];

  return (
    <Screen scroll contentStyle={styles.screen}>
      <BackHeader title="Your progress" />

      {/* Overview — light status panel (distinct from home streak card) */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.heroHeader}>
          <View>
            <Text style={[styles.heroEyebrow, { color: theme.colors.textSecondary }]}>
              Current streak
            </Text>
            <Text style={[styles.heroRank, { color: theme.colors.primary }]}>
              {rank.title}
              <Text style={{ color: theme.colors.textSecondary, fontWeight: '500' }}>
                {'  ·  '}
                {rank.subtitle}
              </Text>
            </Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: theme.colors.secondaryMuted }]}>
            <Ionicons name="leaf-outline" size={16} color={theme.colors.secondary} />
          </View>
        </View>

        <View style={styles.heroMain}>
          <Text style={[styles.number, { color: theme.colors.text }]}>{streakDays}</Text>
          <View style={styles.heroMainCopy}>
            <Text style={[styles.unit, { color: theme.colors.text }]}>
              gambling-free {streakDays === 1 ? 'day' : 'days'}
            </Text>
            <Text style={[styles.heroHint, { color: theme.colors.textSecondary }]}>
              Confirmed through your daily reflections
            </Text>
          </View>
        </View>

        {milestone ? (
          <View
            style={[
              styles.nextMark,
              { backgroundColor: theme.colors.surfaceMuted },
            ]}
          >
            <View style={styles.nextMarkTop}>
              <Text style={[styles.nextMarkLabel, { color: theme.colors.textSecondary }]}>
                Next mark
              </Text>
              <Text style={[styles.nextMarkValue, { color: theme.colors.secondary }]}>
                {milestone.next} days
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${milestone.progress * 100}%`,
                    backgroundColor: theme.colors.secondary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressCaption, { color: theme.colors.textSecondary }]}>
              {milestone.next - streakDays} day{milestone.next - streakDays === 1 ? '' : 's'} remaining
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.nextMark,
              { backgroundColor: theme.colors.successMuted },
            ]}
          >
            <Text style={[styles.progressCaption, { color: theme.colors.success }]}>
              Every streak milestone cleared
            </Text>
          </View>
        )}
      </View>

      {/* Stats strip */}
      <View
        style={[
          styles.statsStrip,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.statCell}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${Math.max(0, moneyKept).toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Kept</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
        <Pressable
          style={styles.statCell}
          onPress={() => navigation.navigate('Achievements')}
          accessibilityRole="button"
        >
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {summary.unlocked.length}
            <Text style={[styles.statOf, { color: theme.colors.textMuted }]}>
              /{summary.all.length}
            </Text>
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Badges</Text>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.statCell}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {journalEntries.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Journal</Text>
        </View>
      </View>

      {/* Today's reflection */}
      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Today</Text>
      <Panel style={styles.reflectionPanel}>
        <View style={[styles.reflectionIcon, { backgroundColor: reflectionCopy.muted }]}>
          <Ionicons name={reflectionCopy.icon} size={20} color={reflectionCopy.tint} />
        </View>
        <View style={styles.reflectionBody}>
          <Text style={[styles.reflectionTitle, { color: theme.colors.text }]}>
            {reflectionCopy.title}
          </Text>
          <Text style={[styles.reflectionDetail, { color: theme.colors.textSecondary }]}>
            {reflectionCopy.detail}
          </Text>
        </View>
      </Panel>

      <Button
        label={todayReflection ? "Review today's reflection" : "Complete today's reflection"}
        icon="sunny-outline"
        onPress={() => navigation.navigate('DailyReflection', { dayKey: todayKey })}
        style={styles.primaryAction}
      />
      {streakCatchUpExpired ? (
        <View style={[styles.catchUp, { backgroundColor: theme.colors.warningMuted }]}>
          <Ionicons name="refresh-outline" size={16} color={theme.colors.danger} />
          <Text style={[styles.catchUpText, { color: theme.colors.danger, flex: 1 }]}>
            Streak reset — more than one day passed without a check-in. Reflect today to start again
            at 1.
          </Text>
        </View>
      ) : !yesterdayReflection && yesterdayKey ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('DailyReflection', { dayKey: yesterdayKey })}
          style={[styles.catchUp, { backgroundColor: theme.colors.warningMuted }]}
        >
          <Ionicons name="time-outline" size={16} color={theme.colors.danger} />
          <Text style={[styles.catchUpText, { color: theme.colors.danger }]}>
            Catch up on yesterday’s check-in
          </Text>
          <Ionicons name="arrow-forward" size={14} color={theme.colors.danger} />
        </Pressable>
      ) : null}

      {/* Next achievement */}
      {next ? (
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Next badge</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Achievements')}
            style={({ pressed }) => [
              styles.badgeCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.badgeIcon, { backgroundColor: theme.colors.primaryMuted }]}>
              <Ionicons
                name={next.icon.replace('-outline', '')}
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.badgeCopy}>
              <Text style={[styles.badgeTitle, { color: theme.colors.text }]}>{next.title}</Text>
              <Text style={[styles.badgeDesc, { color: theme.colors.textSecondary }]}>
                {next.description}
              </Text>
              <View style={[styles.badgeTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.badgeFill,
                    {
                      width: `${Math.round(next.ratio * 100)}%`,
                      backgroundColor: theme.colors.secondary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.badgeMeta, { color: theme.colors.textSecondary }]}>
                {Math.floor(next.current)} of {next.target} · {Math.round(next.ratio * 100)}%
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      ) : null}

      <Button
        label="View all achievements"
        icon="trophy-outline"
        variant="soft"
        onPress={() => navigation.navigate('Achievements')}
        style={styles.achievementsButton}
      />

      <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
        Confirming a slip resets the current streak, but it does not erase the effort that got you
        here. You can begin again with the next clean day.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  hero: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroRank: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  number: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '700',
    letterSpacing: -1.5,
    minWidth: 72,
  },
  heroMainCopy: {
    flex: 1,
    gap: 4,
  },
  unit: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heroHint: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  nextMark: {
    borderRadius: 12,
    padding: 12,
  },
  nextMarkTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nextMarkLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nextMarkValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressCaption: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  statsStrip: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 22,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statOf: {
    fontSize: 13,
    fontWeight: '600',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  reflectionPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  reflectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionBody: {
    flex: 1,
    gap: 3,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  reflectionDetail: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  primaryAction: {
    marginBottom: 8,
  },
  catchUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  catchUpText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  block: {
    marginTop: 16,
    marginBottom: 8,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCopy: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 17,
  },
  badgeTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  badgeFill: {
    height: '100%',
  },
  badgeMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  achievementsButton: {
    marginTop: 16,
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
  },
});

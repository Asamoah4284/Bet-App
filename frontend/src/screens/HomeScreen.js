import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { useReminderStore } from '../store/reminderStore';
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

function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

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

function MissionRow({ done, icon, label, detail, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.missionRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.missionCheck,
          {
            backgroundColor: done ? theme.colors.secondaryMuted : theme.colors.primaryMuted,
            borderColor: done ? theme.colors.secondary : 'transparent',
          },
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={14} color={theme.colors.secondary} />
        ) : (
          <Ionicons name={icon} size={15} color={theme.colors.primary} />
        )}
      </View>
      <View style={styles.missionCopy}>
        <Text
          style={[
            styles.missionLabel,
            {
              color: done ? theme.colors.textSecondary : theme.colors.text,
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.missionDetail,
            { color: done ? theme.colors.secondary : theme.colors.textSecondary },
          ]}
        >
          {done ? 'Completed' : detail}
        </Text>
      </View>
      {done ? (
        <View style={[styles.missionDonePill, { backgroundColor: theme.colors.secondaryMuted }]}>
          <Text style={[styles.missionDoneText, { color: theme.colors.secondary }]}>Done</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      )}
    </Pressable>
  );
}

function QuickTile({ icon, label, color, muted, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickTile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: muted }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen({ navigation }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const streakDays = useHabitStore((state) => state.streakDays);
  const todayKey = useHabitStore((state) => state.todayKey);
  const yesterdayKey = useHabitStore((state) => state.yesterdayKey);
  const todayReflection = useHabitStore((state) => state.todayReflection);
  const yesterdayReflection = useHabitStore((state) => state.yesterdayReflection);
  const streakCatchUpExpired = useHabitStore((state) => state.streakCatchUpExpired);
  const insights = useHabitStore((state) => state.insights);
  const todayEntry = useHabitStore((state) => state.todayEntry);
  const urges = useHabitStore((state) => state.urges);
  const journalEntries = useHabitStore((state) => state.journalEntries);
  const refreshHabits = useHabitStore((state) => state.refresh);
  const summary = useFinanceStore((state) => state.summary);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);
  const refreshFinance = useFinanceStore((state) => state.refresh);
  const reminderSettings = useReminderStore((state) => state.settings);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      refreshHabits();
      refreshFinance();
    }, [refreshHabits, refreshFinance])
  );

  const milestone = nextMilestone(streakDays);
  const rank = rankFor(streakDays);
  const remindersOff = !reminderSettings.checkinEnabled && !reminderSettings.encouragementEnabled;
  const goalProgress =
    savingsGoal && savingsGoal > 0 ? Math.min(1, summary.moneyKept / savingsGoal) : null;
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const achievements = achievementSummary({
    streakDays,
    urgesLogged: urges.length,
    journalEntries: journalEntries.length,
    moneyKept: summary.moneyKept,
  });
  const nextBadge = achievements.next;

  const scoredMissions = [
    {
      key: 'reflect',
      done: Boolean(todayReflection),
      icon: 'sunny-outline',
      label: 'Daily check-in',
      detail: todayReflection ? 'Done for today' : '+ streak integrity',
      onPress: () => navigation.navigate('DailyReflection', { dayKey: todayKey }),
    },
    {
      key: 'journal',
      done: Boolean(todayEntry),
      icon: 'create-outline',
      label: 'Journal entry',
      detail: todayEntry ? `Mood: ${todayEntry.mood}` : '+ awareness points',
      onPress: () => navigation.navigate('JournalEntry'),
    },
  ];
  const missionsDone = scoredMissions.filter((m) => m.done).length;
  const missionTotal = scoredMissions.length;
  const allMissionRows = [
    ...scoredMissions,
    {
      key: 'urge',
      done: false,
      icon: 'pulse-outline',
      label: 'Prepare for an urge',
      detail: 'Open SOS tools · optional',
      onPress: () => navigation.navigate('UrgeSOS'),
    },
  ];

  const progressRatio = milestone?.progress ?? 1;

  useEffect(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: progressRatio,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, progressRatio, streakDays]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Visible milestone chips around current position
  const milestoneWindow = (() => {
    const idx = STREAK_MILESTONES.findIndex((m) => m > streakDays);
    const center = idx === -1 ? STREAK_MILESTONES.length - 1 : Math.max(0, idx);
    const start = Math.max(0, center - 2);
    return STREAK_MILESTONES.slice(start, start + 5);
  })();

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.brand, { color: theme.colors.primary }]}>Quibet</Text>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              {greetingFor()}, {firstName}
            </Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reminder settings"
              onPress={() => navigation.navigate('Reminders')}
              hitSlop={10}
              style={styles.topIcon}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
              {remindersOff ? (
                <View style={[styles.bellDot, { backgroundColor: theme.colors.secondary }]} />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => navigation.navigate('Profile')}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.avatarText}>{(user?.displayName || 'F')[0].toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        {/* Streak + rank */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View streak and progress"
          onPress={() => navigation.navigate('StreakDetail')}
          style={({ pressed }) => [
            styles.streakCard,
            { backgroundColor: theme.colors.primary, opacity: pressed ? 0.94 : 1 },
          ]}
        >
          <View style={styles.streakTop}>
            <View style={[styles.rankPill, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Ionicons name="ribbon-outline" size={14} color="#FFFFFF" />
              <Text style={styles.rankPillText}>{rank.title}</Text>
            </View>
            <View style={styles.streakLink}>
              <Text style={styles.streakLinkText}>Details</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
            </View>
          </View>

          <View style={styles.streakBody}>
            <View>
              <Text style={styles.streakNumber}>{streakDays}</Text>
              <Text style={styles.streakUnit}>
                gambling-free {streakDays === 1 ? 'day' : 'days'}
              </Text>
              <Text style={styles.rankSubtitle}>{rank.subtitle}</Text>
            </View>
            <View style={[styles.levelRing, { borderColor: 'rgba(255,255,255,0.22)' }]}>
              <Text style={styles.levelRingValue}>{Math.min(99, streakDays)}</Text>
              <Text style={styles.levelRingLabel}>days</Text>
            </View>
          </View>

          <View style={styles.milestoneTrack}>
            {milestoneWindow.map((day) => {
              const reached = streakDays >= day;
              const isNext = milestone?.next === day;
              return (
                <View key={day} style={styles.milestoneChip}>
                  <View
                    style={[
                      styles.milestoneDot,
                      {
                        backgroundColor: reached
                          ? theme.colors.secondary
                          : isNext
                            ? 'rgba(255,255,255,0.85)'
                            : 'rgba(255,255,255,0.25)',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.milestoneChipLabel,
                      { color: reached || isNext ? '#FFFFFF' : 'rgba(255,255,255,0.45)' },
                    ]}
                  >
                    {day}d
                  </Text>
                </View>
              );
            })}
          </View>

          {milestone ? (
            <View style={styles.progressBlock}>
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: barWidth, backgroundColor: theme.colors.secondary },
                  ]}
                />
              </View>
              <Text style={styles.progressCaption}>
                {milestone.next - streakDays} day{milestone.next - streakDays === 1 ? '' : 's'} to{' '}
                {milestone.next}-day badge
              </Text>
            </View>
          ) : (
            <Text style={styles.progressCaption}>You’ve cleared every streak milestone</Text>
          )}
        </Pressable>

        {/* Stats strip */}
        <View style={[styles.statsStrip, { borderColor: theme.colors.border }]}>
          <Pressable
            style={styles.statCell}
            onPress={() => navigation.navigate('LogMoney')}
            accessibilityRole="button"
          >
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              ${summary.moneyKept.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Kept</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <Pressable
            style={styles.statCell}
            onPress={() => navigation.navigate('Achievements')}
            accessibilityRole="button"
          >
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {achievements.unlocked.length}
              <Text style={[styles.statOf, { color: theme.colors.textMuted }]}>
                /{achievements.all.length}
              </Text>
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Badges</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <Pressable
            style={styles.statCell}
            onPress={() => navigation.navigate('LogUrge')}
            accessibilityRole="button"
          >
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {insights?.urgesThisWeek ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Urges</Text>
          </Pressable>
        </View>

        {/* Daily missions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>
            Today’s missions
          </Text>
          <View
            style={[
              styles.missionScore,
              {
                backgroundColor:
                  missionsDone === missionTotal && missionTotal > 0
                    ? theme.colors.secondaryMuted
                    : theme.colors.surfaceMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.missionScoreText,
                {
                  color:
                    missionsDone === missionTotal && missionTotal > 0
                      ? theme.colors.secondary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {missionsDone}/{missionTotal}
            </Text>
          </View>
        </View>
        <View style={styles.missionList}>
          {allMissionRows.map((mission) => (
            <MissionRow
              key={mission.key}
              done={mission.done}
              icon={mission.icon}
              label={mission.label}
              detail={mission.detail}
              onPress={mission.onPress}
            />
          ))}
        </View>

        {streakCatchUpExpired ? (
          <View style={[styles.catchUp, { backgroundColor: theme.colors.warningMuted }]}>
            <Ionicons name="refresh-outline" size={16} color={theme.colors.danger} />
            <Text style={[styles.catchUpText, { color: theme.colors.danger, flex: 1 }]}>
              Streak reset — more than one day passed without a check-in. Reflect today to start
              again at 1.
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

        <Button
          label="I'm having an urge"
          icon="pulse-outline"
          onPress={() => navigation.navigate('UrgeSOS')}
          style={styles.urgeButton}
        />

        {/* Next badge */}
        {nextBadge ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Achievements')}
            style={({ pressed }) => [
              styles.badgeCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.badgeIcon, { backgroundColor: theme.colors.primaryMuted }]}>
              <Ionicons
                name={nextBadge.icon.replace('-outline', '')}
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.badgeCopy}>
              <Text style={[styles.badgeEyebrow, { color: theme.colors.secondary }]}>
                Next badge
              </Text>
              <Text style={[styles.badgeTitle, { color: theme.colors.text }]}>{nextBadge.title}</Text>
              <View style={[styles.badgeTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.badgeFill,
                    {
                      width: `${Math.round(nextBadge.ratio * 100)}%`,
                      backgroundColor: theme.colors.secondary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.badgeMeta, { color: theme.colors.textSecondary }]}>
                {Math.round(nextBadge.ratio * 100)}% · {nextBadge.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 8 }]}>
          Quick actions
        </Text>
        <View style={styles.quickGrid}>
          <QuickTile
            icon="flash-outline"
            label="Log urge"
            color={theme.colors.primary}
            muted={theme.colors.primaryMuted}
            onPress={() => navigation.navigate('LogUrge')}
          />
          <QuickTile
            icon="create-outline"
            label="Journal"
            color={theme.colors.secondary}
            muted={theme.colors.secondaryMuted}
            onPress={() => navigation.navigate('JournalEntry')}
          />
          <QuickTile
            icon="wallet-outline"
            label="Money"
            color={theme.colors.success}
            muted={theme.colors.successMuted}
            onPress={() => navigation.navigate('LogMoney')}
          />
          <QuickTile
            icon="people-outline"
            label="Check-in"
            color={theme.colors.primary}
            muted={theme.colors.primaryMuted}
            onPress={() => navigation.navigate('Checkin')}
          />
        </View>

        {goalProgress !== null ? (
          <View style={[styles.goalCard, { borderColor: theme.colors.border }]}>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Savings goal</Text>
              <Text style={[styles.goalPct, { color: theme.colors.secondary }]}>
                {Math.round(goalProgress * 100)}%
              </Text>
            </View>
            <Text style={[styles.goalMeta, { color: theme.colors.textSecondary }]}>
              ${summary.moneyKept.toFixed(2)} of ${savingsGoal.toFixed(2)}
            </Text>
            <View style={[styles.goalBar, { backgroundColor: theme.colors.surfaceMuted }]}>
              <View
                style={[
                  styles.goalFill,
                  { width: `${goalProgress * 100}%`, backgroundColor: theme.colors.secondary },
                ]}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  topIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  streakCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  streakTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rankPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  streakLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakLinkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  streakBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakNumber: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1.2,
  },
  streakUnit: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
  },
  rankSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  levelRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  levelRingValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  levelRingLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  milestoneTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  milestoneChip: {
    alignItems: 'center',
    gap: 5,
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  milestoneChipLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressBlock: {
    marginTop: 2,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressCaption: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statOf: {
    fontSize: 12,
    fontWeight: '600',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  missionScore: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  missionScoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  missionList: {
    gap: 8,
    marginBottom: 12,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  missionCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionCopy: {
    flex: 1,
    gap: 2,
  },
  missionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  missionDetail: {
    fontSize: 11,
    fontWeight: '500',
  },
  missionDonePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  missionDoneText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  catchUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  catchUpText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  urgeButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
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
  badgeEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  quickTile: {
    width: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalMeta: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  goalBar: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
  },
});

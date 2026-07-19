import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { useReminderStore } from '../store/reminderStore';

const STREAK_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

const DAILY_QUOTES = [
  'You are not your urges. You are the one who notices them.',
  'Every hour you do not gamble is money, time, and peace you keep.',
  'Recovery is not about being perfect. It is about coming back.',
  'The urge always passes - whether you act on it or not. Let it pass.',
  'You have survived 100% of your hardest days so far.',
  'Small steps every day beat big promises once a year.',
  'The best bet you can make is on yourself.',
  'One day at a time is not a slogan. It is a strategy.',
  'Your future self is already grateful for what you do today.',
  'Slips are chapters, not the whole story.',
];

function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Still up? Be kind to yourself';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function nextMilestone(streakDays) {
  const next = STREAK_MILESTONES.find((m) => m > streakDays);
  if (!next) {
    return null; // Past every milestone - a year and beyond.
  }
  const prev = [...STREAK_MILESTONES].reverse().find((m) => m <= streakDays) || 0;
  const progress = next === prev ? 0 : (streakDays - prev) / (next - prev);
  return { next, progress: Math.min(1, Math.max(0, progress)) };
}

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (24 * 60 * 60 * 1000));
}

function QuickAction({ icon, label, color, colorMuted, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: colorMuted, borderRadius: theme.radii.sm }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[theme.typography.caption, { color: theme.colors.text, fontWeight: '600' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatCard({ icon, label, value, tint, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        theme.elevation.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen({ navigation }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const streakDays = useHabitStore((state) => state.streakDays);
  const insights = useHabitStore((state) => state.insights);
  const todayEntry = useHabitStore((state) => state.todayEntry);
  const refreshHabits = useHabitStore((state) => state.refresh);
  const summary = useFinanceStore((state) => state.summary);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);
  const refreshFinance = useFinanceStore((state) => state.refresh);
  const reminderSettings = useReminderStore((state) => state.settings);

  useFocusEffect(
    useCallback(() => {
      refreshHabits();
      refreshFinance();
    }, [refreshHabits, refreshFinance])
  );

  const milestone = nextMilestone(streakDays);
  const quote = DAILY_QUOTES[dayOfYear() % DAILY_QUOTES.length];
  const remindersOff = !reminderSettings.checkinEnabled && !reminderSettings.encouragementEnabled;
  const goalProgress =
    savingsGoal && savingsGoal > 0 ? Math.min(1, summary.moneyKept / savingsGoal) : null;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {today}
          </Text>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>
            {greetingFor()}, {user?.displayName?.split(' ')[0] || 'friend'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reminder settings"
            onPress={() => navigation.navigate('Reminders')}
            hitSlop={8}
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.pill,
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
            {remindersOff ? (
              <View style={[styles.bellDot, { backgroundColor: theme.colors.accent }]} />
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => navigation.navigate('Profile')}
            hitSlop={8}
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.pill },
            ]}
          >
            <Text style={[theme.typography.subtitle, { color: theme.colors.primary }]}>
              {(user?.displayName || 'F')[0].toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View streak and next achievement"
        onPress={() => navigation.navigate('StreakDetail')}
      >
        <LinearGradient
          colors={theme.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.streakCard, { borderRadius: theme.radii.lg }]}
        >
        <View style={styles.streakTop}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FFD59E" />
            <Text style={[theme.typography.caption, styles.streakBadgeText]}>
              Gambling-free streak
            </Text>
          </View>
        </View>
        <View style={styles.streakNumberRow}>
          <Text style={styles.streakNumber}>{streakDays}</Text>
          <Text style={[theme.typography.subtitle, styles.streakUnit]}>
            {streakDays === 1 ? 'day' : 'days'}
          </Text>
        </View>

        {milestone ? (
          <View style={styles.milestoneBlock}>
            <View style={styles.milestoneBar}>
              <View style={[styles.milestoneFill, { width: `${milestone.progress * 100}%` }]} />
            </View>
            <Text style={[theme.typography.caption, styles.milestoneText]}>
              {milestone.next - streakDays} {milestone.next - streakDays === 1 ? 'day' : 'days'} to
              your {milestone.next}-day milestone
            </Text>
          </View>
        ) : (
          <Text style={[theme.typography.caption, styles.milestoneText]}>
            Over a year strong. Extraordinary.
          </Text>
        )}
          <View style={styles.streakHint}>
            <Text style={[theme.typography.caption, { color: 'rgba(255,255,255,0.85)' }]}>
              View progress
            </Text>
            <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>
      </Pressable>

      <Button
        label="I'm having an urge"
        icon="pulse-outline"
        variant="secondary"
        onPress={() => navigation.navigate('UrgeSOS')}
        style={styles.urgeButton}
      />

      <Text style={[theme.typography.caption, styles.sectionLabel, { color: theme.colors.textSecondary }]}>
        QUICK ACTIONS
      </Text>
      <View style={styles.quickGrid}>
        <QuickAction
          icon="thunderstorm-outline"
          label="Log an urge"
          color={theme.colors.primary}
          colorMuted={theme.colors.primaryMuted}
          onPress={() => navigation.navigate('LogUrge')}
        />
        <QuickAction
          icon="book-outline"
          label="Journal"
          color={theme.colors.secondary}
          colorMuted={theme.colors.secondaryMuted}
          onPress={() => navigation.navigate('JournalEntry')}
        />
        <QuickAction
          icon="wallet-outline"
          label="Log money"
          color={theme.colors.accent}
          colorMuted={theme.colors.accentMuted}
          onPress={() => navigation.navigate('LogMoney')}
        />
        <QuickAction
          icon="megaphone-outline"
          label="Check in"
          color={theme.colors.primary}
          colorMuted={theme.colors.primaryMuted}
          onPress={() => navigation.navigate('Checkin')}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="cash-outline"
          label="Money kept"
          value={`$${summary.moneyKept.toFixed(0)}`}
          tint={theme.colors.secondary}
          onPress={() => navigation.navigate('LogMoney')}
        />
        <StatCard
          icon="thunderstorm-outline"
          label="Urges this week"
          value={String(insights?.urgesThisWeek ?? 0)}
          tint={theme.colors.accent}
          onPress={() => navigation.navigate('LogUrge')}
        />
      </View>

      {goalProgress !== null ? (
        <Card title="Savings goal">
          <View style={styles.goalRow}>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
              ${summary.moneyKept.toFixed(2)} of ${savingsGoal.toFixed(2)}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.secondary, fontWeight: '700' }]}>
              {Math.round(goalProgress * 100)}%
            </Text>
          </View>
          <View style={[styles.goalBar, { backgroundColor: theme.colors.surfaceMuted }]}>
            <View
              style={[
                styles.goalFill,
                { backgroundColor: theme.colors.secondary, width: `${goalProgress * 100}%` },
              ]}
            />
          </View>
        </Card>
      ) : null}

      <Card title="Today's journal">
        {todayEntry ? (
          <View>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
              Mood: {todayEntry.mood}
            </Text>
            {todayEntry.note ? (
              <Text
                style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 6 }]}
                numberOfLines={2}
              >
                {todayEntry.note}
              </Text>
            ) : null}
            <Button
              label="Edit entry"
              variant="soft"
              onPress={() => navigation.navigate('JournalEntry')}
              style={styles.cardButton}
            />
          </View>
        ) : (
          <View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              You haven't checked in with yourself today.
            </Text>
            <Button
              label="Write today's entry"
              variant="soft"
              onPress={() => navigation.navigate('JournalEntry')}
              style={styles.cardButton}
            />
          </View>
        )}
      </Card>

      {insights && insights.urgesThisWeek > 0 ? (
        <Card title="This week">
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>
            {insights.urgesThisWeek} urge{insights.urgesThisWeek === 1 ? '' : 's'} logged.
            {insights.topEmotion ? ` Most common feeling: ${insights.topEmotion.value}.` : ''}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
            Logging urges is a win — it means you noticed instead of acted.
          </Text>
        </Card>
      ) : null}

      <View
        style={[
          styles.quoteCard,
          { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.lg },
        ]}
      >
        <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
        <Text style={[theme.typography.body, styles.quoteText, { color: theme.colors.text }]}>
          {quote}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerText: {
    gap: 2,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    padding: 22,
    marginBottom: 16,
  },
  streakTop: {
    flexDirection: 'row',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakBadgeText: {
    color: '#FFFFFF',
  },
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  streakNumber: {
    fontSize: 60,
    fontWeight: '800',
    lineHeight: 66,
    color: '#FFFFFF',
  },
  streakUnit: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 10,
  },
  milestoneBlock: {
    marginTop: 12,
  },
  milestoneBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  milestoneFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  milestoneText: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
  },
  streakHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  urgeButton: {
    marginBottom: 20,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  quickAction: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalBar: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 999,
  },
  cardButton: {
    marginTop: 14,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 18,
    marginBottom: 24,
  },
  quoteText: {
    flex: 1,
    fontStyle: 'italic',
  },
});

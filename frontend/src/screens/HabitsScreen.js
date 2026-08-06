import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';

const MOOD_META = {
  great: { label: 'Great', tone: 'success' },
  good: { label: 'Good', tone: 'secondary' },
  okay: { label: 'Okay', tone: 'primary' },
  low: { label: 'Low', tone: 'warning' },
  struggling: { label: 'Hard', tone: 'danger' },
};

const SUGGESTIONS_BY_EMOTION = {
  stressed: {
    icon: 'cloud-outline',
    text: 'Stress shows up before your urges. Try a 2-minute breathing break when tension builds.',
  },
  bored: {
    icon: 'walk-outline',
    text: 'Boredom is your most common trigger. Keep a go-to activity ready before the urge fills the gap.',
  },
  lonely: {
    icon: 'chatbubbles-outline',
    text: 'Loneliness often comes first. Message a buddy when it creeps in — connection beats the urge.',
  },
  anxious: {
    icon: 'leaf-outline',
    text: 'Anxiety is your top trigger. Ground yourself: 5 things you see, 4 you hear, 3 you can touch.',
  },
  sad: {
    icon: 'heart-outline',
    text: 'Low moods show up before urges. Be gentle — fresh air or a short call still counts as progress.',
  },
  excited: {
    icon: 'flash-outline',
    text: 'Excitement is your most common trigger. Channel it into exercise, music, or sharing good news.',
  },
  angry: {
    icon: 'fitness-outline',
    text: 'Anger fuels your urges most. Move the energy first, then decide what to do next.',
  },
};

const SUGGESTIONS_BY_TIME = {
  morning: {
    icon: 'sunny-outline',
    text: 'Urges cluster in the morning. Plan your first hour the night before so there’s no empty space.',
  },
  afternoon: {
    icon: 'partly-sunny-outline',
    text: 'Afternoons are your risky window. Schedule something concrete so the urge has no room.',
  },
  evening: {
    icon: 'moon-outline',
    text: 'Evenings are your risky window. Build a wind-down ritual and keep your phone out of reach.',
  },
  night: {
    icon: 'bed-outline',
    text: 'Late nights are risky. Urges get louder when you’re tired — an earlier bedtime helps.',
  },
};

const GENERIC_SUGGESTIONS = [
  {
    icon: 'create-outline',
    text: 'A one-line journal entry each day keeps you honest. Consistency matters more than length.',
  },
  {
    icon: 'walk-outline',
    text: 'Urges usually pass in 15–20 minutes. A short walk is often exactly long enough.',
  },
  {
    icon: 'people-outline',
    text: 'Telling one person about an urge cuts its power. Your buddy code is in Profile.',
  },
];

function dayKeyFor(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return {
    key: `${y}-${m}-${d}`,
    label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
  };
}

function buildWeekStrip(journalEntries) {
  const byDate = new Map(journalEntries.map((entry) => [entry.entry_date, entry]));
  const days = [];
  for (let offset = 6; offset >= 0; offset--) {
    const { key, label } = dayKeyFor(offset);
    days.push({ key, label, entry: byDate.get(key) || null, isToday: offset === 0 });
  }
  return days;
}

function journalStreak(journalEntries) {
  const dates = new Set(journalEntries.map((entry) => entry.entry_date));
  let streak = 0;
  for (let offset = dates.has(dayKeyFor(0).key) ? 0 : 1; ; offset++) {
    if (dates.has(dayKeyFor(offset).key)) streak++;
    else break;
  }
  return streak;
}

function urgeTrend(urges) {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  let thisWeek = 0;
  let lastWeek = 0;
  for (const urge of urges) {
    const t = new Date(urge.created_at.replace(' ', 'T') + 'Z').getTime();
    if (now - t <= week) thisWeek++;
    else if (now - t <= 2 * week) lastWeek++;
  }
  return { thisWeek, lastWeek };
}

function pickSuggestions(insights) {
  const picked = [];
  const emotion = insights?.topEmotion?.value?.toLowerCase();
  const time = insights?.topTimeOfDay?.value?.toLowerCase();

  if (emotion && SUGGESTIONS_BY_EMOTION[emotion]) {
    picked.push(SUGGESTIONS_BY_EMOTION[emotion]);
  }
  if (time && SUGGESTIONS_BY_TIME[time]) {
    picked.push(SUGGESTIONS_BY_TIME[time]);
  }
  for (const generic of GENERIC_SUGGESTIONS) {
    if (picked.length >= 3) break;
    picked.push(generic);
  }
  return picked;
}

function formatDateTime(sqliteUtc) {
  const date = new Date(sqliteUtc.replace(' ', 'T') + 'Z');
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEntryDate(entryDate) {
  const date = new Date(`${entryDate}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function moodColor(theme, mood) {
  const tone = MOOD_META[mood]?.tone || 'primary';
  if (tone === 'success') return theme.colors.success;
  if (tone === 'secondary') return theme.colors.secondary;
  if (tone === 'warning') return theme.colors.warning;
  if (tone === 'danger') return theme.colors.danger;
  return theme.colors.primary;
}

function Panel({ children, style }) {
  const theme = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}>
      {children}
    </View>
  );
}

function SectionLabel({ children }) {
  const theme = useTheme();
  return <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>{children}</Text>;
}

export function HabitsScreen({ navigation }) {
  const theme = useTheme();
  const urges = useHabitStore((state) => state.urges);
  const journalEntries = useHabitStore((state) => state.journalEntries);
  const insights = useHabitStore((state) => state.insights);
  const todayEntry = useHabitStore((state) => state.todayEntry);
  const refresh = useHabitStore((state) => state.refresh);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const week = buildWeekStrip(journalEntries);
  const streak = journalStreak(journalEntries);
  const trend = urgeTrend(urges);
  const suggestions = pickSuggestions(insights);

  const triggerItems = [
    insights?.topEmotion && {
      icon: 'heart-outline',
      label: 'Feeling',
      value: insights.topEmotion.value,
      count: insights.topEmotion.count,
    },
    insights?.topLocation && {
      icon: 'location-outline',
      label: 'Place',
      value: insights.topLocation.value,
      count: insights.topLocation.count,
    },
    insights?.topTimeOfDay && {
      icon: 'time-outline',
      label: 'Time',
      value: insights.topTimeOfDay.value,
      count: insights.topTimeOfDay.count,
    },
  ].filter(Boolean);
  const maxTriggerCount = Math.max(0, ...triggerItems.map((item) => item.count));

  const trendDelta = trend.thisWeek - trend.lastWeek;
  const trendImproving = trendDelta < 0;
  const trendLabel =
    trend.lastWeek === 0 && trend.thisWeek === 0
      ? 'Quiet two weeks'
      : trendDelta < 0
        ? `${Math.abs(trendDelta)} fewer vs last week`
        : trendDelta > 0
          ? `${trendDelta} more vs last week`
          : 'Same as last week';

  const weekFilled = week.filter((day) => day.entry).length;

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.brand, { color: theme.colors.primary }]}>Habits</Text>
          <Text style={[styles.headline, { color: theme.colors.text }]}>Your patterns</Text>
          <Text style={[styles.subhead, { color: theme.colors.textSecondary }]}>
            Notice what shows up. Respond with intention.
          </Text>
        </View>
      </View>

      {/* Week rhythm */}
      <Panel style={styles.weekPanel}>
        <View style={styles.weekHeader}>
          <View>
            <Text style={[styles.panelEyebrow, { color: theme.colors.textSecondary }]}>This week</Text>
            <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
              {weekFilled}/7 days journaled
            </Text>
          </View>
          <View style={[styles.streakChip, { backgroundColor: theme.colors.secondaryMuted }]}>
            <Ionicons name="flame-outline" size={14} color={theme.colors.secondary} />
            <Text style={[styles.streakChipText, { color: theme.colors.secondary }]}>
              {streak > 0 ? `${streak}d streak` : 'Start streak'}
            </Text>
          </View>
        </View>

        <View style={styles.weekStrip}>
          {week.map((day) => {
            const filled = Boolean(day.entry);
            const mood = day.entry?.mood;
            const fill = filled ? moodColor(theme, mood) : theme.colors.surfaceMuted;
            return (
              <Pressable
                key={day.key}
                accessibilityRole="button"
                accessibilityLabel={day.isToday ? 'Journal today' : day.label}
                onPress={() => (day.isToday ? navigation.navigate('JournalEntry') : null)}
                style={styles.weekDay}
              >
                <View
                  style={[
                    styles.weekBubble,
                    {
                      backgroundColor: filled ? fill : theme.colors.surfaceMuted,
                      borderColor: day.isToday ? theme.colors.primary : 'transparent',
                      borderWidth: day.isToday ? 2 : 0,
                    },
                  ]}
                >
                  {filled ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : day.isToday ? (
                    <Ionicons name="add" size={16} color={theme.colors.primary} />
                  ) : (
                    <View style={[styles.weekDot, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>
                <Text
                  style={[
                    styles.weekLabel,
                    {
                      color: day.isToday ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: day.isToday ? '700' : '500',
                    },
                  ]}
                >
                  {day.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('JournalEntry')}
          style={({ pressed }) => [
            styles.todayCta,
            {
              backgroundColor: todayEntry ? theme.colors.successMuted : theme.colors.primaryMuted,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name={todayEntry ? 'checkmark-circle' : 'create-outline'}
            size={18}
            color={todayEntry ? theme.colors.success : theme.colors.primary}
          />
          <Text
            style={[
              styles.todayCtaText,
              { color: todayEntry ? theme.colors.success : theme.colors.primary },
            ]}
          >
            {todayEntry
              ? `Today logged · ${MOOD_META[todayEntry.mood]?.label || todayEntry.mood}`
              : 'Write today’s journal entry'}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={todayEntry ? theme.colors.success : theme.colors.primary}
          />
        </Pressable>
      </Panel>

      {/* Primary actions */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('LogUrge')}
          style={({ pressed }) => [
            styles.actionTile,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="flash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionTileTitle}>Log urge</Text>
          <Text style={styles.actionTileMeta}>Capture the moment</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('JournalEntry')}
          style={({ pressed }) => [
            styles.actionTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="create-outline" size={20} color={theme.colors.secondary} />
          <Text style={[styles.actionTileTitle, { color: theme.colors.text }]}>Journal</Text>
          <Text style={[styles.actionTileMeta, { color: theme.colors.textSecondary }]}>
            Check in with yourself
          </Text>
        </Pressable>
      </View>

      {/* Urge trend hero */}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('LogUrge')}
        style={({ pressed }) => [
          styles.trendCard,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.94 : 1 },
        ]}
      >
        <View style={styles.trendTop}>
          <Text style={styles.trendEyebrow}>Urge awareness</Text>
          <View style={styles.trendBadge}>
            <Ionicons
              name={trendImproving ? 'trending-down' : trendDelta > 0 ? 'trending-up' : 'remove'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.trendBadgeText}>{trendLabel}</Text>
          </View>
        </View>
        <View style={styles.trendMetrics}>
          <View>
            <Text style={styles.trendNumber}>{trend.thisWeek}</Text>
            <Text style={styles.trendUnit}>logged this week</Text>
          </View>
          <View style={styles.trendCompare}>
            <Text style={styles.trendCompareValue}>{trend.lastWeek}</Text>
            <Text style={styles.trendCompareLabel}>last week</Text>
          </View>
        </View>
        <Text style={styles.trendFoot}>
          Logging without acting is a rep. You’re training the noticing muscle.
        </Text>
      </Pressable>

      {/* Triggers */}
      {triggerItems.length > 0 ? (
        <View style={styles.block}>
          <SectionLabel>Top triggers</SectionLabel>
          <Panel>
            {triggerItems.map((item, index) => {
              const ratio = maxTriggerCount > 0 ? item.count / maxTriggerCount : 0;
              return (
                <View
                  key={item.label}
                  style={[
                    styles.triggerRow,
                    index < triggerItems.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={[styles.triggerIcon, { backgroundColor: theme.colors.primaryMuted }]}>
                    <Ionicons name={item.icon} size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.triggerBody}>
                    <View style={styles.triggerLabelRow}>
                      <Text style={[styles.triggerLabel, { color: theme.colors.textSecondary }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.triggerCount, { color: theme.colors.textMuted }]}>
                        {item.count}x
                      </Text>
                    </View>
                    <Text style={[styles.triggerValue, { color: theme.colors.text }]}>
                      {item.value}
                    </Text>
                    <View style={[styles.triggerBar, { backgroundColor: theme.colors.surfaceMuted }]}>
                      <View
                        style={[
                          styles.triggerFill,
                          {
                            backgroundColor: theme.colors.secondary,
                            width: `${Math.max(10, ratio * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </Panel>
        </View>
      ) : null}

      {/* Suggestions */}
      <View style={styles.block}>
        <SectionLabel>Guidance</SectionLabel>
        <Panel style={{ paddingVertical: 4 }}>
          {suggestions.map((suggestion, index) => (
            <View
              key={suggestion.text}
              style={[
                styles.suggestionRow,
                index < suggestions.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <View style={[styles.suggestionIcon, { backgroundColor: theme.colors.secondaryMuted }]}>
                <Ionicons name={suggestion.icon} size={16} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                {suggestion.text}
              </Text>
            </View>
          ))}
        </Panel>
      </View>

      {/* Recent urges */}
      <View style={styles.block}>
        <View style={styles.sectionHeader}>
          <SectionLabel>Recent urges</SectionLabel>
          <Text style={[styles.countPill, { color: theme.colors.textSecondary }]}>
            {urges.length}
          </Text>
        </View>
        <Panel style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
          {urges.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Nothing logged yet. When an urge hits, capture it here so it loses power.
            </Text>
          ) : (
            urges.slice(0, 8).map((urge, index, list) => (
              <View
                key={urge.id}
                style={[
                  styles.listRow,
                  index < list.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.intensityBadge,
                    {
                      backgroundColor:
                        urge.intensity >= 7
                          ? theme.colors.warningMuted
                          : theme.colors.secondaryMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.intensityValue,
                      {
                        color:
                          urge.intensity >= 7 ? theme.colors.danger : theme.colors.secondary,
                      },
                    ]}
                  >
                    {urge.intensity}
                  </Text>
                </View>
                <View style={styles.listBody}>
                  <Text style={[styles.listTitle, { color: theme.colors.text }]}>
                    {[urge.emotion, urge.location, urge.time_of_day]
                      .filter(Boolean)
                      .join(' · ') || 'Urge logged'}
                  </Text>
                  <Text style={[styles.listMeta, { color: theme.colors.textSecondary }]}>
                    {formatDateTime(urge.created_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Panel>
      </View>

      {/* Journal history */}
      <View style={styles.block}>
        <View style={styles.sectionHeader}>
          <SectionLabel>Journal</SectionLabel>
          <Pressable onPress={() => navigation.navigate('JournalEntry')} hitSlop={8}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Add entry</Text>
          </Pressable>
        </View>
        <Panel style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
          {journalEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No entries yet. A single honest line is enough.
            </Text>
          ) : (
            journalEntries.slice(0, 6).map((entry, index, list) => (
              <View
                key={entry.id}
                style={[
                  styles.listRow,
                  index < list.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.moodDot,
                    { backgroundColor: moodColor(theme, entry.mood) },
                  ]}
                />
                <View style={styles.listBody}>
                  <Text style={[styles.listTitle, { color: theme.colors.text }]}>
                    {formatEntryDate(entry.entry_date)}
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: '500' }}>
                      {'  ·  '}
                      {MOOD_META[entry.mood]?.label || entry.mood}
                    </Text>
                  </Text>
                  {entry.note ? (
                    <Text
                      style={[styles.listMeta, { color: theme.colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {entry.note}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Panel>
      </View>

      <Button
        label="I'm having an urge"
        icon="pulse-outline"
        onPress={() => navigation.navigate('UrgeSOS')}
        style={styles.sosButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  topBar: {
    marginBottom: 18,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  subhead: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  weekPanel: {
    marginBottom: 14,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  panelEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  streakChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  weekBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  weekLabel: {
    fontSize: 11,
  },
  todayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  todayCtaText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionTile: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    minHeight: 104,
    justifyContent: 'flex-end',
  },
  actionTileTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  actionTileMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '500',
  },
  trendCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  trendTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  trendBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  trendMetrics: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  trendNumber: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1.2,
  },
  trendUnit: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
  },
  trendCompare: {
    alignItems: 'flex-end',
  },
  trendCompareValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendCompareLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  trendFoot: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.68)',
    fontWeight: '500',
  },
  block: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  countPill: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  triggerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerBody: {
    flex: 1,
    gap: 4,
  },
  triggerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  triggerCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  triggerValue: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  triggerBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  triggerFill: {
    height: '100%',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  intensityBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listBody: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  listMeta: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '500',
  },
  sosButton: {
    marginTop: 4,
    marginBottom: 8,
  },
});

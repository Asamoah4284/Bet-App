import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';

const MOOD_META = {
  great: { emoji: '😄', rank: 5 },
  good: { emoji: '🙂', rank: 4 },
  okay: { emoji: '😐', rank: 3 },
  low: { emoji: '😔', rank: 2 },
  struggling: { emoji: '😣', rank: 1 },
};

const SUGGESTIONS_BY_EMOTION = {
  stressed: {
    icon: 'cloud-outline',
    text: 'Stress shows up before your urges. Try a 2-minute breathing break when tension builds - before the urge does.',
  },
  bored: {
    icon: 'game-controller-outline',
    text: 'Boredom is your most common trigger. Keep a go-to activity ready: a walk route, a playlist, a game that is not gambling.',
  },
  lonely: {
    icon: 'chatbubbles-outline',
    text: 'Loneliness often comes before your urges. Message a buddy or a friend when it creeps in - connection beats the urge.',
  },
  anxious: {
    icon: 'cloud-outline',
    text: 'Anxiety is your most common trigger. Grounding helps: name 5 things you can see, 4 you can hear, 3 you can touch.',
  },
  sad: {
    icon: 'heart-outline',
    text: 'Low moods show up before your urges. Be extra gentle on hard days - a shower, fresh air, or calling someone counts as a win.',
  },
  excited: {
    icon: 'flash-outline',
    text: 'Excitement is your most common trigger. Channel the buzz somewhere safe: exercise, music, or sharing good news with a buddy.',
  },
  angry: {
    icon: 'flame-outline',
    text: 'Anger fuels your urges most. Move the energy first - fast walk, push-ups, loud music - then decide what to do next.',
  },
};

const SUGGESTIONS_BY_TIME = {
  morning: {
    icon: 'sunny-outline',
    text: 'Your urges cluster in the morning. Plan the first hour of your day the night before so there is no empty space to fill.',
  },
  afternoon: {
    icon: 'partly-sunny-outline',
    text: 'Afternoons are your risky window. Schedule something concrete then - a walk, errand, or call - so the urge has no room.',
  },
  evening: {
    icon: 'moon-outline',
    text: 'Evenings are your risky window. Build a wind-down ritual: phone in another room, a show, a book, an early night.',
  },
  night: {
    icon: 'bed-outline',
    text: 'Late nights are your risky window. Urges get louder when you are tired - an earlier bedtime is genuine relapse prevention.',
  },
};

const GENERIC_SUGGESTIONS = [
  {
    icon: 'book-outline',
    text: 'A one-line journal entry each day keeps you honest with yourself. Consistency matters more than length.',
  },
  {
    icon: 'walk-outline',
    text: 'Urges usually pass in 15-20 minutes. A walk around the block is often exactly long enough.',
  },
  {
    icon: 'people-outline',
    text: 'Telling one person about an urge cuts its power in half. Your buddy code is in your profile.',
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
  // Today still counts as pending, so a missing entry today doesn't break the run.
  for (let offset = dates.has(dayKeyFor(0).key) ? 0 : 1; ; offset++) {
    if (dates.has(dayKeyFor(offset).key)) {
      streak++;
    } else {
      break;
    }
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

function TriggerRow({ icon, label, value, count, maxCount }) {
  const theme = useTheme();
  const ratio = maxCount > 0 ? count / maxCount : 0;

  return (
    <View style={styles.triggerRow}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <View style={styles.triggerBody}>
        <View style={styles.triggerLabelRow}>
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>
            {label}: <Text style={{ fontWeight: '700' }}>{value}</Text>
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {count}x
          </Text>
        </View>
        <View style={[styles.triggerBar, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View
            style={[
              styles.triggerFill,
              { backgroundColor: theme.colors.primary, width: `${Math.max(8, ratio * 100)}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export function HabitsScreen({ navigation }) {
  const theme = useTheme();
  const urges = useHabitStore((state) => state.urges);
  const journalEntries = useHabitStore((state) => state.journalEntries);
  const insights = useHabitStore((state) => state.insights);
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
  const trendColor =
    trendDelta < 0 ? theme.colors.secondary : trendDelta > 0 ? theme.colors.accent : theme.colors.textSecondary;
  const trendIcon = trendDelta < 0 ? 'trending-down' : trendDelta > 0 ? 'trending-up' : 'remove';
  const trendLabel =
    trend.lastWeek === 0 && trend.thisWeek === 0
      ? 'No urges in two weeks'
      : trendDelta < 0
        ? `${Math.abs(trendDelta)} fewer than last week`
        : trendDelta > 0
          ? `${trendDelta} more than last week`
          : 'Same as last week';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>Habits</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
            Notice patterns, build better ones
          </Text>
        </View>
      </View>

      <Card title="Your last 7 days">
        <View style={styles.weekStrip}>
          {week.map((day) => (
            <Pressable
              key={day.key}
              onPress={() => (day.isToday ? navigation.navigate('JournalEntry') : null)}
              style={styles.weekDay}
            >
              <View
                style={[
                  styles.weekBubble,
                  {
                    backgroundColor: day.entry
                      ? theme.colors.secondaryMuted
                      : theme.colors.surfaceMuted,
                    borderColor: day.isToday ? theme.colors.primary : 'transparent',
                    borderWidth: day.isToday ? 2 : 0,
                  },
                ]}
              >
                <Text style={styles.weekEmoji}>
                  {day.entry ? MOOD_META[day.entry.mood]?.emoji || '📝' : day.isToday ? '＋' : '·'}
                </Text>
              </View>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {day.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12 }]}>
          {streak > 0
            ? `📝 ${streak}-day journaling streak. Keep the thread going.`
            : 'Tap today to start a journaling streak.'}
        </Text>
      </Card>

      <View style={styles.actionRow}>
        <Button
          label="Log urge"
          icon="thunderstorm-outline"
          variant="secondary"
          onPress={() => navigation.navigate('LogUrge')}
          style={styles.actionButton}
        />
        <Button
          label="Journal"
          icon="book-outline"
          variant="soft"
          onPress={() => navigation.navigate('JournalEntry')}
          style={styles.actionButton}
        />
      </View>

      <Card title="Urge trend">
        <View style={styles.trendRow}>
          <View>
            <Text style={[styles.trendNumber, { color: theme.colors.text }]}>{trend.thisWeek}</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              urges this week
            </Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.pill }]}>
            <Ionicons name={trendIcon} size={16} color={trendColor} />
            <Text style={[theme.typography.caption, { color: trendColor, fontWeight: '700' }]}>
              {trendLabel}
            </Text>
          </View>
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 10 }]}>
          Every urge you log without acting on it is a rep. You are training the noticing muscle.
        </Text>
      </Card>

      {triggerItems.length > 0 ? (
        <Card title="Your top triggers">
          {triggerItems.map((item) => (
            <TriggerRow key={item.label} {...item} maxCount={maxTriggerCount} />
          ))}
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
            Knowing your patterns makes them easier to plan around.
          </Text>
        </Card>
      ) : null}

      <Card title="Suggestions for you">
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
            <View
              style={[
                styles.suggestionIcon,
                { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.sm },
              ]}
            >
              <Ionicons name={suggestion.icon} size={18} color={theme.colors.primary} />
            </View>
            <Text style={[theme.typography.body, styles.suggestionText, { color: theme.colors.text }]}>
              {suggestion.text}
            </Text>
          </View>
        ))}
      </Card>

      <Card title={`Recent urges (${urges.length})`}>
        {urges.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Nothing logged yet. When an urge hits, logging it here helps it pass.
          </Text>
        ) : (
          urges.slice(0, 10).map((urge) => (
            <View
              key={urge.id}
              style={[styles.listRow, { borderBottomColor: theme.colors.border }]}
            >
              <View
                style={[
                  styles.intensityBadge,
                  {
                    backgroundColor:
                      urge.intensity >= 7
                        ? theme.colors.dangerMuted
                        : theme.colors.secondaryMuted,
                    borderRadius: theme.radii.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.subtitle,
                    {
                      color: urge.intensity >= 7 ? theme.colors.danger : theme.colors.secondary,
                    },
                  ]}
                >
                  {urge.intensity}
                </Text>
              </View>
              <View style={styles.listBody}>
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  {[urge.emotion, urge.location, urge.time_of_day]
                    .filter(Boolean)
                    .join(' · ') || 'Urge'}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {formatDateTime(urge.created_at)}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <Card title="Journal">
        {journalEntries.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            No entries yet. A line a day is plenty.
          </Text>
        ) : (
          journalEntries.slice(0, 7).map((entry) => (
            <View
              key={entry.id}
              style={[styles.listRow, { borderBottomColor: theme.colors.border }]}
            >
              <Text style={styles.journalEmoji}>{MOOD_META[entry.mood]?.emoji || '📝'}</Text>
              <View style={styles.listBody}>
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  {entry.entry_date} — {entry.mood}
                </Text>
                {entry.note ? (
                  <Text
                    style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {entry.note}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
  },
  weekBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekEmoji: {
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  trendNumber: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  triggerBody: {
    flex: 1,
    gap: 6,
  },
  triggerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerBar: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  triggerFill: {
    height: '100%',
    borderRadius: 999,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  intensityBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalEmoji: {
    fontSize: 22,
  },
  listBody: {
    flex: 1,
    gap: 2,
  },
});

import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';

function formatDateTime(sqliteUtc) {
  const date = new Date(sqliteUtc.replace(' ', 'T') + 'Z');
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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

  return (
    <Screen scroll>
      <Text style={[theme.typography.title, { color: theme.colors.text, marginBottom: 16 }]}>
        Habits
      </Text>

      <View style={styles.actionRow}>
        <Button
          label="Log urge"
          variant="secondary"
          onPress={() => navigation.navigate('LogUrge')}
          style={styles.actionButton}
        />
        <Button
          label="Journal"
          variant="soft"
          onPress={() => navigation.navigate('JournalEntry')}
          style={styles.actionButton}
        />
      </View>

      {insights &&
      (insights.topEmotion || insights.topLocation || insights.topTimeOfDay) ? (
        <Card title="Your top triggers">
          {insights.topEmotion ? (
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Feeling: <Text style={{ fontWeight: '700' }}>{insights.topEmotion.value}</Text> (
              {insights.topEmotion.count}x)
            </Text>
          ) : null}
          {insights.topLocation ? (
            <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: 4 }]}>
              Place: <Text style={{ fontWeight: '700' }}>{insights.topLocation.value}</Text> (
              {insights.topLocation.count}x)
            </Text>
          ) : null}
          {insights.topTimeOfDay ? (
            <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: 4 }]}>
              Time: <Text style={{ fontWeight: '700' }}>{insights.topTimeOfDay.value}</Text> (
              {insights.topTimeOfDay.count}x)
            </Text>
          ) : null}
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 10 }]}>
            Knowing your patterns makes them easier to plan around.
          </Text>
        </Card>
      ) : null}

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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
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
  listBody: {
    flex: 1,
    gap: 2,
  },
});

import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/financeStore';

function dayLabel(dayKey) {
  const date = new Date(dayKey + 'T12:00:00');
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

export function FinanceScreen({ navigation }) {
  const theme = useTheme();
  const summary = useFinanceStore((state) => state.summary);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);
  const setSavingsGoal = useFinanceStore((state) => state.setSavingsGoal);
  const refresh = useFinanceStore((state) => state.refresh);

  const [goalDraft, setGoalDraft] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const goalProgress =
    savingsGoal && savingsGoal > 0 ? Math.min(1, Math.max(0, summary.moneyKept / savingsGoal)) : 0;

  const maxBar = Math.max(1, ...summary.weeklyNet.map((d) => Math.abs(d.net)));

  const saveGoal = async () => {
    const amount = Number(goalDraft);
    if (Number.isFinite(amount) && amount > 0) {
      await setSavingsGoal(amount);
      setEditingGoal(false);
      setGoalDraft('');
    }
  };

  return (
    <Screen scroll>
      <Text style={[theme.typography.title, { color: theme.colors.text, marginBottom: 16 }]}>
        Money
      </Text>

      <Card title="Money kept">
        <Text style={[theme.typography.display, { color: theme.colors.secondary }]}>
          ${summary.moneyKept.toFixed(2)}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
          ${summary.savedTotal.toFixed(2)} set aside · ${summary.slipTotal.toFixed(2)} slipped
        </Text>
        <Button
          label="Log money"
          variant="secondary"
          onPress={() => navigation.navigate('LogMoney')}
          style={styles.cardButton}
        />
      </Card>

      <Card title="Savings goal">
        {savingsGoal && !editingGoal ? (
          <View>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
              ${summary.moneyKept.toFixed(0)} of ${savingsGoal.toFixed(0)}
            </Text>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.pill },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.secondary,
                    borderRadius: theme.radii.pill,
                    width: `${goalProgress * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 8 }]}>
              {Math.round(goalProgress * 100)}% there
            </Text>
            <Button
              label="Change goal"
              variant="ghost"
              onPress={() => setEditingGoal(true)}
              style={styles.cardButton}
            />
          </View>
        ) : (
          <View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 10 }]}>
              What are you saving toward?
            </Text>
            <TextInput
              value={goalDraft}
              onChangeText={setGoalDraft}
              placeholder="Goal amount, e.g. 500"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              style={[
                styles.goalInput,
                theme.typography.body,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.md,
                  color: theme.colors.text,
                },
              ]}
            />
            <Button label="Set goal" onPress={saveGoal} style={styles.cardButton} />
            {editingGoal ? (
              <Button label="Cancel" variant="ghost" onPress={() => setEditingGoal(false)} />
            ) : null}
          </View>
        )}
      </Card>

      <Card title="Last 7 days (net saved)">
        {summary.weeklyNet.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            No logs this week yet.
          </Text>
        ) : (
          <View style={styles.chart}>
            {summary.weeklyNet.map((day) => (
              <View key={day.day} style={styles.chartColumn}>
                <View style={styles.chartBarArea}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${(Math.abs(day.net) / maxBar) * 100}%`,
                        backgroundColor:
                          day.net >= 0 ? theme.colors.secondary : theme.colors.danger,
                        borderRadius: theme.radii.sm,
                      },
                    ]}
                  />
                </View>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {dayLabel(day.day)}
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: day.net >= 0 ? theme.colors.secondary : theme.colors.danger },
                  ]}
                >
                  {day.net >= 0 ? '+' : '-'}${Math.abs(day.net).toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardButton: {
    marginTop: 14,
  },
  progressTrack: {
    height: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  goalInput: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartBarArea: {
    height: 100,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: 18,
    minHeight: 4,
  },
});

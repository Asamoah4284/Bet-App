import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/financeStore';

const EQUIVALENTS = [
  { unit: 'coffees', price: 5, icon: 'cafe-outline' },
  { unit: 'movie nights', price: 12, icon: 'film-outline' },
  { unit: 'weeks of groceries', price: 100, icon: 'cart-outline' },
];

function localDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildWeekBars(weeklyNet) {
  const byDay = new Map(weeklyNet.map((row) => [row.day, row.net]));
  const bars = [];
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = localDayKey(date);
    bars.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      net: byDay.get(key) ?? 0,
      isToday: offset === 0,
    });
  }
  return bars;
}

function monthTotals(logs) {
  const now = new Date();
  let saved = 0;
  let slipped = 0;
  for (const log of logs) {
    const t = new Date(log.created_at.replace(' ', 'T') + 'Z');
    if (t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth()) {
      if (log.kind === 'saved') saved += log.amount;
      else slipped += log.amount;
    }
  }
  return { saved, slipped };
}

function formatLogDate(sqliteUtc) {
  return new Date(sqliteUtc.replace(' ', 'T') + 'Z').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function FinanceScreen({ navigation }) {
  const theme = useTheme();
  const summary = useFinanceStore((state) => state.summary);
  const logs = useFinanceStore((state) => state.logs);
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

  const bars = buildWeekBars(summary.weeklyNet);
  const weekTotal = bars.reduce((sum, bar) => sum + bar.net, 0);
  const maxBar = Math.max(1, ...bars.map((bar) => Math.abs(bar.net)));
  const month = monthTotals(logs);
  const equivalents = EQUIVALENTS.map((item) => ({
    ...item,
    count: Math.floor(summary.moneyKept / item.price),
  })).filter((item) => item.count >= 1);

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
      <View style={styles.header}>
        <View>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>Money</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
            Every dollar kept is a win
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderRadius: theme.radii.lg }]}
      >
        <Text style={[theme.typography.caption, styles.heroLabel]}>MONEY KEPT</Text>
        <Text style={styles.heroAmount}>${summary.moneyKept.toFixed(2)}</Text>
        <View style={styles.heroChips}>
          <View style={styles.heroChip}>
            <Ionicons name="arrow-up-circle" size={15} color="#B8F1DE" />
            <Text style={[theme.typography.caption, styles.heroChipText]}>
              ${summary.savedTotal.toFixed(0)} set aside
            </Text>
          </View>
          <View style={styles.heroChip}>
            <Ionicons name="arrow-down-circle" size={15} color="#FFC2B0" />
            <Text style={[theme.typography.caption, styles.heroChipText]}>
              ${summary.slipTotal.toFixed(0)} slipped
            </Text>
          </View>
        </View>
        <Button
          label="Log money"
          icon="add-circle-outline"
          variant="secondary"
          onPress={() => navigation.navigate('LogMoney')}
          style={styles.heroButton}
        />
      </LinearGradient>

      {equivalents.length > 0 ? (
        <Card title="That's roughly...">
          <View style={styles.equivalentsRow}>
            {equivalents.map((item) => (
              <View key={item.unit} style={styles.equivalentItem}>
                <View
                  style={[
                    styles.equivalentIcon,
                    { backgroundColor: theme.colors.secondaryMuted, borderRadius: theme.radii.sm },
                  ]}
                >
                  <Ionicons name={item.icon} size={20} color={theme.colors.secondary} />
                </View>
                <Text style={[styles.equivalentCount, { color: theme.colors.text }]}>
                  {item.count}
                </Text>
                <Text
                  style={[theme.typography.caption, { color: theme.colors.textSecondary, textAlign: 'center' }]}
                >
                  {item.unit}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Money you kept instead of gambling - made tangible.
          </Text>
        </Card>
      ) : null}

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            theme.elevation.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.lg,
            },
          ]}
        >
          <Ionicons name="trending-up-outline" size={18} color={theme.colors.secondary} />
          <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
            ${month.saved.toFixed(0)}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            saved this month
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            theme.elevation.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.lg,
            },
          ]}
        >
          <Ionicons name="trending-down-outline" size={18} color={theme.colors.accent} />
          <Text style={[styles.statValue, { color: theme.colors.accent }]}>
            ${month.slipped.toFixed(0)}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            slipped this month
          </Text>
        </View>
      </View>

      <Card title="Savings goal">
        {savingsGoal && !editingGoal ? (
          <View>
            <View style={styles.goalHeader}>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
                ${summary.moneyKept.toFixed(0)} of ${savingsGoal.toFixed(0)}
              </Text>
              <Text style={[theme.typography.subtitle, { color: theme.colors.secondary }]}>
                {Math.round(goalProgress * 100)}%
              </Text>
            </View>
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
              {goalProgress >= 1
                ? 'Goal reached! Set a new one and keep going.'
                : `$${(savingsGoal - summary.moneyKept).toFixed(0)} to go`}
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

      <Card title="Last 7 days">
        <View style={styles.weekHeader}>
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>Net saved</Text>
          <Text
            style={[
              theme.typography.subtitle,
              { color: weekTotal >= 0 ? theme.colors.secondary : theme.colors.danger },
            ]}
          >
            {weekTotal >= 0 ? '+' : '-'}${Math.abs(weekTotal).toFixed(0)}
          </Text>
        </View>
        <View style={styles.chart}>
          {bars.map((bar) => (
            <View key={bar.key} style={styles.chartColumn}>
              <View style={styles.chartBarArea}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${Math.max(4, (Math.abs(bar.net) / maxBar) * 100)}%`,
                      backgroundColor:
                        bar.net > 0
                          ? theme.colors.secondary
                          : bar.net < 0
                            ? theme.colors.danger
                            : theme.colors.surfaceMuted,
                      borderRadius: theme.radii.sm,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: bar.isToday ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: bar.isToday ? '700' : '500',
                  },
                ]}
              >
                {bar.label}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card title="Recent activity">
        {logs.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Nothing logged yet. Money you would have gambled but kept? That counts.
          </Text>
        ) : (
          logs.slice(0, 8).map((log) => (
            <View key={log.id} style={[styles.logRow, { borderBottomColor: theme.colors.border }]}>
              <View
                style={[
                  styles.logIcon,
                  {
                    backgroundColor:
                      log.kind === 'saved' ? theme.colors.secondaryMuted : theme.colors.dangerMuted,
                    borderRadius: theme.radii.pill,
                  },
                ]}
              >
                <Ionicons
                  name={log.kind === 'saved' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={log.kind === 'saved' ? theme.colors.secondary : theme.colors.danger}
                />
              </View>
              <View style={styles.logBody}>
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  {log.kind === 'saved' ? 'Set aside' : 'Slipped'}
                </Text>
                {log.note ? (
                  <Text
                    style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {log.note}
                  </Text>
                ) : null}
              </View>
              <View style={styles.logRight}>
                <Text
                  style={[
                    theme.typography.subtitle,
                    { color: log.kind === 'saved' ? theme.colors.secondary : theme.colors.danger },
                  ]}
                >
                  {log.kind === 'saved' ? '+' : '-'}${log.amount.toFixed(2)}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {formatLogDate(log.created_at)}
                </Text>
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
  heroCard: {
    padding: 22,
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.2,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 52,
    color: '#FFFFFF',
    marginTop: 6,
  },
  heroChips: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroChipText: {
    color: '#FFFFFF',
  },
  heroButton: {
    marginTop: 16,
  },
  equivalentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  equivalentItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  equivalentIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equivalentCount: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
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
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    height: 90,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: 18,
    minHeight: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBody: {
    flex: 1,
    gap: 2,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
});

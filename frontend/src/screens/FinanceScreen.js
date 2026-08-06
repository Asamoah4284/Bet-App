import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/financeStore';

const EQUIVALENTS = [
  { unit: 'coffees', price: 5, icon: 'cafe-outline' },
  { unit: 'movie nights', price: 12, icon: 'film-outline' },
  { unit: 'grocery weeks', price: 100, icon: 'cart-outline' },
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

function SectionLabel({ children, right }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>{children}</Text>
      {right || null}
    </View>
  );
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
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: theme.colors.primary }]}>Money</Text>
        <Text style={[styles.headline, { color: theme.colors.text }]}>What you’ve kept</Text>
        <Text style={[styles.subhead, { color: theme.colors.textSecondary }]}>
          Track the dollars that stayed with you.
        </Text>
      </View>

      {/* Hero balance */}
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>Money kept</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log money"
            onPress={() => navigation.navigate('LogMoney')}
            style={({ pressed }) => [styles.heroAction, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.heroActionText}>Log</Text>
          </Pressable>
        </View>

        <Text style={styles.heroAmount}>${summary.moneyKept.toFixed(2)}</Text>

        <View style={styles.heroSplit}>
          <View style={styles.heroMetric}>
            <View style={[styles.heroMetricDot, { backgroundColor: theme.colors.secondary }]} />
            <View>
              <Text style={styles.heroMetricValue}>${summary.savedTotal.toFixed(0)}</Text>
              <Text style={styles.heroMetricLabel}>Set aside</Text>
            </View>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetric}>
            <View style={[styles.heroMetricDot, { backgroundColor: theme.colors.warning }]} />
            <View>
              <Text style={styles.heroMetricValue}>${summary.slipTotal.toFixed(0)}</Text>
              <Text style={styles.heroMetricLabel}>Slipped</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Month snapshot */}
      <View style={[styles.monthStrip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.monthCell}>
          <Text style={[styles.monthValue, { color: theme.colors.secondary }]}>
            ${month.saved.toFixed(0)}
          </Text>
          <Text style={[styles.monthLabel, { color: theme.colors.textSecondary }]}>
            Saved this month
          </Text>
        </View>
        <View style={[styles.monthDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.monthCell}>
          <Text style={[styles.monthValue, { color: theme.colors.danger }]}>
            ${month.slipped.toFixed(0)}
          </Text>
          <Text style={[styles.monthLabel, { color: theme.colors.textSecondary }]}>
            Slipped this month
          </Text>
        </View>
      </View>

      {/* Quick log tiles */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('LogMoney')}
          style={({ pressed }) => [
            styles.actionTile,
            {
              backgroundColor: theme.colors.secondary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-up-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.actionTitle}>Set aside</Text>
          <Text style={styles.actionMeta}>Money you didn’t gamble</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('LogMoney')}
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
          <Ionicons name="arrow-down-circle-outline" size={22} color={theme.colors.danger} />
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Log a slip</Text>
          <Text style={[styles.actionMeta, { color: theme.colors.textSecondary }]}>
            Honesty keeps you on track
          </Text>
        </Pressable>
      </View>

      {/* Savings goal */}
      <View style={styles.block}>
        <SectionLabel
          right={
            savingsGoal && !editingGoal ? (
              <Pressable onPress={() => setEditingGoal(true)} hitSlop={8}>
                <Text style={[styles.link, { color: theme.colors.primary }]}>Edit</Text>
              </Pressable>
            ) : null
          }
        >
          Savings goal
        </SectionLabel>
        <Panel>
          {savingsGoal && !editingGoal ? (
            <View>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalAmount, { color: theme.colors.text }]}>
                  ${summary.moneyKept.toFixed(0)}
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: '500' }}>
                    {' '}
                    of ${savingsGoal.toFixed(0)}
                  </Text>
                </Text>
                <View style={[styles.goalPctChip, { backgroundColor: theme.colors.secondaryMuted }]}>
                  <Text style={[styles.goalPct, { color: theme.colors.secondary }]}>
                    {Math.round(goalProgress * 100)}%
                  </Text>
                </View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.secondary,
                      width: `${goalProgress * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.goalFoot, { color: theme.colors.textSecondary }]}>
                {goalProgress >= 1
                  ? 'Goal reached. Set a new one and keep going.'
                  : `$${(savingsGoal - summary.moneyKept).toFixed(0)} left to go`}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[styles.goalPrompt, { color: theme.colors.textSecondary }]}>
                What are you saving toward?
              </Text>
              <TextInput
                value={goalDraft}
                onChangeText={setGoalDraft}
                placeholder="e.g. 500"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                style={[
                  styles.goalInput,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
              />
              <View style={styles.goalActions}>
                <Button label="Set goal" onPress={saveGoal} style={{ flex: 1 }} />
                {editingGoal ? (
                  <Button
                    label="Cancel"
                    variant="ghost"
                    onPress={() => setEditingGoal(false)}
                    style={{ flex: 1 }}
                  />
                ) : null}
              </View>
            </View>
          )}
        </Panel>
      </View>

      {/* Week chart */}
      <View style={styles.block}>
        <SectionLabel
          right={
            <Text
              style={[
                styles.weekTotal,
                { color: weekTotal >= 0 ? theme.colors.secondary : theme.colors.danger },
              ]}
            >
              {weekTotal >= 0 ? '+' : '-'}${Math.abs(weekTotal).toFixed(0)}
            </Text>
          }
        >
          Last 7 days
        </SectionLabel>
        <Panel>
          <Text style={[styles.chartCaption, { color: theme.colors.textSecondary }]}>
            Net kept each day
          </Text>
          <View style={styles.chart}>
            {bars.map((bar) => {
              const heightPct = Math.max(6, (Math.abs(bar.net) / maxBar) * 100);
              const color =
                bar.net > 0
                  ? theme.colors.secondary
                  : bar.net < 0
                    ? theme.colors.warning
                    : theme.colors.border;
              return (
                <View key={bar.key} style={styles.chartColumn}>
                  <View style={styles.chartBarArea}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: color,
                          opacity: bar.isToday ? 1 : 0.85,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.chartLabel,
                      {
                        color: bar.isToday ? theme.colors.primary : theme.colors.textSecondary,
                        fontWeight: bar.isToday ? '700' : '500',
                      },
                    ]}
                  >
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Panel>
      </View>

      {/* Equivalents */}
      {equivalents.length > 0 ? (
        <View style={styles.block}>
          <SectionLabel>In real terms</SectionLabel>
          <Panel style={styles.equivalentsPanel}>
            {equivalents.map((item, index) => (
              <View
                key={item.unit}
                style={[
                  styles.equivalentItem,
                  index < equivalents.length - 1 && {
                    borderRightWidth: StyleSheet.hairlineWidth,
                    borderRightColor: theme.colors.border,
                  },
                ]}
              >
                <View style={[styles.equivalentIcon, { backgroundColor: theme.colors.secondaryMuted }]}>
                  <Ionicons name={item.icon} size={18} color={theme.colors.secondary} />
                </View>
                <Text style={[styles.equivalentCount, { color: theme.colors.text }]}>
                  {item.count}
                </Text>
                <Text style={[styles.equivalentUnit, { color: theme.colors.textSecondary }]}>
                  {item.unit}
                </Text>
              </View>
            ))}
          </Panel>
        </View>
      ) : null}

      {/* Activity */}
      <View style={styles.block}>
        <SectionLabel
          right={
            <Text style={[styles.countPill, { color: theme.colors.textSecondary }]}>
              {logs.length}
            </Text>
          }
        >
          Recent activity
        </SectionLabel>
        <Panel style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
          {logs.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Nothing logged yet. Money you would have gambled but kept still counts.
            </Text>
          ) : (
            logs.slice(0, 8).map((log, index, list) => (
              <View
                key={log.id}
                style={[
                  styles.logRow,
                  index < list.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.logIcon,
                    {
                      backgroundColor:
                        log.kind === 'saved'
                          ? theme.colors.secondaryMuted
                          : theme.colors.warningMuted,
                    },
                  ]}
                >
                  <Ionicons
                    name={log.kind === 'saved' ? 'arrow-up' : 'arrow-down'}
                    size={15}
                    color={log.kind === 'saved' ? theme.colors.secondary : theme.colors.danger}
                  />
                </View>
                <View style={styles.logBody}>
                  <Text style={[styles.logTitle, { color: theme.colors.text }]}>
                    {log.kind === 'saved' ? 'Set aside' : 'Slipped'}
                  </Text>
                  {log.note ? (
                    <Text
                      style={[styles.logMeta, { color: theme.colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {log.note}
                    </Text>
                  ) : (
                    <Text style={[styles.logMeta, { color: theme.colors.textSecondary }]}>
                      {formatLogDate(log.created_at)}
                    </Text>
                  )}
                </View>
                <View style={styles.logRight}>
                  <Text
                    style={[
                      styles.logAmount,
                      {
                        color:
                          log.kind === 'saved' ? theme.colors.secondary : theme.colors.danger,
                      },
                    ]}
                  >
                    {log.kind === 'saved' ? '+' : '-'}${log.amount.toFixed(2)}
                  </Text>
                  {log.note ? (
                    <Text style={[styles.logMeta, { color: theme.colors.textSecondary }]}>
                      {formatLogDate(log.created_at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Panel>
      </View>

      <Button
        label="Log money"
        icon="wallet-outline"
        onPress={() => navigation.navigate('LogMoney')}
        style={styles.bottomCta}
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
  hero: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroAmount: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginBottom: 16,
  },
  heroSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  heroMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroMetricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroMetricDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  heroMetricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  heroMetricLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  monthStrip: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  monthCell: {
    flex: 1,
    alignItems: 'center',
  },
  monthDivider: {
    width: StyleSheet.hairlineWidth,
  },
  monthValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  monthLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  actionTile: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  actionMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '500',
  },
  block: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
  },
  countPill: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalPctChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  goalPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalFoot: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '500',
  },
  goalPrompt: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  goalInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  chartCaption: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartBarArea: {
    height: 88,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: 14,
    minHeight: 4,
    borderRadius: 7,
  },
  chartLabel: {
    fontSize: 11,
  },
  equivalentsPanel: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  equivalentItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  equivalentIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equivalentCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  equivalentUnit: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBody: {
    flex: 1,
    gap: 2,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  logMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  logAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '500',
  },
  bottomCta: {
    marginTop: 4,
    marginBottom: 8,
  },
});

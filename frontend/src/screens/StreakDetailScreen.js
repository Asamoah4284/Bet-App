import { StyleSheet, Text, View } from 'react-native';
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
          Your streak grows automatically every full day without a logged slip.
        </Text>
      </LinearGradient>

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
        Logging a slip resets the gambling-free streak. It never erases your achievements or the work
        that got you here.
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

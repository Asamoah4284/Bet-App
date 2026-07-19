import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { achievementSummary } from '../services/achievements';

export function AchievementsScreen() {
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

  return (
    <Screen scroll>
      <BackHeader title="Achievements" />
      <Text style={[theme.typography.body, styles.intro, { color: theme.colors.textSecondary }]}>
        {summary.unlocked.length} of {summary.all.length} unlocked. These are private to you.
      </Text>

      <View style={styles.grid}>
        {summary.all.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.card,
              theme.elevation.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: achievement.unlocked ? theme.colors.secondary : theme.colors.border,
                borderRadius: theme.radii.lg,
                opacity: achievement.unlocked ? 1 : 0.78,
              },
            ]}
          >
            <View
              style={[
                styles.icon,
                {
                  backgroundColor: achievement.unlocked
                    ? theme.colors.secondaryMuted
                    : theme.colors.surfaceMuted,
                  borderRadius: theme.radii.md,
                },
              ]}
            >
              <Ionicons
                name={achievement.unlocked ? achievement.icon : 'lock-closed-outline'}
                size={24}
                color={achievement.unlocked ? theme.colors.secondary : theme.colors.textSecondary}
              />
            </View>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
              {achievement.title}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {achievement.description}
            </Text>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceMuted }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: achievement.unlocked
                      ? theme.colors.secondary
                      : theme.colors.primary,
                    width: `${achievement.ratio * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {achievement.unlocked
                ? 'Unlocked'
                : `${Math.floor(achievement.current)} / ${achievement.target}`}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: -8,
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 210,
    borderWidth: 1,
    padding: 16,
    gap: 7,
  },
  icon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});

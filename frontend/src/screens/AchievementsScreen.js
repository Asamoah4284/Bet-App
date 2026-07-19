import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { ACHIEVEMENT_CATEGORIES, achievementSummary } from '../services/achievements';

function Medallion({ achievement, color, muted }) {
  const theme = useTheme();

  if (achievement.unlocked) {
    return (
      <View style={styles.medallionWrap}>
        <LinearGradient
          colors={theme.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.medallion}
        >
          <Ionicons name={achievement.icon.replace('-outline', '')} size={26} color="#FFFFFF" />
        </LinearGradient>
        <View style={[styles.seal, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.surface }]}>
          <Ionicons name="checkmark" size={11} color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.medallionWrap}>
      <View style={[styles.medallion, styles.medallionLocked, { backgroundColor: muted, borderColor: color }]}>
        <Ionicons name={achievement.icon} size={24} color={color} />
      </View>
      <View style={[styles.seal, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.surface }]}>
        <Ionicons name="lock-closed" size={10} color={theme.colors.textSecondary} />
      </View>
    </View>
  );
}

function AchievementCard({ achievement }) {
  const theme = useTheme();
  const category = ACHIEVEMENT_CATEGORIES[achievement.metric];
  const color = theme.colors[category.color];
  const muted = theme.colors[`${category.color}Muted`];

  return (
    <View
      style={[
        styles.card,
        theme.elevation.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: achievement.unlocked ? theme.colors.secondary : theme.colors.border,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <Medallion achievement={achievement} color={color} muted={muted} />
      <Text
        style={[
          theme.typography.subtitle,
          { color: achievement.unlocked ? theme.colors.text : theme.colors.textSecondary },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {achievement.title}
      </Text>
      <Text
        style={[theme.typography.caption, styles.description, { color: theme.colors.textSecondary }]}
        numberOfLines={2}
      >
        {achievement.description}
      </Text>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceMuted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: achievement.unlocked ? theme.colors.secondary : color,
              width: `${Math.max(achievement.ratio * 100, achievement.ratio > 0 ? 4 : 0)}%`,
            },
          ]}
        />
      </View>
      <Text
        style={[
          theme.typography.caption,
          {
            color: achievement.unlocked ? theme.colors.secondary : theme.colors.textSecondary,
            fontWeight: achievement.unlocked ? '700' : '400',
          },
        ]}
      >
        {achievement.unlocked
          ? 'Unlocked'
          : `${Math.floor(achievement.current)} / ${achievement.target}`}
      </Text>
    </View>
  );
}

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

  const overall = summary.unlocked.length / summary.all.length;
  const sections = Object.entries(ACHIEVEMENT_CATEGORIES)
    .map(([metric, category]) => ({
      metric,
      ...category,
      items: summary.all.filter((item) => item.metric === metric),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Screen scroll>
      <BackHeader title="Achievements" />

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderRadius: theme.radii.lg }]}
      >
        <View style={styles.heroBadge}>
          <Ionicons name="trophy" size={26} color="#FFD59E" />
        </View>
        <View style={styles.heroBody}>
          <Text style={[theme.typography.title, styles.white]}>
            {summary.unlocked.length} of {summary.all.length} unlocked
          </Text>
          <Text style={[theme.typography.caption, styles.heroCopy]}>
            Every one marks real work. They stay private to you.
          </Text>
          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${overall * 100}%` }]} />
          </View>
        </View>
      </LinearGradient>

      {summary.next ? (
        <View
          style={[
            styles.nextCard,
            { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.lg },
          ]}
        >
          <View
            style={[
              styles.nextIcon,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radii.pill },
            ]}
          >
            <Ionicons name={summary.next.icon} size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.nextBody}>
            <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '800' }]}>
              UP NEXT
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '700' }]}>
              {summary.next.title}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {Math.floor(summary.next.current)} of {summary.next.target} — {summary.next.description.toLowerCase()}
            </Text>
          </View>
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.metric}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: theme.colors[section.color] }]} />
            <Text style={[theme.typography.caption, styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              {section.label.toUpperCase()}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {section.items.filter((item) => item.unlocked).length}/{section.items.length}
            </Text>
          </View>
          <View style={styles.grid}>
            {section.items.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    marginBottom: 14,
  },
  heroBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    flex: 1,
  },
  white: {
    color: '#FFFFFF',
  },
  heroCopy: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
  },
  heroTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: 10,
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 6,
  },
  nextIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBody: {
    flex: 1,
    gap: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    flex: 1,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 196,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  medallionWrap: {
    width: 56,
    height: 56,
    marginBottom: 5,
  },
  medallion: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionLocked: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  seal: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    minHeight: 32,
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

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

export function HomeScreen({ navigation }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const streakDays = useHabitStore((state) => state.streakDays);
  const insights = useHabitStore((state) => state.insights);
  const todayEntry = useHabitStore((state) => state.todayEntry);
  const refreshHabits = useHabitStore((state) => state.refresh);
  const summary = useFinanceStore((state) => state.summary);
  const refreshFinance = useFinanceStore((state) => state.refresh);

  useFocusEffect(
    useCallback(() => {
      refreshHabits();
      refreshFinance();
    }, [refreshHabits, refreshFinance])
  );

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            One day at a time
          </Text>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>
            Hi, {user?.displayName || 'friend'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => navigation.navigate('Profile')}
          hitSlop={8}
        >
          <Ionicons name="person-circle-outline" size={34} color={theme.colors.primary} />
        </Pressable>
      </View>

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.streakCard, { borderRadius: theme.radii.lg }]}
      >
        <Text style={[theme.typography.caption, { color: theme.colors.textInverse, opacity: 0.85 }]}>
          Gambling-free streak
        </Text>
        <Text style={[styles.streakNumber, { color: theme.colors.textInverse }]}>
          {streakDays}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textInverse, opacity: 0.9 }]}>
          {streakDays === 1 ? 'day' : 'days'} of quiet momentum
        </Text>
      </LinearGradient>

      <Button
        label="I'm having an urge"
        variant="secondary"
        onPress={() => navigation.navigate('UrgeSOS')}
        style={styles.urgeButton}
      />

      <Card title="Money kept">
        <Text style={[theme.typography.display, { color: theme.colors.secondary }]}>
          ${summary.moneyKept.toFixed(2)}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
          Set aside instead of gambled. Tap the Money tab to log more.
        </Text>
      </Card>

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
            {insights.topEmotion
              ? ` Most common feeling: ${insights.topEmotion.value}.`
              : ''}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
            Logging urges is a win — it means you noticed instead of acted.
          </Text>
        </Card>
      ) : null}
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
  },
  streakCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
  },
  urgeButton: {
    marginBottom: 16,
  },
  cardButton: {
    marginTop: 14,
  },
});

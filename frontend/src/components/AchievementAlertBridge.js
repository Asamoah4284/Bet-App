import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { useToastStore } from '../store/toastStore';
import {
  consumeNewlyUnlockedAchievements,
  presentAchievementNotification,
} from '../services/achievementAlerts';
import { ACHIEVEMENT_CATEGORIES } from '../services/achievements';

/**
 * Watches local recovery stats and surfaces toast + OS notification
 * only when a new achievement is unlocked.
 */
export function AchievementAlertBridge() {
  const navigation = useNavigation();
  const showToast = useToastStore((state) => state.show);
  const streakDays = useHabitStore((state) => state.streakDays);
  const urges = useHabitStore((state) => state.urges);
  const journalEntries = useHabitStore((state) => state.journalEntries);
  const moneyKept = useFinanceStore((state) => state.summary.moneyKept);
  const habitLoading = useHabitStore((state) => state.loading);
  const financeLoading = useFinanceStore((state) => state.loading);
  const queued = useRef(Promise.resolve());

  useEffect(() => {
    if (habitLoading || financeLoading) return undefined;

    const stats = {
      streakDays,
      urgesLogged: urges.length,
      journalEntries: journalEntries.length,
      moneyKept,
    };

    let cancelled = false;
    queued.current = queued.current.then(async () => {
      const newly = await consumeNewlyUnlockedAchievements(stats);
      if (cancelled || newly.length === 0) return;

      for (const achievement of newly) {
        const category = ACHIEVEMENT_CATEGORIES[achievement.metric];
        showToast({
          title: 'Achievement unlocked',
          body: achievement.title,
          icon: achievement.icon,
          tint: category?.color || 'secondary',
          onPress: () => navigation.navigate('Achievements'),
        });
        await presentAchievementNotification(achievement);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    streakDays,
    urges.length,
    journalEntries.length,
    moneyKept,
    habitLoading,
    financeLoading,
    showToast,
    navigation,
  ]);

  return null;
}

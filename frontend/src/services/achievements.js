export const ACHIEVEMENTS = [
  {
    id: 'first-day',
    icon: 'sunny-outline',
    title: 'Fresh Start',
    description: 'Complete your first gambling-free day',
    metric: 'streakDays',
    target: 1,
  },
  {
    id: 'three-days',
    icon: 'leaf-outline',
    title: 'Finding Your Feet',
    description: 'Reach a 3-day gambling-free streak',
    metric: 'streakDays',
    target: 3,
  },
  {
    id: 'one-week',
    icon: 'flame-outline',
    title: 'One Week Strong',
    description: 'Reach a 7-day gambling-free streak',
    metric: 'streakDays',
    target: 7,
  },
  {
    id: 'one-month',
    icon: 'calendar-outline',
    title: 'Quiet Momentum',
    description: 'Reach a 30-day gambling-free streak',
    metric: 'streakDays',
    target: 30,
  },
  {
    id: 'ninety-days',
    icon: 'diamond-outline',
    title: 'New Chapter',
    description: 'Reach a 90-day gambling-free streak',
    metric: 'streakDays',
    target: 90,
  },
  {
    id: 'year',
    icon: 'trophy-outline',
    title: 'A Year Reclaimed',
    description: 'Reach a 365-day gambling-free streak',
    metric: 'streakDays',
    target: 365,
  },
  {
    id: 'first-journal',
    icon: 'book-outline',
    title: 'Honest Reflection',
    description: 'Write your first journal entry',
    metric: 'journalEntries',
    target: 1,
  },
  {
    id: 'journal-ten',
    icon: 'library-outline',
    title: 'Self Aware',
    description: 'Write 10 journal entries',
    metric: 'journalEntries',
    target: 10,
  },
  {
    id: 'urge-five',
    icon: 'pulse-outline',
    title: 'Notice, Don’t Act',
    description: 'Log 5 urges instead of acting on them',
    metric: 'urgesLogged',
    target: 5,
  },
  {
    id: 'saved-fifty',
    icon: 'cash-outline',
    title: 'Money Kept',
    description: 'Keep $50 away from gambling',
    metric: 'moneyKept',
    target: 50,
  },
  {
    id: 'saved-five-hundred',
    icon: 'wallet-outline',
    title: 'Future Fund',
    description: 'Keep $500 away from gambling',
    metric: 'moneyKept',
    target: 500,
  },
];

export function achievementProgress(achievement, stats) {
  const current = Math.max(0, Number(stats[achievement.metric]) || 0);
  return {
    current,
    ratio: Math.min(1, current / achievement.target),
    unlocked: current >= achievement.target,
  };
}

export function achievementSummary(stats) {
  const enriched = ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    ...achievementProgress(achievement, stats),
  }));
  const unlocked = enriched.filter((item) => item.unlocked);
  const next = enriched
    .filter((item) => !item.unlocked)
    .sort((a, b) => b.ratio - a.ratio || a.target - b.target)[0] || null;
  return { all: enriched, unlocked, next };
}

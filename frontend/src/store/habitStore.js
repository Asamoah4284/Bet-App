import { create } from 'zustand';
import {
  getStreakDays,
  getTodayJournalEntry,
  getUrgeInsights,
  insertUrge,
  listJournalEntries,
  listUrges,
  upsertJournalEntry,
} from '../services/localDb';

export const useHabitStore = create((set, get) => ({
  urges: [],
  journalEntries: [],
  todayEntry: null,
  insights: null,
  streakDays: 0,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const [urges, journalEntries, todayEntry, insights, streakDays] = await Promise.all([
        listUrges(),
        listJournalEntries(),
        getTodayJournalEntry(),
        getUrgeInsights(),
        getStreakDays(),
      ]);
      set({ urges, journalEntries, todayEntry, insights, streakDays, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  logUrge: async ({ intensity, emotion, location, note }) => {
    await insertUrge({ intensity, emotion, location, note });
    await get().refresh();
  },

  saveJournalEntry: async ({ mood, note }) => {
    await upsertJournalEntry({ mood, note });
    await get().refresh();
  },
}));

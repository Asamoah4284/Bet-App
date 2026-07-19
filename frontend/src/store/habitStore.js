import { create } from 'zustand';
import {
  getReflectionSummary,
  getTodayJournalEntry,
  getUrgeInsights,
  insertUrge,
  listJournalEntries,
  listUrges,
  upsertDailyReflection,
  upsertJournalEntry,
} from '../services/localDb';
import { reflectionDayKeys } from '../services/reflections';

const initialDays = reflectionDayKeys();

export const useHabitStore = create((set, get) => ({
  urges: [],
  journalEntries: [],
  todayEntry: null,
  insights: null,
  streakDays: 0,
  todayKey: initialDays.today,
  yesterdayKey: initialDays.yesterday,
  todayReflection: null,
  yesterdayReflection: null,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const [urges, journalEntries, todayEntry, insights, reflection] = await Promise.all([
        listUrges(),
        listJournalEntries(),
        getTodayJournalEntry(),
        getUrgeInsights(),
        getReflectionSummary(),
      ]);
      set({
        urges,
        journalEntries,
        todayEntry,
        insights,
        ...reflection,
        loading: false,
      });
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

  confirmReflection: async ({ dayKey, status }) => {
    await upsertDailyReflection({ dayKey, status });
    await get().refresh();
  },
}));

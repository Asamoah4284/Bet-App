import { create } from 'zustand';
import {
  getMoneySummary,
  getSetting,
  insertMoneyLog,
  listMoneyLogs,
  setSetting,
} from '../services/localDb';

export const useFinanceStore = create((set, get) => ({
  logs: [],
  summary: { savedTotal: 0, slipTotal: 0, moneyKept: 0, weeklyNet: [] },
  savingsGoal: null,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const [logs, summary, goalValue] = await Promise.all([
        listMoneyLogs(),
        getMoneySummary(),
        getSetting('savings_goal'),
      ]);
      set({
        logs,
        summary,
        savingsGoal: goalValue ? Number(goalValue) : null,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  logMoney: async ({ amount, kind, note }) => {
    await insertMoneyLog({ amount, kind, note });
    await get().refresh();
  },

  setSavingsGoal: async (amount) => {
    await setSetting('savings_goal', amount);
    await get().refresh();
  },
}));

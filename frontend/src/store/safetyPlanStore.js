import { create } from 'zustand';
import { getSetting, setSetting } from '../services/localDb';

export const DEFAULT_REASONS = [
  'I want peace of mind and control over my choices.',
  'The people I care about deserve the present version of me.',
  'Every urge I outlast makes the next one easier.',
];

export const DEFAULT_ACTIONS = [
  'Move away from the device or place where I could gamble.',
  'Drink water and take a five-minute walk.',
  'Message someone I trust and say I need company.',
];

export function parsePlanList(value, fallback) {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;

    const cleaned = parsed
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);

    return cleaned.length ? cleaned : fallback;
  } catch {
    return fallback;
  }
}

export const useSafetyPlanStore = create((set, get) => ({
  reasons: DEFAULT_REASONS,
  actions: DEFAULT_ACTIONS,
  hydrated: false,
  saving: false,

  hydrate: async () => {
    try {
      const [savedReasons, savedActions] = await Promise.all([
        getSetting('safety_reasons'),
        getSetting('safety_actions'),
      ]);

      set({
        reasons: parsePlanList(savedReasons, DEFAULT_REASONS),
        actions: parsePlanList(savedActions, DEFAULT_ACTIONS),
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  save: async ({ reasons, actions }) => {
    const cleanReasons = parsePlanList(JSON.stringify(reasons), DEFAULT_REASONS);
    const cleanActions = parsePlanList(JSON.stringify(actions), DEFAULT_ACTIONS);

    set({ saving: true });
    await Promise.all([
      setSetting('safety_reasons', JSON.stringify(cleanReasons)),
      setSetting('safety_actions', JSON.stringify(cleanActions)),
    ]);
    set({ reasons: cleanReasons, actions: cleanActions, saving: false });
  },

  ensureHydrated: async () => {
    if (!get().hydrated) {
      await get().hydrate();
    }
  },
}));

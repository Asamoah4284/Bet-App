import { create } from 'zustand';
import { subscriptionApi } from '../services/api';
import {
  EMPTY_SUBSCRIPTION,
  hasPremiumAccess,
  normalizeSubscription,
} from '../services/subscription';

export const useSubscriptionStore = create((set, get) => ({
  subscription: { ...EMPTY_SUBSCRIPTION },
  hydrated: false,
  loading: false,
  error: null,

  clear: () =>
    set({
      subscription: { ...EMPTY_SUBSCRIPTION },
      hydrated: true,
      loading: false,
      error: null,
    }),

  setFromUser: (user) => {
    const subscription = normalizeSubscription(user?.subscription);
    set({ subscription, hydrated: true, error: null });
    return subscription;
  },

  clearError: () => set({ error: null }),

  refresh: async (token) => {
    if (!token) {
      set({ subscription: { ...EMPTY_SUBSCRIPTION }, hydrated: true });
      return get().subscription;
    }

    set({ loading: true, error: null });
    try {
      const { subscription: raw } = await subscriptionApi.get(token);
      const subscription = normalizeSubscription(raw);
      set({ subscription, loading: false, hydrated: true, error: null });
      return subscription;
    } catch (error) {
      set({
        loading: false,
        hydrated: true,
        error: error.message || 'Unable to load subscription',
      });
      throw error;
    }
  },

  startTrial: async (token, plan = 'yearly') => {
    if (!token) {
      throw new Error('You need to be signed in');
    }

    set({ loading: true, error: null });
    try {
      const { subscription: raw } = await subscriptionApi.startTrial(token, plan);
      const subscription = normalizeSubscription(raw);
      set({ subscription, loading: false, error: null });
      return subscription;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Unable to start free trial',
      });
      throw error;
    }
  },

  initializePayment: async (token, plan) => {
    if (!token) {
      throw new Error('You need to be signed in');
    }

    set({ loading: true, error: null });
    try {
      const payload = await subscriptionApi.initializePayment(token, plan);
      set({ loading: false, error: null });
      return payload;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Unable to start payment',
      });
      throw error;
    }
  },

  confirmPayment: async (token, { plan, paymentReference }) => {
    if (!token) {
      throw new Error('You need to be signed in');
    }

    set({ loading: true, error: null });
    try {
      const { subscription: raw } = await subscriptionApi.confirmPayment(token, {
        plan,
        paymentReference,
      });
      const subscription = normalizeSubscription(raw);
      set({ subscription, loading: false, error: null });
      return subscription;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Unable to confirm payment',
      });
      throw error;
    }
  },
}));

export function selectIsPremium(state) {
  return hasPremiumAccess(state.subscription);
}

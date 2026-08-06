import { create } from 'zustand';
import { messagesApi } from '../services/api';
import { useAuthStore } from './authStore';

function token() {
  return useAuthStore.getState().token;
}

export const useMessageStore = create((set, get) => ({
  threads: {},
  loading: false,
  sending: false,
  error: null,

  clearError: () => set({ error: null }),

  clearThread: (userId) =>
    set((state) => {
      const next = { ...state.threads };
      delete next[userId];
      return { threads: next };
    }),

  fetchThread: async (userId) => {
    if (!token() || !userId) return [];
    set({ loading: true, error: null });
    try {
      const result = await messagesApi.thread(token(), userId);
      const messages = result.messages || [];
      set((state) => ({
        loading: false,
        threads: { ...state.threads, [userId]: messages },
      }));
      return messages;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  sendMessage: async (userId, body) => {
    const text = String(body || '').trim();
    if (!text) return null;
    set({ sending: true, error: null });
    try {
      const result = await messagesApi.send(token(), { toUserId: userId, body: text });
      const message = result.message;
      set((state) => {
        const existing = state.threads[userId] || [];
        const already = existing.some((item) => item.id === message.id);
        return {
          sending: false,
          threads: {
            ...state.threads,
            [userId]: already ? existing : [...existing, message],
          },
        };
      });
      return message;
    } catch (error) {
      set({ sending: false, error: error.message });
      throw error;
    }
  },

  // Quiet refresh for polling — does not flip the loading spinner.
  refreshThread: async (userId) => {
    if (!token() || !userId) return get().threads[userId] || [];
    try {
      const result = await messagesApi.thread(token(), userId);
      const messages = result.messages || [];
      set((state) => ({
        threads: { ...state.threads, [userId]: messages },
        error: null,
      }));
      return messages;
    } catch (error) {
      // Keep prior messages on poll failures.
      return get().threads[userId] || [];
    }
  },
}));

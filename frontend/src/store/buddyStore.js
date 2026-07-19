import { create } from 'zustand';
import { buddiesApi, checkinsApi } from '../services/api';
import { useAuthStore } from './authStore';

function token() {
  return useAuthStore.getState().token;
}

export const useBuddyStore = create((set, get) => ({
  buddies: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
  myCheckins: [],
  loading: false,
  searching: false,
  error: null,

  clearError: () => set({ error: null }),

  refresh: async () => {
    if (!token()) return;
    set({ loading: true, error: null });
    try {
      const [list, mine] = await Promise.all([
        buddiesApi.list(token()),
        checkinsApi.mine(token()),
      ]);
      set({
        buddies: list.buddies,
        incomingRequests: list.incomingRequests,
        outgoingRequests: list.outgoingRequests,
        myCheckins: mine.checkins,
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  sendRequest: async (buddyCode) => {
    set({ error: null });
    const result = await buddiesApi.sendRequest(token(), buddyCode);
    await get().refresh();
    set((state) => ({
      searchResults: state.searchResults.map((user) =>
        user.buddyCode === buddyCode ? { ...user, relationship: 'outgoing' } : user
      ),
    }));
    return result.message;
  },

  searchUsers: async (query) => {
    if (!query || query.trim().length < 2) {
      set({ searchResults: [], searching: false });
      return [];
    }
    set({ searching: true, error: null });
    try {
      const result = await buddiesApi.search(token(), query.trim());
      set({ searchResults: result.results, searching: false });
      return result.results;
    } catch (error) {
      set({ searchResults: [], searching: false, error: error.message });
      throw error;
    }
  },

  clearSearch: () => set({ searchResults: [], searching: false }),

  acceptRequest: async (linkId) => {
    set({ error: null });
    await buddiesApi.acceptRequest(token(), linkId);
    await get().refresh();
  },

  removeLink: async (linkId) => {
    set({ error: null });
    await buddiesApi.removeLink(token(), linkId);
    await get().refresh();
  },

  postCheckin: async ({ mood, urgeLevel, note, streakDays, moneySaved }) => {
    set({ error: null });
    await checkinsApi.create(token(), { mood, urgeLevel, note, streakDays, moneySaved });
    await get().refresh();
  },

  fetchBuddyCheckins: async (userId) => {
    return checkinsApi.forBuddy(token(), userId);
  },
}));

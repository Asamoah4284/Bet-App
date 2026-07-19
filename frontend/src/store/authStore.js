import { create } from 'zustand';
import { ApiError, authApi, profileApi } from '../services/api';
import { tokenStorage } from '../services/secureStorage';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  bootstrap: async () => {
    try {
      const token = await tokenStorage.read();
      if (!token) {
        set({ user: null, token: null, hydrated: true, error: null });
        return;
      }

      const { user } = await authApi.me(token);
      set({ user, token, hydrated: true, error: null });
    } catch (error) {
      await tokenStorage.clear();
      set({
        user: null,
        token: null,
        hydrated: true,
        error: error instanceof ApiError && error.status === 0 ? error.message : null,
      });
    }
  },

  signup: async ({ email, password, displayName, username }) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.signup({ email, password, displayName, username });
      await tokenStorage.save(token);
      set({ token, user, loading: false, error: null });
      return user;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Unable to create account',
      });
      throw error;
    }
  },

  login: async ({ identifier, password }) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.login({ identifier, password });
      await tokenStorage.save(token);
      set({ token, user, loading: false, error: null });
      return user;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Unable to sign in',
      });
      throw error;
    }
  },

  loginWithGoogle: async ({ idToken }) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.google({ idToken });
      await tokenStorage.save(token);
      set({ token, user, loading: false, error: null });
      return user;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Unable to sign in with Google',
      });
      throw error;
    }
  },

  resetPassword: async ({ email, code, newPassword }) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.resetPassword({ email, code, newPassword });
      await tokenStorage.save(token);
      set({ token, user, loading: false, error: null });
      return user;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Unable to reset password',
      });
      throw error;
    }
  },

  updateProfile: async (profile) => {
    const token = get().token;
    set({ loading: true, error: null });
    try {
      const { user } = await profileApi.update(token, profile);
      set({ user, loading: false, error: null });
      return user;
    } catch (error) {
      set({ loading: false, error: error.message || 'Unable to update profile' });
      throw error;
    }
  },

  refreshSession: async () => {
    const token = get().token;
    if (!token) {
      return null;
    }

    try {
      const { user } = await authApi.me(token);
      set({ user, error: null });
      return user;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        await get().logout();
      }
      throw error;
    }
  },

  logout: async () => {
    await tokenStorage.clear();
    set({ user: null, token: null, error: null, loading: false });
  },
}));

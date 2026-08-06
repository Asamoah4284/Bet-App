import { create } from 'zustand';
import { ApiError, authApi, profileApi } from '../services/api';
import { tokenStorage } from '../services/secureStorage';
import {
  registerPushDevice,
  unregisterPushDevice,
} from '../services/pushRegistration';

let onSessionChange = null;

/** Used by App bootstrap to re-hydrate reminders without a circular import. */
export function setAuthSessionListener(listener) {
  onSessionChange = typeof listener === 'function' ? listener : null;
}

function notifySessionChange() {
  if (onSessionChange) {
    Promise.resolve()
      .then(() => onSessionChange())
      .catch(() => {});
  }
}

async function afterAuthSuccess(set, token, user) {
  set({ token, user, loading: false, error: null });
  registerPushDevice(token).catch(() => {});
  notifySessionChange();
}

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
      registerPushDevice(token).catch(() => {});
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
      await afterAuthSuccess(set, token, user);
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
      await afterAuthSuccess(set, token, user);
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
      await afterAuthSuccess(set, token, user);
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
      await afterAuthSuccess(set, token, user);
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
    const token = get().token;
    await unregisterPushDevice(token).catch(() => {});
    await tokenStorage.clear();
    set({ user: null, token: null, error: null, loading: false });
    notifySessionChange();
  },
}));

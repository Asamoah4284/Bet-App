// Production backend on Render. Override for local development with:
//   $env:EXPO_PUBLIC_API_URL = "http://localhost:3000"   (or your LAN IP)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://bet-app-dgqz.onrender.com';

// Render free tier can take ~30–50s on a cold start after idle.
const DEFAULT_TIMEOUT_MS = 45000;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function mapApiError(payload, status) {
  if (typeof payload?.error === 'string' && payload.error.trim()) {
    return new ApiError(payload.error, status, payload);
  }

  if (status === 401) {
    return new ApiError('Invalid or expired session', status, payload);
  }

  if (status >= 500) {
    return new ApiError('Something went wrong on the server', status, payload);
  }

  return new ApiError('Request failed', status, payload);
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function apiRequest(path, { method = 'GET', body, token, timeoutMs } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const payload = await parseJsonSafe(response);

    if (!response.ok) {
      throw mapApiError(payload, response.status);
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Check that the backend is running.', 0);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      `Unable to reach the server at ${API_BASE_URL}. Is the backend running?`,
      0,
      error
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const authApi = {
  signup: ({ email, password, displayName, username }) =>
    apiRequest('/api/auth/signup', {
      method: 'POST',
      body: { email, password, displayName, username },
    }),
  login: ({ identifier, password }) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier, password },
    }),
  google: ({ idToken }) =>
    apiRequest('/api/auth/google', {
      method: 'POST',
      body: { idToken },
    }),
  forgotPassword: ({ email }) =>
    apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  resetPassword: ({ email, code, newPassword }) =>
    apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword },
    }),
  me: (token) => apiRequest('/api/auth/me', { token }),
};

export const buddiesApi = {
  list: (token) => apiRequest('/api/buddies', { token }),
  search: (token, query) =>
    apiRequest(`/api/buddies/search?q=${encodeURIComponent(query)}`, { token }),
  sendRequest: (token, buddyCode) =>
    apiRequest('/api/buddies/request', {
      method: 'POST',
      body: { buddyCode },
      token,
    }),
  acceptRequest: (token, linkId) =>
    apiRequest(`/api/buddies/${linkId}/accept`, { method: 'POST', token }),
  removeLink: (token, linkId) =>
    apiRequest(`/api/buddies/${linkId}`, { method: 'DELETE', token }),
};

export const checkinsApi = {
  create: (token, { mood, urgeLevel, note, streakDays, moneySaved }) =>
    apiRequest('/api/checkins', {
      method: 'POST',
      body: { mood, urgeLevel, note, streakDays, moneySaved },
      token,
    }),
  mine: (token) => apiRequest('/api/checkins', { token }),
  forBuddy: (token, userId) => apiRequest(`/api/checkins/buddy/${userId}`, { token }),
};

export const profileApi = {
  update: (token, profile) =>
    apiRequest('/api/profile/me', { method: 'PUT', body: profile, token }),
  syncStats: (token, stats) =>
    apiRequest('/api/profile/sync-stats', { method: 'POST', body: stats, token }),
  shared: (buddyCode) => apiRequest(`/api/profile/share/${encodeURIComponent(buddyCode)}`),
  leaderboard: (token, scope = 'global') =>
    apiRequest(`/api/profile/leaderboard?scope=${encodeURIComponent(scope)}`, { token }),
};

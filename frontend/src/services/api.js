import { Platform } from 'react-native';

const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// Physical devices cannot reach the host machine via localhost.
// Set EXPO_PUBLIC_API_URL to your computer's LAN IP, e.g. http://192.168.1.20:3000
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:3000`;

const DEFAULT_TIMEOUT_MS = 12000;

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
  signup: ({ email, password, displayName }) =>
    apiRequest('/api/auth/signup', {
      method: 'POST',
      body: { email, password, displayName },
    }),
  login: ({ email, password }) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  me: (token) => apiRequest('/api/auth/me', { token }),
};

export const buddiesApi = {
  list: (token) => apiRequest('/api/buddies', { token }),
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

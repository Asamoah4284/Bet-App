import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { tokenStorage } from '../services/secureStorage';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    authApi: {
      signup: jest.fn(),
      login: jest.fn(),
      google: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      me: jest.fn(),
    },
  };
});

jest.mock('../services/secureStorage', () => ({
  tokenStorage: {
    save: jest.fn(),
    read: jest.fn(),
    clear: jest.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      hydrated: false,
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('bootstraps a valid session from storage', async () => {
    tokenStorage.read.mockResolvedValue('token-123');
    authApi.me.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@test.com',
        displayName: 'Alice',
        buddyCode: 'ABC123',
      },
    });

    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.token).toBe('token-123');
    expect(state.user.displayName).toBe('Alice');
  });

  it('clears invalid sessions during bootstrap', async () => {
    tokenStorage.read.mockResolvedValue('stale-token');
    authApi.me.mockRejectedValue(new Error('Unauthorized'));

    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.hydrated).toBe(true);
  });

  it('stores token and user after login', async () => {
    authApi.login.mockResolvedValue({
      token: 'fresh-token',
      user: {
        id: '2',
        email: 'b@test.com',
        displayName: 'Bob',
        buddyCode: 'XYZ789',
      },
    });

    await useAuthStore.getState().login({ identifier: 'b@test.com', password: 'secret1' });

    const state = useAuthStore.getState();
    expect(authApi.login).toHaveBeenCalledWith({ identifier: 'b@test.com', password: 'secret1' });
    expect(tokenStorage.save).toHaveBeenCalledWith('fresh-token');
    expect(state.user.buddyCode).toBe('XYZ789');
    expect(state.loading).toBe(false);
  });

  it('stores token and user after Google sign-in', async () => {
    authApi.google.mockResolvedValue({
      token: 'google-token',
      user: {
        id: '3',
        email: 'c@test.com',
        displayName: 'Cara',
        buddyCode: 'QRS456',
      },
    });

    await useAuthStore.getState().loginWithGoogle({ idToken: 'google-id-token' });

    const state = useAuthStore.getState();
    expect(authApi.google).toHaveBeenCalledWith({ idToken: 'google-id-token' });
    expect(tokenStorage.save).toHaveBeenCalledWith('google-token');
    expect(state.user.displayName).toBe('Cara');
  });

  it('signs the user in after a successful password reset', async () => {
    authApi.resetPassword.mockResolvedValue({
      token: 'reset-token',
      user: {
        id: '4',
        email: 'd@test.com',
        displayName: 'Dan',
        buddyCode: 'TUV789',
      },
    });

    await useAuthStore.getState().resetPassword({
      email: 'd@test.com',
      code: '123456',
      newPassword: 'newpass1',
    });

    const state = useAuthStore.getState();
    expect(tokenStorage.save).toHaveBeenCalledWith('reset-token');
    expect(state.user.displayName).toBe('Dan');
  });
});

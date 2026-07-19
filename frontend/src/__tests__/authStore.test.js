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

    await useAuthStore.getState().login({ email: 'b@test.com', password: 'secret1' });

    const state = useAuthStore.getState();
    expect(tokenStorage.save).toHaveBeenCalledWith('fresh-token');
    expect(state.user.buddyCode).toBe('XYZ789');
    expect(state.loading).toBe(false);
  });
});

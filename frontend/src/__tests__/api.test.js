import { ApiError, mapApiError } from '../services/api';

describe('mapApiError', () => {
  it('prefers backend error messages', () => {
    const error = mapApiError({ error: 'Invalid email or password' }, 401);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Invalid email or password');
    expect(error.status).toBe(401);
  });

  it('falls back for server failures', () => {
    const error = mapApiError({}, 500);
    expect(error.message).toBe('Something went wrong on the server');
  });
});

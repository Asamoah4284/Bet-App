import {
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '../utils/validation';

describe('validation', () => {
  it('validates email addresses', () => {
    expect(validateEmail('')).toBeTruthy();
    expect(validateEmail('not-an-email')).toBeTruthy();
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('validates passwords against backend rules', () => {
    expect(validatePassword('123')).toBeTruthy();
    expect(validatePassword('secret1')).toBeNull();
  });

  it('validates display names', () => {
    expect(validateDisplayName(' ')).toBeTruthy();
    expect(validateDisplayName('A')).toBeTruthy();
    expect(validateDisplayName('Alex')).toBeNull();
  });
});

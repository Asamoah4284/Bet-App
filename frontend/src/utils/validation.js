export function validateEmail(email) {
  const value = String(email || '').trim();
  if (!value) {
    return 'Email is required';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    return 'Enter a valid email address';
  }

  return null;
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
}

export function validateDisplayName(displayName) {
  const value = String(displayName || '').trim();
  if (!value) {
    return 'Display name is required';
  }

  if (value.length < 2) {
    return 'Display name must be at least 2 characters';
  }

  return null;
}

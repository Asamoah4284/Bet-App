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

export function validateIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (!value) {
    return 'Email or username is required';
  }

  if (value.includes('@')) {
    return validateEmail(value);
  }

  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(value)) {
    return 'Enter a valid email or username';
  }

  return null;
}

export function validateUsername(username, { optional = true } = {}) {
  const value = String(username || '').trim();
  if (!value) {
    return optional ? null : 'Username is required';
  }

  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(value)) {
    return '3-20 characters: letters, numbers, dots or underscores';
  }

  return null;
}

export function validateResetCode(code) {
  const value = String(code || '').trim();
  if (!value) {
    return 'Reset code is required';
  }

  if (!/^\d{6}$/.test(value)) {
    return 'The reset code is 6 digits';
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

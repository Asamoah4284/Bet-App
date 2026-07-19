import { createTheme, resolveColorScheme } from '../theme/resolveTheme';

describe('resolveColorScheme', () => {
  it('respects explicit light and dark preferences', () => {
    expect(resolveColorScheme('light', 'dark')).toBe('light');
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
  });

  it('falls back to the system scheme', () => {
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
    expect(resolveColorScheme('system', 'light')).toBe('light');
    expect(resolveColorScheme('system', null)).toBe('light');
  });
});

describe('createTheme', () => {
  it('returns semantic tokens for both modes', () => {
    const light = createTheme('light');
    const dark = createTheme('dark');

    expect(light.mode).toBe('light');
    expect(dark.mode).toBe('dark');
    expect(light.colors.background).not.toBe(dark.colors.background);
    expect(light.spacing.md).toBe(16);
    expect(dark.radii.md).toBe(16);
  });
});

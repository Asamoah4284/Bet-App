import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export function createNavigationTheme(theme) {
  const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      // Match canvas so push/pop never flashes a flat white card behind content.
      card: theme.colors.background,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };
}

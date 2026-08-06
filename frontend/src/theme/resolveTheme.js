import { darkColors, lightColors } from './colors';
import { elevation, fonts, radii, spacing, typography } from './tokens';

export function resolveColorScheme(preference, systemScheme) {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }

  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function createTheme(colorScheme) {
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const isDark = colorScheme === 'dark';

  return {
    mode: colorScheme,
    colors,
    spacing,
    radii,
    fonts,
    typography,
    // Shadows disappear on dark canvases — rely on borders; keep light elevation as-is.
    elevation: isDark
      ? {
          card: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
          },
        }
      : elevation,
  };
}

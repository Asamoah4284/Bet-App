import { darkColors, lightColors } from './colors';
import { elevation, radii, spacing, typography } from './tokens';

export function resolveColorScheme(preference, systemScheme) {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }

  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function createTheme(colorScheme) {
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return {
    mode: colorScheme,
    colors,
    spacing,
    radii,
    typography,
    elevation,
  };
}

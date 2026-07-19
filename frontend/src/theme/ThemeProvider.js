import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { createTheme, resolveColorScheme } from './resolveTheme';

const ThemeContext = createContext(createTheme('light'));

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);

  const theme = useMemo(() => {
    const scheme = resolveColorScheme(preference, systemScheme);
    return createTheme(scheme);
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

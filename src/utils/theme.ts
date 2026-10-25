import { useState, useEffect } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'correlation_atlas_theme';

export function getSystemIsDark(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialThemeMode);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const initialMode = getInitialThemeMode();
    if (initialMode === 'dark') return true;
    if (initialMode === 'light') return false;
    return getSystemIsDark();
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);

    let resolvedDark = false;
    if (mode === 'dark') {
      resolvedDark = true;
    } else if (mode === 'light') {
      resolvedDark = false;
    } else {
      resolvedDark = getSystemIsDark();
    }

    setIsDark(resolvedDark);
    if (resolvedDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Initial sync
    let resolvedDark = false;
    if (theme === 'dark') {
      resolvedDark = true;
    } else if (theme === 'light') {
      resolvedDark = false;
    } else {
      resolvedDark = getSystemIsDark();
    }
    setIsDark(resolvedDark);
    if (resolvedDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listener for OS change when mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!currentStored || currentStored === 'system') {
        setIsDark(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme, isDark };
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageGet, storageSet } from '../services/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedDark: boolean;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedDark, setResolvedDark] = useState(false);

  useEffect(() => {
    storageGet('themePreference').then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') setThemeState(value);
    });
  }, []);

  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
    setResolvedDark(dark);
    document.documentElement.classList.toggle('dark', dark);

    if (theme !== 'system' || typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setResolvedDark(mq.matches);
      document.documentElement.classList.toggle('dark', mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    storageSet('themePreference', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

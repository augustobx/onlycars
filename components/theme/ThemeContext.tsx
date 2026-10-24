'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ERPTheme = '1' | '2';

interface ERPThemeContextType {
  theme: ERPTheme;
  setTheme: (theme: ERPTheme) => void;
  toggleERPTheme: () => void;
}

const ERPThemeContext = createContext<ERPThemeContextType>({
  theme: '1',
  setTheme: () => {},
  toggleERPTheme: () => {},
});

export const useERPTheme = () => useContext(ERPThemeContext);

export function ERPThemeProvider({
  initialTheme = '1',
  children,
}: {
  initialTheme?: ERPTheme;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<ERPTheme>(initialTheme);

  useEffect(() => {
    // 1. Check URL query param ?theme=2 or ?theme=1
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTheme = searchParams.get('theme');
      if (urlTheme === '1' || urlTheme === '2') {
        setThemeState(urlTheme);
        document.cookie = `onlycars_theme=${urlTheme}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('onlycars_theme', urlTheme);
        return;
      }

      // 2. Fallback to localStorage
      const saved = localStorage.getItem('onlycars_theme');
      if (saved === '1' || saved === '2') {
        setThemeState(saved);
        document.cookie = `onlycars_theme=${saved}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, []);

  const setTheme = (newTheme: ERPTheme) => {
    setThemeState(newTheme);
    if (typeof document !== 'undefined') {
      document.cookie = `onlycars_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem('onlycars_theme', newTheme);
    }
  };

  const toggleERPTheme = () => {
    setTheme(theme === '1' ? '2' : '1');
  };

  return (
    <ERPThemeContext.Provider value={{ theme, setTheme, toggleERPTheme }}>
      {children}
    </ERPThemeContext.Provider>
  );
}

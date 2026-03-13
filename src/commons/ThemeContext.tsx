import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { type EditorTheme, THEMES } from './theme';

interface ThemeContextValue {
  theme: EditorTheme;
  setTheme: (theme: EditorTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'editor-theme';

function applyTheme(theme: EditorTheme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  const tokens = THEMES[theme];
  root.style.setProperty('--color-bg', tokens.colorBg);
  root.style.setProperty('--color-surface', tokens.colorSurface);
  root.style.setProperty('--color-surface-alt', tokens.colorSurfaceAlt);
  root.style.setProperty('--color-border', tokens.colorBorder);
  root.style.setProperty('--color-border-subtle', tokens.colorBorderSubtle);
  root.style.setProperty('--color-text', tokens.colorText);
  root.style.setProperty('--color-text-secondary', tokens.colorTextSecondary);
  root.style.setProperty('--color-text-muted', tokens.colorTextMuted);
  root.style.setProperty('--color-primary', tokens.colorPrimary);
  root.style.setProperty('--color-primary-hover', tokens.colorPrimaryHover);
  root.style.setProperty('--color-primary-light', tokens.colorPrimaryLight);
  root.style.setProperty('--color-primary-border', tokens.colorPrimaryBorder);
  root.style.setProperty('--color-danger', tokens.colorDanger);
  root.style.setProperty('--color-danger-light', tokens.colorDangerLight);
  root.style.setProperty('--color-danger-border', tokens.colorDangerBorder);
  root.style.setProperty('--color-success', tokens.colorSuccess);
  root.style.setProperty('--color-success-light', tokens.colorSuccessLight);
  root.style.setProperty('--color-warning', tokens.colorWarning);
  root.style.setProperty('--color-warning-light', tokens.colorWarningLight);
  root.style.setProperty('--shadow-sm', tokens.shadowSm);
  root.style.setProperty('--shadow-md', tokens.shadowMd);
  root.style.setProperty('--shadow-lg', tokens.shadowLg);
  root.style.setProperty('--shadow-xl', tokens.shadowXl);
  root.style.setProperty('--shadow-depth', tokens.shadowDepth);
  root.style.setProperty('--shadow-elevated', tokens.shadowElevated);
  root.style.setProperty('--canvas-dot-color', tokens.canvasDotColor);
  root.style.setProperty('--canvas-dot-opacity', tokens.canvasDotOpacity);
  root.style.setProperty('--toolbar-bg', tokens.toolbarBg);
  root.style.setProperty('--toolbar-border', tokens.toolbarBorder);
  root.style.setProperty('--toolbar-text', tokens.toolbarText);
  root.style.setProperty('--panel-bg', tokens.panelBg);
  root.style.setProperty('--panel-border', tokens.panelBorder);
  root.style.setProperty('--scroll-thumb', tokens.scrollThumb);
  root.style.setProperty('--scroll-thumb-hover', tokens.scrollThumbHover);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<EditorTheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'light' || stored === 'dark') ? stored : 'light';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: EditorTheme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export type EditorTheme = 'light' | 'dark';

export interface ThemeTokens {
  colorBg: string;
  colorSurface: string;
  colorSurfaceAlt: string;
  colorBorder: string;
  colorBorderSubtle: string;
  colorText: string;
  colorTextSecondary: string;
  colorTextMuted: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryLight: string;
  colorPrimaryBorder: string;
  colorDanger: string;
  colorDangerLight: string;
  colorDangerBorder: string;
  colorSuccess: string;
  colorSuccessLight: string;
  colorWarning: string;
  colorWarningLight: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadowDepth: string;
  shadowElevated: string;
  canvasDotColor: string;
  canvasDotOpacity: string;
  toolbarBg: string;
  toolbarBorder: string;
  toolbarText: string;
  panelBg: string;
  panelBorder: string;
  scrollThumb: string;
  scrollThumbHover: string;
}

export const THEMES: Record<EditorTheme, ThemeTokens> = {
  light: {
    colorBg: '#f0f2f5',
    colorSurface: '#ffffff',
    colorSurfaceAlt: '#f8fafc',
    colorBorder: '#e2e8f0',
    colorBorderSubtle: '#f1f5f9',
    colorText: '#0f172a',
    colorTextSecondary: '#475569',
    colorTextMuted: '#94a3b8',
    colorPrimary: '#3b82f6',
    colorPrimaryHover: '#2563eb',
    colorPrimaryLight: '#eff6ff',
    colorPrimaryBorder: '#bfdbfe',
    colorDanger: '#ef4444',
    colorDangerLight: '#fef2f2',
    colorDangerBorder: '#fecaca',
    colorSuccess: '#10b981',
    colorSuccessLight: '#ecfdf5',
    colorWarning: '#f59e0b',
    colorWarningLight: '#fffbeb',
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.06)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.08)',
    shadowXl: '0 12px 40px rgba(0, 0, 0, 0.12)',
    shadowDepth: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.04)',
    shadowElevated: '0 4px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.1), 0 32px 64px rgba(0,0,0,0.06)',
    canvasDotColor: '#c8cdd3',
    canvasDotOpacity: '0.7',
    toolbarBg: 'rgba(15, 23, 42, 0.95)',
    toolbarBorder: 'rgba(255, 255, 255, 0.1)',
    toolbarText: '#ffffff',
    panelBg: 'rgba(255, 255, 255, 0.88)',
    panelBorder: 'rgba(226, 232, 240, 0.5)',
    scrollThumb: 'rgba(148, 163, 184, 0.4)',
    scrollThumbHover: 'rgba(148, 163, 184, 0.6)',
  },
  dark: {
    colorBg: '#0a0a0a',
    colorSurface: '#141414',
    colorSurfaceAlt: '#1a1a1a',
    colorBorder: '#2a2a2a',
    colorBorderSubtle: '#1e1e1e',
    colorText: '#f0f0f0',
    colorTextSecondary: '#a0a0a0',
    colorTextMuted: '#666666',
    colorPrimary: '#ffffff',
    colorPrimaryHover: '#e0e0e0',
    colorPrimaryLight: 'rgba(255, 255, 255, 0.06)',
    colorPrimaryBorder: 'rgba(255, 255, 255, 0.15)',
    colorDanger: '#ff6b6b',
    colorDangerLight: 'rgba(255, 107, 107, 0.08)',
    colorDangerBorder: 'rgba(255, 107, 107, 0.2)',
    colorSuccess: '#4ade80',
    colorSuccessLight: 'rgba(74, 222, 128, 0.08)',
    colorWarning: '#fbbf24',
    colorWarningLight: 'rgba(251, 191, 36, 0.08)',
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    shadowXl: '0 12px 40px rgba(0, 0, 0, 0.6)',
    shadowDepth: '0 2px 4px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.4), 0 24px 48px rgba(0,0,0,0.2)',
    shadowElevated: '0 4px 8px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.5), 0 32px 64px rgba(0,0,0,0.3)',
    canvasDotColor: '#333333',
    canvasDotOpacity: '0.5',
    toolbarBg: 'rgba(20, 20, 20, 0.95)',
    toolbarBorder: 'rgba(255, 255, 255, 0.06)',
    toolbarText: '#f0f0f0',
    panelBg: 'rgba(20, 20, 20, 0.92)',
    panelBorder: 'rgba(255, 255, 255, 0.06)',
    scrollThumb: 'rgba(255, 255, 255, 0.15)',
    scrollThumbHover: 'rgba(255, 255, 255, 0.25)',
  },
};

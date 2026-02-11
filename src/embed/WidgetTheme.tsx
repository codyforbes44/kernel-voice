import React, { createContext, useContext, useMemo } from 'react';
import { KernelWidgetConfig, WidgetThemeValues, DEFAULT_CONFIG, getBorderRadiusValue, getBubbleRadiusValue } from './types';

interface WidgetThemeContextValue {
  config: KernelWidgetConfig;
  theme: WidgetThemeValues;
}

const WidgetThemeContext = createContext<WidgetThemeContextValue | null>(null);

export function useWidgetTheme() {
  const context = useContext(WidgetThemeContext);
  if (!context) {
    throw new Error('useWidgetTheme must be used within WidgetThemeProvider');
  }
  return context;
}

interface WidgetThemeProviderProps {
  config: KernelWidgetConfig;
  children: React.ReactNode;
}

export function WidgetThemeProvider({ config, children }: WidgetThemeProviderProps) {
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  const isDark = mergedConfig.darkMode || false;

  const theme: WidgetThemeValues = useMemo(() => ({
    primaryColor: mergedConfig.brandColor || '#00CED1',
    accentColor: mergedConfig.accentColor || '#00B4D8',
    textColor: isDark ? '#f0f0f0' : (mergedConfig.textColor || '#1a1a1a'),
    backgroundColor: isDark ? '#1a1a2e' : (mergedConfig.backgroundColor || '#ffffff'),
    borderRadius: getBorderRadiusValue(mergedConfig.borderRadius),
    bubbleRadius: getBubbleRadiusValue(mergedConfig.bubbleStyle),
    isDark,
  }), [mergedConfig, isDark]);

  // Inject CSS variables
  const cssVariables = useMemo(() => ({
    '--kernel-primary': theme.primaryColor,
    '--kernel-accent': theme.accentColor,
    '--kernel-text': theme.textColor,
    '--kernel-bg': theme.backgroundColor,
    '--kernel-radius': theme.borderRadius,
    '--kernel-bubble-radius': theme.bubbleRadius,
    '--kernel-shadow': isDark
      ? '0 10px 40px rgba(0, 0, 0, 0.4)'
      : '0 10px 40px rgba(0, 0, 0, 0.15)',
    '--kernel-surface': isDark ? '#252540' : '#f0f0f0',
    '--kernel-border': isDark ? '#333355' : '#e5e5e5',
    '--kernel-input-bg': isDark ? '#1e1e36' : '#fafafa',
  }), [theme, isDark]);

  return (
    <WidgetThemeContext.Provider value={{ config: mergedConfig as KernelWidgetConfig, theme }}>
      <div style={cssVariables as React.CSSProperties}>
        {children}
      </div>
    </WidgetThemeContext.Provider>
  );
}

import React, { createContext, useContext, useMemo } from 'react';
import { KernelWidgetConfig, WidgetThemeValues, DEFAULT_CONFIG } from './types';

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

  const theme: WidgetThemeValues = useMemo(() => ({
    primaryColor: mergedConfig.brandColor || '#00CED1',
    accentColor: mergedConfig.accentColor || '#00B4D8',
    textColor: mergedConfig.textColor || '#1a1a1a',
    backgroundColor: mergedConfig.backgroundColor || '#ffffff',
    borderRadius: '12px',
  }), [mergedConfig]);

  // Inject CSS variables
  const cssVariables = useMemo(() => ({
    '--kernel-primary': theme.primaryColor,
    '--kernel-accent': theme.accentColor,
    '--kernel-text': theme.textColor,
    '--kernel-bg': theme.backgroundColor,
    '--kernel-radius': theme.borderRadius,
    '--kernel-shadow': '0 10px 40px rgba(0, 0, 0, 0.15)',
  }), [theme]);

  return (
    <WidgetThemeContext.Provider value={{ config: mergedConfig as KernelWidgetConfig, theme }}>
      <div style={cssVariables as React.CSSProperties}>
        {children}
      </div>
    </WidgetThemeContext.Provider>
  );
}

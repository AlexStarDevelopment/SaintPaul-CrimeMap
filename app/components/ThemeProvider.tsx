'use client';
import { ThemeProvider as MUIThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';

/**
 * Single dark slate theme configuration
 * Professional dark theme with neutral gray tones
 */
export const themeConfig = {
  name: 'Dark Slate',
  primary: '#78909c',
  secondary: '#90a4ae',
  palette: {
    mode: 'dark' as const,
    primary: {
      main: '#78909c',
      light: '#90a4ae',
      dark: '#455a64',
    },
    secondary: {
      main: '#90a4ae',
      light: '#b0bec5',
      dark: '#546e7a',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
};

/**
 * Type definitions for theme context - simplified for single theme
 */
export interface ThemeContextType {
  muiTheme: Theme;
  isHydrated: boolean;
}

/**
 * React Context for theme management
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props interface for ThemeProvider component
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider component with fixed dark slate theme
 * Provides Material-UI integration with no theme switching
 *
 * @param children - React child components to wrap with theme context
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration effect to prevent SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Create Material-UI theme from the single slate configuration
  const muiTheme = createTheme(themeConfig);

  const contextValue: ThemeContextType = {
    muiTheme,
    isHydrated,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access theme context
 * Provides type-safe access to the fixed dark slate theme
 *
 * @returns Theme context with Material-UI theme
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Default export for easier importing
export default ThemeProvider;

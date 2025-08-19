'use client';
import { ThemeProvider as MUIThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getTheme } from '../constants/themes';
import { ThemeType } from '@/types';

/**
 * Type definitions for theme context
 */
export interface ThemeContextType {
  muiTheme: Theme;
  isHydrated: boolean;
  currentTheme: ThemeType;
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
 * Theme Provider component that uses user's saved theme preference
 * Falls back to system preference or light theme if no preference is set
 *
 * @param children - React child components to wrap with theme context
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: session } = useSession();
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('light');

  // Hydration effect to prevent SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Update theme when session changes
  useEffect(() => {
    if (session?.user?.theme) {
      setCurrentTheme(session.user.theme);
    } else {
      // Check for system preference if no user theme is set
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(prefersDark ? 'dark' : 'light');
    }
  }, [session]);

  // Get the Material-UI theme based on current selection
  const muiTheme = getTheme(currentTheme);

  const contextValue: ThemeContextType = {
    muiTheme,
    isHydrated,
    currentTheme,
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
 * Provides type-safe access to the current theme
 *
 * @returns Theme context with Material-UI theme and current theme name
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

import { createTheme } from '@mui/material/styles';
import { ThemeType } from '@/types';

// Light Theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#e33371',
      dark: '#9a0036',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Dark Theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#ffc1e3',
      dark: '#bf5f82',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Sage Theme (VS Code inspired)
export const sageTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7cb342',
      light: '#aed581',
      dark: '#558b2f',
    },
    secondary: {
      main: '#66bb6a',
      light: '#98ee99',
      dark: '#338a3e',
    },
    background: {
      default: '#1e2e2e',
      paper: '#263838',
    },
    text: {
      primary: '#d4e5d4',
      secondary: '#a8c7a8',
    },
    error: {
      main: '#ff6b6b',
    },
    warning: {
      main: '#ffd93d',
    },
    info: {
      main: '#6bcf7f',
    },
    success: {
      main: '#51cf66',
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

// Slate Theme
export const slateTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64b5f6',
      light: '#9be7ff',
      dark: '#2286c3',
    },
    secondary: {
      main: '#81c784',
      light: '#b2fab4',
      dark: '#519657',
    },
    background: {
      default: '#1a1f2e',
      paper: '#232937',
    },
    text: {
      primary: '#e0e6ed',
      secondary: '#a8b2c7',
    },
    error: {
      main: '#ff5252',
    },
    warning: {
      main: '#ffb74d',
    },
    info: {
      main: '#64b5f6',
    },
    success: {
      main: '#81c784',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

// Theme map
export const themes: Record<ThemeType, any> = {
  light: lightTheme,
  dark: darkTheme,
  sage: sageTheme,
  slate: slateTheme,
};

// Theme metadata for display
export const themeMetadata: Record<ThemeType, { name: string; description: string }> = {
  light: {
    name: 'Light',
    description: 'Clean and bright theme for daytime use',
  },
  dark: {
    name: 'Dark',
    description: 'Easy on the eyes for nighttime viewing',
  },
  sage: {
    name: 'Sage',
    description: 'Sage inspired theme with green accents',
  },
  slate: {
    name: 'Slate',
    description: 'Modern blue-gray theme with subtle colors',
  },
};

export const getTheme = (themeName?: ThemeType) => {
  return themes[themeName || 'light'];
};

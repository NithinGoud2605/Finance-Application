import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useThemeMode } from '../contexts/ThemeModeContext';

export default function AppTheme({ children }) {
  const { mode } = useThemeMode();

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#2563eb' : '#60a5fa',
        light: mode === 'light' ? '#60a5fa' : '#93c5fd',
        dark: mode === 'light' ? '#1d4ed8' : '#3b82f6',
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'light' ? '#7c3aed' : '#a78bfa',
        light: mode === 'light' ? '#a78bfa' : '#c4b5fd',
        dark: mode === 'light' ? '#5b21b6' : '#8b5cf6',
        contrastText: '#ffffff',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
        contrastText: '#000000',
      },
      info: {
        main: '#06b6d4',
        light: '#22d3ee',
        dark: '#0891b2',
        contrastText: '#ffffff',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#64748b' : '#94a3b8',
      },
      divider: mode === 'light' ? '#e2e8f0' : '#334155',
      action: {
        hover: mode === 'light' ? '#f1f5f9' : '#334155',
        selected: mode === 'light' ? '#e2e8f0' : '#475569',
        disabled: mode === 'light' ? '#cbd5e1' : '#64748b',
        disabledBackground: mode === 'light' ? '#f1f5f9' : '#1e293b',
      },
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 600,
      h1: {
        fontSize: '3rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: '1.875rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.015em',
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        fontWeight: 400,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
        fontWeight: 400,
        letterSpacing: '0.01em',
      },
      overline: {
        fontSize: '0.75rem',
        lineHeight: 1.2,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        letterSpacing: '0.005em',
      },
    },
    shape: { 
      borderRadius: 12 
    },
    spacing: 8,
    shadows: mode === 'light' ? [
      'none',
      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    ] : [
      'none',
      '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
      '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
      '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
      '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
      '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFeatureSettings: '"cv03", "cv04", "cv11"',
            fontOpticalSizing: 'auto',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.04)' : 'rgba(96, 165, 250, 0.04)',
            },
          },
          text: {
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.04)' : 'rgba(96, 165, 250, 0.04)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #334155',
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light'
                ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                : '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #334155',
              backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
          },
          elevation2: {
            boxShadow: mode === 'light' 
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
          },
          elevation3: {
            boxShadow: mode === 'light' 
              ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
              : '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              fontSize: '0.875rem',
              fontWeight: 400,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '& fieldset': {
                borderWidth: '1.5px',
                borderColor: mode === 'light' ? '#e2e8f0' : '#475569',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#cbd5e1' : '#64748b',
              },
              '&.Mui-focused fieldset': {
                borderWidth: '2px',
                borderColor: mode === 'light' ? '#2563eb' : '#60a5fa',
                boxShadow: mode === 'light' 
                  ? '0 0 0 3px rgba(37, 99, 235, 0.1)' 
                  : '0 0 0 3px rgba(96, 165, 250, 0.1)',
              },
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
              '&.Mui-focused': {
                color: mode === 'light' ? '#2563eb' : '#60a5fa',
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
              boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(12px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(12px)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '4px 8px',
            padding: '10px 16px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.04)' : 'rgba(96, 165, 250, 0.04)',
              transform: 'translateX(4px)',
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(96, 165, 250, 0.08)',
              borderLeft: `3px solid ${mode === 'light' ? '#2563eb' : '#60a5fa'}`,
              '&:hover': {
                backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(96, 165, 250, 0.12)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            boxShadow: mode === 'light' 
              ? '0 25px 50px -12px rgb(0 0 0 / 0.25)'
              : '0 25px 50px -12px rgb(0 0 0 / 0.6)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${mode === 'light' ? '#f1f5f9' : '#334155'}`,
            boxShadow: mode === 'light' 
              ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
              : '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '8px 12px',
            backgroundColor: mode === 'light' ? '#1e293b' : '#f8fafc',
            color: mode === 'light' ? '#f8fafc' : '#1e293b',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            whiteSpace: 'normal',
            overflow: 'visible',
            textOverflow: 'unset',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}

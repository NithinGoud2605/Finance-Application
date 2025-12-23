import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { useMediaQuery, CssBaseline } from '@mui/material';
import baseTheme from '../theme';

// Create context
export const ThemeModeContext = createContext({
  mode: 'light',
  toggleThemeMode: () => {},
  isDarkMode: false,
  setMode: () => {},
});

// Custom hook to use the theme context
export const useThemeMode = () => useContext(ThemeModeContext);

// Simple wrapper component for theme transition using CSS
const ThemeTransition = ({ children, isDarkMode }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      opacity: 1
    }}
  >
    {children}
  </div>
);

ThemeTransition.propTypes = {
  children: PropTypes.node.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

// Provider component
export const ThemeModeProvider = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(() => {
    const storedMode = localStorage.getItem('themeMode');
    return storedMode || (prefersDarkMode ? 'dark' : 'light');
  });

  // isDarkMode boolean for easier checks
  const isDarkMode = mode === 'dark';

  // Generate the theme with current mode
  const theme = useMemo(() => {
    return createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        mode,
        primary: {
          ...baseTheme.palette.primary,
          main: mode === 'light' ? '#4a6cf7' : '#60a5fa',
          dark: mode === 'light' ? '#1e40af' : '#1d4ed8',
        },
        background: {
          default: mode === 'light' ? '#f8fafc' : '#0f172a',
          paper: mode === 'light' ? '#ffffff' : '#1e293b',
        },
        text: {
          primary: mode === 'light' ? '#1e293b' : '#e2e8f0',
          secondary: mode === 'light' ? '#64748b' : '#94a3b8',
        },
      },
      components: {
        ...baseTheme.components,
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: 'background-color 0.3s ease, color 0.3s ease',
              scrollBehavior: 'smooth',
            }
          }
        }
      }
    });
  }, [mode]);

  // Toggle theme mode function
  const toggleThemeMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    
    // Apply theme color to meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", 
        mode === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleThemeMode,
      isDarkMode,
      setMode,
    }),
    [mode, isDarkMode]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <ThemeTransition isDarkMode={isDarkMode}>
          {children}
        </ThemeTransition>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

ThemeModeProvider.propTypes = {
  children: PropTypes.node.isRequired,
}; 
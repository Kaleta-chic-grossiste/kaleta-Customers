import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  isDark: true,
  colors: {},
  toggleTheme: () => {},
  updatePrimaryColor: () => {},
  updateSecondaryColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const makeColors = (isDark, primary, secondary) => ({
  bg:        isDark ? '#0B0B0B' : '#F8F8F5',
  bg2:       isDark ? '#111111' : '#FFFFFF',
  card:      isDark ? '#1E1E1E' : '#FFFFFF',
  card2:     isDark ? '#2a2a2a' : '#F0F0EC',
  border:    isDark ? '#2A2A2A' : '#E0E0DC',
  text:      isDark ? '#F5F5F5' : '#1A1A1A',
  muted:     isDark ? '#888'    : '#777',
  tabBar:    isDark ? '#111111' : '#FFFFFF',
  tabBorder: isDark ? '#2a2a2a' : '#E0E0DC',
  inputBg:   isDark ? '#1E1E1E' : '#F5F5F2',
  primary,
  secondary,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark]       = useState(true);
  const [primary, setPrimary]     = useState('#39FF5A');
  const [secondary, setSecondary] = useState('#FF9F1C');

  useEffect(() => {
    AsyncStorage.getItem('kaleta_theme').then(val => {
      if (val !== null) setIsDark(val === 'dark');
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('kaleta_theme', next ? 'dark' : 'light');
  }, [isDark]);

  const updatePrimaryColor   = useCallback((color) => { if (color) setPrimary(color); }, []);
  const updateSecondaryColor = useCallback((color) => { if (color) setSecondary(color); }, []);

  const colors = makeColors(isDark, primary, secondary);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, updatePrimaryColor, updateSecondaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

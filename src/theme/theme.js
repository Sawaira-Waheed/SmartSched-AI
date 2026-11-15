import React, { createContext, useContext, useMemo } from 'react';

// Shared colors for the whole app. Change a value here and every screen updates.
export const PALETTES = {
  light: {
    bg: '#F6F4FF',
    surface: '#FFFFFF',
    surfaceAlt: '#F1EDFF',
    border: '#E7E2FA',
    text: '#2A2350',
    muted: '#8A84A8',
    white: '#FFFFFF',
    overlay: 'rgba(42,35,80,0.35)',
    primary: '#7C5CFF',
    primarySoft: '#EEE9FF',
    pink: '#FF6FA8',
    pinkSoft: '#FFE8F3',
    mint: '#2FC79A',
    mintSoft: '#E0F7EF',
    sky: '#4DA8FF',
    skySoft: '#E4F1FF',
    amber: '#FFA64D',
    amberSoft: '#FFF1E3',
    red: '#FF5C7A',
    redSoft: '#FFE8EE',
  },
  dark: {
    bg: '#120F26',
    surface: '#1C1838',
    surfaceAlt: '#252048',
    border: '#322B5C',
    text: '#F3F0FF',
    muted: '#A59FCB',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.6)',
    primary: '#8B74FF',
    primarySoft: '#2B2559',
    pink: '#FF8CC0',
    pinkSoft: '#3A2148',
    mint: '#4FDDB0',
    mintSoft: '#173A36',
    sky: '#6BBBFF',
    skySoft: '#18304F',
    amber: '#FFB870',
    amberSoft: '#3D2C1C',
    red: '#FF7A92',
    redSoft: '#3D1F2C',
  },
};

const makeTheme = (mode) => {
  const isDark = mode === 'dark';
  return {
    mode,
    c: PALETTES[mode],
    radius: { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 },
    shadow: {
      shadowColor: isDark ? '#000000' : '#7C5CFF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 14,
      elevation: 4,
    },
  };
};

const ThemeContext = createContext(makeTheme('light'));

export const ThemeProvider = ({ mode, children }) => {
  const value = useMemo(() => makeTheme(mode), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
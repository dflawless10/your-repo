import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  PropsWithChildren,
  useEffect,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🧩 Theme Types
export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  textPrimary: string;
  brandPrimary: string;
  onBrandPrimary: string;
}

export interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'user-theme-preference';

// 🎨 Color Palettes (clear, consistent names)
const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  textPrimary: '#11181C',
  brandPrimary: '#007AFF',
  onBrandPrimary: '#FFFFFF',
};

const darkColors: ThemeColors = {
  background: '#0F1213', // dark background
  surface: '#1C1C1E',    // dark surface
  textPrimary: '#ECEDEE', // light text
  brandPrimary: '#0A84FF',
  onBrandPrimary: '#FFFFFF',
};

// 🧠 Context Initialization (nullable so useTheme can enforce provider presence)
const ThemeContext = createContext<ThemeContextType | null>(null);

// 🧪 Storage Helpers
const getStoredTheme = async (): Promise<ThemeType | null> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? (stored as ThemeType) : null;
  } catch (error) {
    console.warn('Failed to load theme from storage:', error);
    return null;
  }
};

const saveThemePreference = async (theme: ThemeType) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme to storage:', error);
  }
};

// 🧾 Provider Component
export const ThemeProvider = ({ children }: PropsWithChildren<{}>) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    (async () => {
      const stored = await getStoredTheme();
      setThemeState((stored ?? (systemScheme === 'dark' ? 'dark' : 'light')) as ThemeType);
    })();
  }, [systemScheme]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    saveThemePreference(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      saveThemePreference(newTheme);
      return newTheme;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      colors: theme === 'light' ? lightColors : darkColors,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;

// 🪄 Custom Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
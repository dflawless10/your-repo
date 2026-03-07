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
  textSecondary: string;
  textTertiary: string;
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
  textSecondary: '#4A5568',
  textTertiary: '#9CA3AF',
  brandPrimary: '#007AFF',
  onBrandPrimary: '#FFFFFF',
};

const darkColors: ThemeColors = {
  background: '#0F1213', // dark background
  surface: '#1C1C1E',    // dark surface
  textPrimary: '#ECEDEE', // light text
  textSecondary: '#ddd',  // lighter gray for secondary text
  textTertiary: '#999',   // even lighter gray for tertiary text
  brandPrimary: '#0A84FF',
  onBrandPrimary: '#FFFFFF',
};

// 🧠 Context Initialization (nullable so useTheme can enforce provider presence)
const ThemeContext = createContext<ThemeContextType | null>(null);

// 🧪 Storage Helpers
const getStoredTheme = async (): Promise<ThemeType | null> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    console.log('🎨 getStoredTheme: Read from storage ->', stored);
    return stored === 'light' || stored === 'dark' ? (stored as ThemeType) : null;
  } catch (error) {
    console.warn('Failed to load theme from storage:', error);
    return null;
  }
};

const saveThemePreference = async (theme: ThemeType) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
    console.log('🎨 saveThemePreference: Saved to storage ->', theme);
  } catch (error) {
    console.warn('Failed to save theme to storage:', error);
  }
};

// 🧾 Provider Component
export const ThemeProvider = ({ children }: PropsWithChildren<{}>) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [theme, setThemeState] = useState<ThemeType>('light');

  // Only load theme once on mount
  useEffect(() => {
    (async () => {
      const stored = await getStoredTheme();
      const initialTheme = (stored ?? (systemScheme === 'dark' ? 'dark' : 'light')) as ThemeType;
      console.log('🎨 ThemeProvider: Loading theme ->', initialTheme, '(stored:', stored, 'system:', systemScheme, ')');
      setThemeState(initialTheme);
    })();
  }, []); // Empty dependency array - only run once on mount

  const setTheme = useCallback(async (newTheme: ThemeType) => {
    console.log('🎨 ThemeProvider: Setting theme to', newTheme);
    setThemeState(newTheme);
    await saveThemePreference(newTheme);
  }, []);

  const toggleTheme = useCallback(async () => {
    const prev = theme;
    const newTheme = prev === 'light' ? 'dark' : 'light';
    console.log('🎨 ThemeProvider: Toggling theme from', prev, 'to', newTheme);
    setThemeState(newTheme);
    await saveThemePreference(newTheme);
  }, [theme]);

  // Always create new object on every render - ensures all consumers get updates
  // Calculate colors based on current theme state
  const contextValue = {
    theme,
    colors: theme === 'light' ? lightColors : darkColors,
    setTheme,
    toggleTheme,
  };

  console.log('🎨 ThemeProvider render - theme:', theme, 'colors.background:', contextValue.colors.background);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;

// 🪄 Custom Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
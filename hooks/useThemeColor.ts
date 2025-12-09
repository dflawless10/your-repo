import { useColorScheme } from 'react-native';

type ThemeProps = {
  light?: string;
  dark?: string;
};

export default function useThemeColor(
  props: ThemeProps,
  colorName: string
): string {
  const theme = useColorScheme() ?? 'light';

  if (props[theme]) {
    return props[theme]!;
  }

  // Fallback color map
  const fallbackColors: Record<string, { light: string; dark: string }> = {
    text: {
      light: '#000',
      dark: '#fff',
    },
    background: {
      light: '#fff',
      dark: '#000',
    },
    link: {
      light: '#0a7ea4',
      dark: '#4fc3f7',
    },
  };

  return fallbackColors[colorName]?.[theme] ?? '#000';
}

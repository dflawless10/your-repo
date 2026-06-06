import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ResponsiveLayout {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  numColumns: number;
  horizontalPadding: number;
  verticalPadding: number;
  itemGap: number;
  headerPaddingTop: number;
  footerPaddingBottom: number;
}

export const useResponsiveLayout = (): ResponsiveLayout => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setDimensions({ width: window.width, height: window.height });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600; // Samsung Fold unfolded is ~884px

  return {
    width,
    height,
    isLandscape,
    isTablet,
    // Grid columns: landscape = 4 cols, tablet portrait = 3 cols, phone = 2 cols
    numColumns: isLandscape ? 4 : isTablet ? 3 : 2,
    // Horizontal padding: more in landscape
    horizontalPadding: isLandscape ? 32 : 16,
    // Vertical padding: less in landscape to maximize space
    verticalPadding: isLandscape ? 12 : 24,
    // Item gaps: consistent
    itemGap: 12,
    // Header padding: minimal in landscape
    headerPaddingTop: isLandscape ? 8 : 20,
    // Footer padding: less in landscape
    footerPaddingBottom: isLandscape ? 20 : 100,
  };
};

export const COLUMN_GAP = 12;
export const HORIZONTAL_PADDING = 16;

/** Number of columns based on orientation and screen type */
export function getNumColumns(isLandscape: boolean, screen: 'home' | 'default' | 'search' = 'default'): number {
  if (screen === 'home') return isLandscape ? 4 : 2;
  if (screen === 'search') return isLandscape ? 3 : 1;
  return isLandscape ? 3 : 2;
}

/** Card width that fills available space with consistent gaps */
export function getItemWidth(windowWidth: number, numColumns: number): number {
  return (windowWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (numColumns - 1)) / numColumns;
}

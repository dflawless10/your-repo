import React, { JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  shape: string;
};

const shapeMap: Record<string, JSX.Element> = {
  round: (
    <Svg width={40} height={40} viewBox="0 0 24 24">
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2z" fill="#888" />
    </Svg>
  ),
  pear: (
    <Svg width={40} height={40} viewBox="0 0 24 24">
      <Path d="M12 2C10 4 8 8 8 12c0 4 2 8 4 8s4-4 4-8c0-4-2-8-4-10z" fill="#888" />
    </Svg>
  ),
  princess: (
    <Svg width={40} height={40} viewBox="0 0 24 24">
      <Path d="M4 4h16v16H4z" fill="#888" />
    </Svg>
  ),
  // Add more shapes as needed
};

const DiamondShapeRenderer = ({ shape }: Props) => {
  const normalizedShape = shape.toLowerCase();
  const shapeSvg = shapeMap[normalizedShape] || shapeMap['round'];

  return <View style={styles.container}>{shapeSvg}</View>;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
});

export default DiamondShapeRenderer;

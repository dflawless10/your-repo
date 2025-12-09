import React from "react";
import Svg, { Path } from 'react-native-svg';
import LottieView from 'lottie-react-native';

export function GoatWiggle({ wiggle }: Readonly<{ wiggle?: boolean }>) {
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100">
      <Path
        d="M20 50 Q40 20, 60 50 T100 50"
        stroke="#444"
        strokeWidth={4}
        fill="none"
        transform={wiggle ? 'rotate(5 50 50)' : 'rotate(0 50 50)'}
      />
    </Svg>
  );
}

export function SparkleTrail() {
  return (
    <LottieView
      source={require('../../sparkletrail/sparkle.animations.json')}
      autoPlay
      loop={false}
      style={{ width: 120, height: 120 }}
    />
  );
}
export default GoatWiggle;
// components/FadeView.tsx
import React, { useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

type Props = {
  visible: boolean;
  duration?: number;
  style?: ViewStyle;
  children: React.ReactNode;
};

const FadeView = ({ visible, duration = 500, style, children }: Props) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, duration, fadeAnim]);

  return (
    <Animated.View style={[style, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>


  );
};

export default FadeView;

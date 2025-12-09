import { Animated, Easing } from 'react-native';
const goatAnim = new Animated.Value(0);

Animated.timing(goatAnim, {
  toValue: 1,
  duration: 500,
  easing: Easing.bounce,
  useNativeDriver: true,
}).start();


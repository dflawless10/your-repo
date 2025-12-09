import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

import goatImg from './assets/goat.png';
import balloonImg from './assets/balloons.png';
// Optional: use this if you want to play goatSound instead
// import goatSound from './assets/goat-bells.wav';

export default function CarnivalGoatBalloon() {
  const float = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  useEffect(() => {
    const playGoatSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/sounds/goatScream.mp3') // ✅ Make sure this path is correct
        );
        await sound.playAsync();
        // Optional cleanup
        setTimeout(() => sound.unloadAsync(), 2000);
      } catch (err) {
        console.warn('Goat sound failed:', err);
      }
    };

    playGoatSound();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={balloonImg} style={styles.balloon} />
      <Animated.Image source={goatImg} style={[styles.goat, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  goat: { width: 80, height: 80, resizeMode: 'contain' },
  balloon: { width: 80, height: 80, resizeMode: 'contain' },
});

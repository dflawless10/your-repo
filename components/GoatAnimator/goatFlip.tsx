import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import goatImg from '../../assets/images/goat.png'; // Make sure this path is correct
import { MascotMood } from '@/types/goatmoods';
import { useTheme } from '@/app/theme/ThemeContext';

type GoatFlipProps = {
  trigger: boolean;
  onComplete?: () => void;
  bidAmount?: number;
  mood?: MascotMood; // 🐐 Add this
};

const sounds = [
  require('assets/sounds/goatScream.mp3'),
  require('assets/sound/goat-stutter-baa.wav'),
  require('../../assets/goatExcited.wav'),
];

const moodSounds: Partial<Record<MascotMood, any>> = {
  Celebrate: require('../../assets/sounds/goatExcited.wav'),
  Grumpy: require('assets/sounds/goatScream.mp3'),
  Sleepy: require('../../assets/sounds/goatChill.wav'),
  // Add more mappings as needed
};



export const GoatFlip: React.FC<GoatFlipProps> = ({ trigger, onComplete, bidAmount = 0 }) => {
  const { theme } = useTheme();
  const flip = useSharedValue(0);

  const goatFlipStyle = useAnimatedStyle(() => {
  const rotateX = `${interpolate(flip.value, [0, 1], [0, 360])}deg`;
  return {
    transform: [{ rotateX }],
  };
});

  useEffect(() => {
    if (trigger) {
      const duration = bidAmount > 1000 ? 1000 : 500;

      flip.value = withTiming(1, { duration }, () => {
        flip.value = 0;
        onComplete?.();
      });

      playGoatSound();
    }
  }, [trigger]);

 const playGoatSound = async (mood?: MascotMood) => {
  console.log('🐐 Goat sound triggered! mood:', mood);

  const selectedSound = mood ? moodSounds[mood] : sounds[Math.floor(Math.random() * sounds.length)];
  if (!selectedSound) return;

  try {
    const { sound } = await Audio.Sound.createAsync(selectedSound);
    await sound.playAsync();
  } catch (err) {
    console.warn('🐐 Failed to play goat sound:', err);
  }
};



  return (
    <Animated.View style={[
      styles.goatContainer,
      goatFlipStyle,
      {
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
        borderRadius: 60,
      }
    ]}>
      <Image source={goatImg} style={styles.goat} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  goatContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  goat: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
});

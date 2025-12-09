import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { MascotMood } from '@/types/goatmoods';

type SparkleAnimationsProps = {
  mood: MascotMood;
  intensity: number;
  style?: string;
  testID?: string;
};



const SparkleAnimations: React.FC<SparkleAnimationsProps> = ({ mood, intensity, style, testID }) => {
  const sparkle = useSharedValue(1);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }],
  }));

  const triggerSparkle = () => {
    sparkle.value = withRepeat(withTiming(1.5, { duration: 150 }), 2, true);
  };

  const playBleat = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./assets/bleat.mp3'));
      await sound.playAsync();
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Failed to play goat bleat:', error);
    }
  };

  const onSparklePress = async () => {
    triggerSparkle();
    await playBleat();
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{`Mood: ${mood}`}</Text>
      <Animated.View style={sparkleStyle}>
        <Text style={styles.sparkle} onPress={onSparklePress}>
          ✨
        </Text>
      </Animated.View>
      <Text style={styles.intensity}>{`Intensity: ${intensity}`}</Text>
      {style && <Text style={styles.styleLabel}>{`Style: ${style}`}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  sparkle: {
    fontSize: 32,
    marginVertical: 8,
  },
  intensity: {
    fontSize: 14,
    color: '#666',
  },
  styleLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
});

export default SparkleAnimations;

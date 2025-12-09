// app/sparkletrail/SparkleTrail.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useColorScheme } from 'react-native';
import {Audio, AVPlaybackSource} from 'expo-av';

import sparkleBurst from '@/assets/animations/sparkle-burst.json';
import sparkleTrail from '@/assets/animations/sparkle-trail.json';
import sparkleShimmer from '@/assets/animations/sparkle-shimmer.json';
import sparkleChime from '@/assets/sounds/sparkle.wav'; // ✅ Fixed import path

type SparkleType = 'burst' | 'trail' | 'shimmer';
type MascotMood = 'cheerful' | 'mischievous' | 'focused';

interface SparkleTrailProps {
  type?: SparkleType;
  size?: number;
  loop?: boolean;
  onComplete?: () => void;
  mood?: MascotMood;
  milestoneLevel?: number; // 0 = default, 1 = minor, 2 = major
}

export default function SparkleTrail({
  type = 'burst',
  size = 100,
  loop = false,
  onComplete,
  mood = 'cheerful',
  milestoneLevel = 0,
}: SparkleTrailProps) {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const sparkleColor = isDark ? '#B0E0E6' : '#FFD700';

  const animationSourceMap: Record<SparkleType, any> = {
    burst: sparkleBurst,
    trail: sparkleTrail,
    shimmer: sparkleShimmer,
  };

  const animationSource = animationSourceMap[type] || sparkleBurst;

  const moodTintMap: Record<MascotMood, string> = {
    cheerful: sparkleColor,
    mischievous: '#FF69B4',
    focused: '#00CED1',
  };

  let milestoneScale = 1.0;
  if (milestoneLevel === 1) milestoneScale = 1.2;
  else if (milestoneLevel === 2) milestoneScale = 1.5;

  const handleAnimationFinish = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(sparkleChime as unknown as AVPlaybackSource);

      await sound.playAsync();
    } catch (error) {
      console.warn('Sparkle sound failed to play:', error);
    } finally {
      onComplete?.();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size * milestoneScale,
          height: size * milestoneScale,
        },
      ]}
    >
      <LottieView
        source={animationSource}
        autoPlay
        loop={loop}
        style={{
          width: size * milestoneScale,
          height: size * milestoneScale,
        }}
        onAnimationFinish={handleAnimationFinish}
        colorFilters={[
          {
            keypath: 'sparkle',
            color: moodTintMap[mood],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});


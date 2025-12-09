import React from 'react';
import { View } from 'react-native';
import { MascotMood } from '@/types/goatmoods';
import SparkleAnimations from "@/app/components/animations/SparkleAnimations";

type SparkleTrailProps = {
  mood: MascotMood;
  milestoneLevel: number;
  testID?: string;
};




// 🧪 Mood-to-Sparkle Mapping
const sparkleVariants: Record<MascotMood, string> = {
  Cheerful: 'twinkle',
  Mischievous: 'flicker',
  Majestic: 'radiant',
  Brooding: 'dim',
  Sleepy: 'fade',
  Mystic: 'pulse',
  Happy: 'glow',
  Loading: 'loop',
  Sad: 'drizzle',
  Celebrate: 'burst',
  Shimmer: 'shimmer',
  Excited: 'pop',
  Grumpy: 'static',
  Goatified: 'chaotic',
  Curious: 'trail',
  Playful: 'bounce',
  Joyful: 'spunky',
  Chaotic: 'messy',
};

const SparkleTrail: React.FC<SparkleTrailProps> = ({ mood, milestoneLevel, testID }) => {
  const sparkleStyle = sparkleVariants[mood] ?? 'twinkle';

  return (
    <View testID={testID}>
      <SparkleAnimations
        mood={mood}
        intensity={milestoneLevel}
        style={sparkleStyle}
      />
    </View>
  );
};

export default SparkleTrail;


import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet, GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { playGoatSound } from '@/components/ui/GoatSound';

import genieSprite from '../assets/goat-icon.png';
import peekImage from '../assets/goat-peek.png';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  isActive: boolean;
  onPress: () => void;
  size?: number;
}

export default function GoatGenieAlertBadge({ isActive, onPress, size = 36 }: Props) {
  const [showGenie, setShowGenie] = useState(false);
  const spin = useSharedValue(0);
  const scale = useSharedValue(1);

  const genieStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spin.value}deg` },
      { scale: scale.value },
    ],
  }));

  const handlePress = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    await playGoatSound();
    setShowGenie(true);

    spin.value = withSequence(
      withTiming(360, { duration: 600 }),
      withTiming(0, { duration: 0 })
    );

    scale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 300 })
    );

    setTimeout(() => {
      setShowGenie(false);
      onPress();
    }, 1200);
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: size / 2 },
          isActive ? styles.activeBadge : styles.inactiveBadge,
        ]}
        activeOpacity={0.8}
      >
        <Image
          source={peekImage}
          style={{ width: size * 0.82, height: size * 0.82 }}
          contentFit="contain"
        />
      </TouchableOpacity>

      {showGenie && (
        <AnimatedImage
          source={genieSprite}
          style={[
            styles.genie,
            genieStyle,
            {
              width: size * 1.67,
              height: size * 1.67,
              top: -(size * 1.25),
              left: -(size * 0.21),
            },
          ]}
          contentFit="contain"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveBadge: {
    backgroundColor: 'transparent',
  },
  activeBadge: {
    backgroundColor: '#6A0DAD',
    shadowColor: '#6A0DAD',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 5,
  },
  genie: {
    position: 'absolute',
    zIndex: 10,
  },
});

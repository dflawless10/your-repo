import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,

  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

// Use require() for images with expo-image
import genieSprite from '../assets/goat-icon.png'; // Using goat-icon.png
import wishlistCoin from '../assets/goat-stamp.png';

// Create an animated version of expo-image
const AnimatedImage = Animated.createAnimatedComponent(Image);


export default function GoatGenieBadge({ onWish, size = 48 }: { onWish: () => void; size?: number }) {
  const [showGenie, setShowGenie] = useState(false);
  const spin = useSharedValue(0);
  const scale = useSharedValue(1);

  const genieStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spin.value}deg` },
      { scale: scale.value },
    ],
    opacity: showGenie ? 1 : 0,
  }));

  const handlePress = () => {
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
      onWish(); // trigger wishlist logic
    }, 1200);
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <TouchableOpacity onPress={handlePress} style={styles.badge}>
        <Image source={wishlistCoin} style={[styles.badgeImage, { width: size, height: size }]} />
      </TouchableOpacity>

      {showGenie && (
        <AnimatedImage
          source={genieSprite}
          style={[styles.genie, genieStyle, { width: size * 1.67, height: size * 1.67, top: -size * 1.25, left: -size * 0.21 }]}
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
    width: 48,
    height: 48,
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  badgeImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  genie: {
    position: 'absolute',
    top: -60,
    left: -10,
    width: 80,
    height: 80,
    resizeMode: 'contain',
    zIndex: 2,
  },
});

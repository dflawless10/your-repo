import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,

  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import genieSprite from 'app/components/assets/GoatGenieBadge.png'; // your genie image
import wishlistCoin from 'app/components/assets/wishlist-coin.png'; // your badge image


export default function GoatGenieBadge({ onWish }: { onWish: () => void }) {
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
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.badge}>
        <Image source={wishlistCoin} style={styles.badgeImage} />
      </TouchableOpacity>

      {showGenie && (
        <Animated.Image
          source={genieSprite}
          style={[styles.genie, genieStyle]}
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

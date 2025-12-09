import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { Audio } from 'expo-av';

type Props = {
  visible: boolean;
};

export default function SparkleFeedback({ visible }: Readonly<Props>) {
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      playSound();
      triggerSparkle();
    }
  }, [visible]);

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/goat-Bells.wav')
    );
    await sound.playAsync();
  };

  const triggerSparkle = () => {
    sparkleAnim.setValue(0);
    Animated.timing(sparkleAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  const sparkleStyle = {
    opacity: sparkleAnim,
    transform: [
      {
        scale: sparkleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1.5],
        }),
      },
    ],
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sparkle, sparkleStyle]}>
        <Image
          source={require('../assets/sparkle.png')}
          style={styles.sparkleImage}
        />
      </Animated.View>
      <Text style={styles.text}>✨ Sparkle Certified! ✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 24,
  },
  sparkle: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  sparkleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4630EB',
  },
});

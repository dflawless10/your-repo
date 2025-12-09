
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { playGoatMelody } from '@/assets/sounds/GoatsFavoriteMelodies';

playGoatMelody(0); // Plays the first sound in goatMelodies
type GoatAnimatorProps = {
  trigger: boolean;
};

const GoatAnimator: React.FC<GoatAnimatorProps> = ({ trigger }) => {
  useEffect(() => {
    const playSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sound/goat-stutter-baa.wav')
 // 🐐 Your goat sound file
      );
      await sound.playAsync();
    };

    if (trigger) {
      playSound();
    }
  }, [trigger]);

  return (
    <View style={styles.goatContainer}>
      {trigger && <Text style={styles.goatText}>🐐 GOAT MODE ACTIVATED!</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  goatContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
  },
  goatText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default GoatAnimator;
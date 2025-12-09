// app/utils/goatFeedback.ts

import { Audio } from 'expo-av';
import { Alert } from 'react-native';

/**
 * Plays a celebratory goat bleat and triggers optional sparkle animation.
 * @param value - The bid value or item price to celebrate.
 */
export async function triggerGoat(value: string) {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/goat-bleat.wav')
    );
    await sound.playAsync();

    // Optional: Trigger sparkle animation or confetti
    console.log(`🎉 Goat bleat for value: $${value}`);
    // You could trigger a Lottie animation or state update here

    // Optional: Add haptic feedback
    // import * as Haptics from 'expo-haptics';
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  } catch (error) {
    console.warn('🐐 Goat feedback failed:', error);
    Alert.alert('Oops!', 'The goat got stage fright.');
  }
}

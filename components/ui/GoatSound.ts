// components/ui/GoatSound.ts
import { Audio } from 'expo-av';

// Handles goat sound playback
export const playGoatSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/bleat.mp3'),
      { shouldPlay: true }
    );
    await sound.playAsync();
    await sound.unloadAsync(); // cleanup after sound finishes
  } catch (err) {
    console.error('Failed to play goat sound:', err);
  }
};

export default playGoatSound;

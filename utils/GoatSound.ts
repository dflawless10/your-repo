import { Audio, AVPlaybackStatus } from 'expo-av';

export const playGoatSound = async (price: string) => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/goatExcited.wav')
    );
    await sound.playAsync();
    
    // Correctly type the status and check if it's done playing
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing goat sound:', error);
  }
};
import { Audio } from 'expo-av';

export const playGoatSound = async () => {
  const scream = await Audio.Sound.createAsync(
    require('../../../assets/sounds/goatScream.mp3')
  );
  await scream.sound.playAsync();
  await scream.sound.unloadAsync(); // optional cleanup
};

export const playWelcomeBleat = async () => {
  const bleat = await Audio.Sound.createAsync(
    require('../../../assets/animations/goatWelcome.mp4') // or convert to .mp3/.wav if needed
  );
  await bleat.sound.playAsync();
  await bleat.sound.unloadAsync(); // optional cleanup
};

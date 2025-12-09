// assets/sounds/GoatsFavoriteMelodies.tsx

import { Audio } from 'expo-av';

type GoatSound = {
  name: string;
  file: any;
  description: string;
};

export const goatMelodies: GoatSound[] = [
  {
    name: 'Stutter Baa',
    file: require('assets/sound/goat-stutter-baa.wav')

,
    description: 'A quirky, stuttered bleat perfect for bid confirmations or goat popups.',
  },
  {
    name: 'Victory Baa',
    file: require('../sound/goat-victory-baa.wav'),
    description: 'Triumphant bleat for winning bids or successful actions.',
  },
  {
    name: 'Sneaky Snort',
    file: require('../sound/goat-sneaky-snort.wav'),
    description: 'A mischievous snort for playful interactions or errors.',
  },
];

export async function playGoatMelody(index: number) {
  try {
    const { sound } = await Audio.Sound.createAsync(goatMelodies[index].file);
    await sound.playAsync();
  } catch (error) {
    console.warn('Failed to play goat sound:', error);
  }
}



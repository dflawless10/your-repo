import { Audio } from 'expo-av';

type GoatSound = {
  name: string;
  file: any;
  description: string;
};

export const goatSounds: GoatSound[] = [
  {
    name: 'Stutter Baa',
    file: require('../sound/goat-stutter-baa.wav'),
    description: 'A quirky, stuttered bleat perfect for bid confirmations or goat popups.',
  },
  {
    name: 'Victory Baa',
    file: require('assets/sound/goat-victory-bah.wav'),
    description: 'Triumphant bleat for winning bids or successful actions.',
  },
  {
    name: 'Sneaky Snort',
    file: require('assets/sound/goat-sneaky-snort.wav'),
    description: 'A mischievous snort for playful interactions or errors.',
  },
  {
    name: 'Goat Bells',
    file: require('assets/sound/goat-stutter-baa.wav'),
    description: 'Magical chime for auction entry, gifting, or mascot mood toggles.',
  },
];

export async function playGoatSoundByIndex(index: number) {
  try {
    const { sound } = await Audio.Sound.createAsync(goatSounds[index].file);
    await sound.playAsync();
    await sound.unloadAsync();
  } catch (error) {
    console.warn(`Failed to play goat sound at index ${index}:`, error);
  }
}

export async function playGoatSoundByName(name: string) {
  const soundObj = goatSounds.find((s) => s.name === name);
  if (!soundObj) {
    console.warn(`Goat sound "${name}" not found.`);
    return;
  }
  try {
    const { sound } = await Audio.Sound.createAsync(soundObj.file);
    await sound.playAsync();
    await sound.unloadAsync();
  } catch (error) {
    console.warn(`Failed to play goat sound "${name}":`, error);
  }
}

export async function playRandomGoatSound() {
  const index = Math.floor(Math.random() * goatSounds.length);
  await playGoatSoundByIndex(index);
}

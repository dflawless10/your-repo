import { Audio } from 'expo-av';

type GoatSound = {
  name: string;
  file: any;
  description: string;
};

export const goatSounds: GoatSound[] = [
  {
    name: 'Stutter Baa',
    file: require('assets/sounds/bleat.mp3'),
    description: 'A quirky, stuttered bleat perfect for bid confirmations or goat popups.',
  },
  {
    name: 'Victory Baa',
    file: require('assets/sound/goat-victory-bah.wav'),
    description: 'Triumphant bleat for winning bids or successful actions.',
  },
  {
    name: 'Sneaky Snort',
    file: require('assets/sound/goat-stutter-baa.wav'),
    description: 'A mischievous snort for playful interactions or errors.',
  },
  {
    name: 'Goat Bells',
    file: require('assets/sounds/goatScream.mp3'),
    description: 'Magical chime for auction entry, gifting, or mascot mood toggles.',
  },
];

export async function playGoatSoundByIndex(index: number) {
  try {
    // Set audio mode for better compatibility
    if (__DEV__) {
  console.log(`🐐 Playing goat sound: ${goatSounds[index].name}`);
}

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,

    });
    
    const { sound } = await Audio.Sound.createAsync(
      goatSounds[index].file,
      { shouldPlay: true },
      null,
      true
    );
    
    // Auto-cleanup after 3 seconds
    setTimeout(async () => {
      try {
        await sound.unloadAsync();
      } catch (e) {
        // Silently handle
      }
    }, 3000);
  } catch (error) {
    // Silently fail - audio is non-critical
    if (__DEV__) {
      console.log(`🐐 Audio playback skipped for index ${index}`);
    }
  }
}

export async function playGoatSoundByName(name: string) {
  const soundObj = goatSounds.find((s) => s.name === name);
  if (!soundObj) {
    console.warn(`Goat sound "${name}" not found.`);
    return;
  }
  if (__DEV__) {
  console.log(`🐐 Playing goat sound by name: ${name}`);
}

  try {
    // Set audio mode for better compatibility
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    
    const { sound } = await Audio.Sound.createAsync(
      soundObj.file,
      { shouldPlay: true },
      null,
      true // Download first (helps with certain formats)
    );
    
    // Wait for sound to finish or timeout after 3 seconds
    setTimeout(async () => {
      try {
        await sound.unloadAsync();
      } catch (e) {
        // Silently handle unload errors
      }
    }, 3000);
  } catch (error) {
    // Silently fail - audio is non-critical feature
    // Only log in development
    if (__DEV__) {
      console.log(`🐐 Audio playback skipped for "${name}"`);
    }
  }
}

export async function playRandomGoatSound() {
  const index = Math.floor(Math.random() * goatSounds.length);
  await playGoatSoundByIndex(index);
}

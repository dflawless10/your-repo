export const MASCOT_MOODS = [
  "Cheerful",
  "Mischievous",
  "Majestic",
  "Brooding",
  "Sleepy",
  "Mystic",
  "Happy",
  "Loading",
  "Sad",
  "Celebrate",
  "Shimmer",
  "Excited",
  "Grumpy",
  "Goatified",
  "Curious",
  "Playful",
  "Chaotic",
  "Joyful"
] as const;

export type MascotMood = typeof MASCOT_MOODS[number];

export interface DisplayLore {
  mood: MascotMood;
  icon: string;
  description: string;
}



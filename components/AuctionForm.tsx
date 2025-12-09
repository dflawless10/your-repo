import React from 'react';
import { IsString } from '@/types/utils';
import MascotOverlay from '../app/components/MascotOverlay';
import axios from 'axios';
import { MascotMood as AppMascotMood } from '@/types/goatmoods';

import Constants from 'expo-constants';

export const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.API_URL ?? 'http://10.0.0.171:5000',
  timeout: 15000,
});


api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.log('Request:', error.config?.method?.toUpperCase(), error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('Error message:', error.message);
    return Promise.reject(error);
  }
);

// 🐐 Category Lore
type MascotMood = 'Excited' | 'Curious' | 'Mystic' | 'Playful';

interface CategoryLore {
  icon: string;
  mood: MascotMood;
  description: string;
}


const categoryMeta: Record<string, CategoryLore> = {
  auctions: {
    icon: '🔨',
    mood: 'Excited',
    description: 'Live auctions with bleats and sparkles',
  },
  shop: {
    icon: '🛍️',
    mood: 'Curious',
    description: 'Browse mystical goat wares',
  },
  contact: {
    icon: '📬',
    mood: 'Playful',
    description: 'Send a message to the barnyard',
  },
  search: {
    icon: '🔍',
    mood: 'Mystic',
    description: 'Seek and ye shall find',
  },
};

const moodMap: Record<MascotMood, AppMascotMood> = {
  Excited: 'Celebrate',
  Curious: 'Curious',
  Mystic: 'Chaotic',
  Playful: 'Celebrate',
};


// 🧩 Auction Metadata
interface AuctionMetadata {
  title: string;
  description: string;
  startingBid: number;
  tags: string[];
  createdAt: Date;
  sellerId: number;
  buyItNow?: { price: number; enabled: boolean; activatedAt?: Date };
  charity?: { organization: string; percentage: number; appliedAt?: Date };
}

// 🧪 Form Field Generator
type FormFields<T> = {
  [K in keyof T]: IsString<T[K]> extends true
    ? { type: 'text'; label: K }
    : T[K] extends number
    ? { type: 'number'; label: K }
    : T[K] extends string[]
    ? { type: 'tags'; label: K }
    : T[K] extends Date
    ? { type: 'date'; label: K }
    : { type: 'unknown'; label: K };
};



const auctionForm: FormFields<AuctionMetadata> = {
  title: { type: 'text', label: 'title' },
  description: { type: 'text', label: 'description' },
  startingBid: { type: 'number', label: 'startingBid' },
  tags: { type: 'tags', label: 'tags' },
  createdAt: { type: 'date', label: 'createdAt' },
  sellerId: { type: 'number', label: 'sellerId' },
};

// 🧾 Extended Form Fields
type AuctionFormFields = AuctionMetadata & {
  buyItNow?: { price: number; enabled: boolean; activatedAt?: Date };
  charity?: { organization: string; percentage: number; appliedAt?: Date };
  username?: string;
  categoryKey?: keyof typeof categoryMeta;
};

// 🕰️ Buy It Now Lock Logic
function isBuyItNowLocked(buyItNow?: AuctionFormFields['buyItNow']) {
  return (
    buyItNow?.activatedAt &&
    Date.now() > new Date(buyItNow.activatedAt).getTime() + 3600 * 1000
  );
}

import type { MascotMood as MascotMoodT } from '@/types/goatmoods';


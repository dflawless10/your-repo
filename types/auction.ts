import { DisplayItem } from './item';
import { MascotMood } from '@/types/goatmoods';

export type AuctionPreview = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  image?: string;
  auction_ends_at: string; // ✅ Canonical field
  end_time: string;
  item?: DisplayItem;
  rarity?: 'common' | 'rare' | 'legendary';
};

export type Auction = {
  id: string;
  title: string;
  price: number;
  currentBid: number;
  auction_ends_at: string; // ✅ Canonical field
  end_time?: string;
  DisplayItem?: string;
  views: number;
  imageUrl: string;
  description: string;
};

export type AuctionMetadata = {
  title: string;
  description: string;
  startingBid: number;
  auction_ends_at: string; // ✅ Canonical field
  end_time?: Date;
  DisplayItem: string;
  tags: string[];
  createdAt: Date;
  sellerId: number;
  username: string;
};

export interface AuctionFormFields {
  title: string;
  description: string;
  startingBid: number;
  tags: string[];
  createdAt: Date;
  auction_ends_at: string; // ✅ Canonical field
  end_time?: Date;
  sellerId: string | number;
  buyItNow?: {
    price: number;
    enabled: boolean;
    activatedAt?: Date;
  };
  charity?: {
    organization: string;
    percentage: number;
  };
}

export type AuctionLore = {
  mood: MascotMood;
  whisper: string;
  sparkleLevel: number;
  triggeredBy: 'validation' | 'bid' | 'wishlist' | 'onboarding';
  icon?: string;
};

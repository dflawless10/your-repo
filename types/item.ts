export type DisplayItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  rarity?: 'common' | 'rare' | 'legendary';
  end_time: string;
  auction_ends_at: string;
};

export type AuctionPreview = {
  id: string;
  end_time: string;
  auction_ends_at: string; // ✅ Canonical field
  title: string;
  price: number;
  item?: DisplayItem;
  rarity?: 'common' | 'rare' | 'legendary';
};

export const getRarityBadge = (rarity?: DisplayItem['rarity']) => {
  switch (rarity) {
    case 'legendary':
      return '💎 Legendary Sparkle';
    case 'rare':
      return '✨ Rare Shine';
    case 'common':
      return '🌾 Common Charm';
    default:
      return '❔ Unknown Rarity';
  }
};
export interface JustListed {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  // Add this line 👇
 auction_ends_at: string;
}

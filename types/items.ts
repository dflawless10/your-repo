import React from "react";

export type AuctionItem = {
  timeLeft: React.ReactNode | undefined;
  id: number | string;
  item_id: number;
  Item: number;
  name?: string;
  description?: string;
   auction_id: number;
    AuctionId: number;
    Auction_id: number;
    AuctionItem: {
    id: number;
    auction_id: number;
    AuctionId: number;
    Auction_id: number;
    AuctionItem: {}
  };
    seller?: {
  id: number;
  itemDetails: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  avg_rating?: number;
  total_reviews: number;
  retingText: string;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  // ...other fields
};

  current_bid: number;
  category_id: number;
  category: string;
  end_time: string;
  registration_time: string;
  auction_ends_at: string;
  rarity?: string;
  bidCount: number;
  quantity_available: number;
  price: number;
  photo_url?: string;
  image_url: string;
  ItemDetails: string;
  must_sell_start: string;
  animates?: string;
  tags?: string;
  isVisible?: boolean;
  DisplayItem?: string;
  listed_at: string;
  title: string;
  image: string;
  isWatched: boolean;
  WishlistItem?: boolean;
  gem: string;
  carat: number;
  color: string;
  size: '',
condition: '',
origin: '',
certification: '',
material: '',
  is_trending: boolean;
  reserve_price: number;
  final_price: number;
  original_price?: number;
  is_sold: number | boolean;
  sold_to: string | number;
  status?: string; // 'active', 'sold', 'deleted', 'closed'
  is_must_sell?: number | boolean;
  must_sell_duration?: number;
  selling_strategy?: string; // 'auction', 'relist', 'relisted_discount', 'buy_it_now', 'must_sell'
  total_reviews: string;
  buy_it_now?: number;
  isFavorite: boolean;
  mascot_name?: string;
  MASCOT_MOODS?: string;
  mascot?: {
    emoji: string;
    sound?: string;
  };
  reminder_active?: boolean;
  price_alert_active?: boolean;
};


export type Rarity = 'common' | 'rare' | 'legendary';

export type ListedItem = {
  // Core required fields
  id: number;
  name: string;
  price: number;
  photo_url: string;
  listed_at: string;

  // Optional legacy/duplicate IDs
  auction_id?: number;
  AuctionId?: number;
  Auction_id?: number;
  item_id?: number;
  Item?: number;

  // Content fields
  description?: string;
  quantity_available?: number;
  watchers?: string;
  discount_pct?: number;
  status?: "active" | "sold" | "closed" | "deleted";
  mustSell?: number | boolean;
  is_must_sell?: number | boolean;
  selling_strategy?: string;
  is_super_deal?: boolean;
  isJustListed?: boolean;
  highest_bid?: number;
  isWishlisted?: string;
  Watchers?: string;
  seller_username?: string;
  sold_at?: string;
  category?: string;
  image_url?: string;
  image?: string;
  tags?: string;
  total_reviews?: number;
  listedAt?: string; // Backend sometimes sends camelCase
  relisted_at?: string;
  original_price?: number;
  current_bid?: number;
  category_id?: number;
  ItemDetails?: string;
  must_sell_start?: string;
  title?: string;
  isWatched?: string;
  gem?: string;
  carat?: string;
  color?: string;
  size?: string;
  condition?: string;
  origin?: string;
  certification?: string;
  material?: string;
  isFavorite?: boolean;
  relist_count?: number;
  preview?: boolean;
  registration_time?: string;
  countdown?: string;
  end_time?: string;
  AuctionItem?: {
    id: number;
  };
  formatAuctionEnd?: string;
  auction_ends_at?: string;
  watching_count?: number;
  bid_count?: number;
  bidCount?: number;
  wishlistItem?: boolean;
  timeLeft?: string;
  rarity?: 'common' | 'rare' | 'legendary';
  animate?: string;
  buy_it_now?: number;
  seller?: {
    name: string;
    avatar_url: string;
    id: number | string;
    ItemDetails?: string;
    username: string;
    firstname?: string;
    lastname?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone_number?: number;
    jewelryBox?: {};
    joined?: string;
    avg_rating?: number;
    total_reviews?: number;
    ratingText?: string;
  };
  is_trending?: boolean;
  reserve_price?: number;
  final_price?: number;
  is_sold?: boolean;
  sold_to?: string;
  getCountdown?: () => { timeText: string; isUrgent: boolean };
  item?: ListedItem;
  isFavorited?: boolean;
  toggleFavorite?: (id: number) => void;
  onAddToCart?: (item: ListedItem) => void;
};

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  isWishlisted?: boolean;
  preparer?: string;
};


export type ItemDetails = {
  id: number;
  name: string;
  description?: string;
  price: number;
  highest_bid?: number;
  reserve_price?: number;
  has_reserve?: boolean;
  buy_it_now?: number;
  must_sell_duration?: number;
  seller_username: string;
  additional_photos?: string[];
  category?: string;
  tags?: string;
  photo_url?: string;
  listedAt?: string;
  listed_at: string;
  recent_bids?: {
    id: string;
    amount: number;
    user_id: number;
    timestamp: string;
  }[];
  is_highest_bidder?: number;
  is_favorited?: boolean;
  type?: string;
  item_media?: string[];
  rarity?: string;
  auction_ends_at?: string;
  weight_lbs?: number;
  watching_count?: number;
  bid_count?: number;
  min_next_bid?: number;
  relist_count?: number;
  watch_specifications?: string;
  seller?: {
    id?: number;
    email?: string;
    username: string;
    items_sold: number;
    joined: string;
    is_premium?: boolean;
    rating?: {
      avg_rating: number;
      review_count: number;
      positive_percent: number;
    };
  };
};


// types/items.ts
export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  photo_url: string;   // ✅ required for UI
  startingPrice?: number;
}

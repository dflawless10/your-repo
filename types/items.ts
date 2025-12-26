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
  buy_it_now?: number;

  isFavorite: boolean;
  mascot_name?: string;
  MASCOT_MOODS?: string;
  mascot?: {
    emoji: string;
    sound?: string;
  };
};


export type Rarity = 'common' | 'rare' | 'legendary';

export type ListedItem = {
  id: number;
  item_id: number;
  Item: number;
  name: string;
  description: string;
  quantity_available: number;
  watchers: string;
  price: number;
  discount_pct?: number;
    status?: "active" | "sold" | "closed" | "deleted"; // ✅ strict union type
  mustSell: string;
  selling_strategy?: string;
  is_super_deal: boolean;
  highest_bid?: number; // Current highest bid amount
  photo_url: string;
  isWishlisted: string;
  Watchers?: string;
  seller_username: string;
  category: string;
  image_url: string;
  image: string;
  tags: string;
  listed_at: string;
  listedAt?: string; // Backend sometimes sends camelCase
  relisted_at?:  string;
  original_price?: number;
  relist_count?: number;
  preview: boolean;
  registration_time: string;
  end_time?: string;
    auction_id: number;
    AuctionId: number;
    Auction_id: number;
    AuctionItem: {
      id: number;
    }
  formatAuctionEnd?: string
  auction_ends_at: string;
    watching_count?: number;
  bid_count?: number; // <- make optional to match SparkleItemCard
  bidCount: number;
wishlistItem?: boolean;
  timeLeft: string;
  rarity?: 'common' | 'rare' | 'legendary';
  animate?: string;
  buy_it_now?: number;
  seller: {
    name: string;
    avatar: string;
    id: number;
    ItemDetails: string;
    username: string;
    firstname: string;
    lastname: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    jewelryBox?: {};
    joined?: string;
    avg_rating?: number;
  };
  is_trending: boolean;
  reserve_price: number;
  final_price: number;
  is_sold: boolean;
  sold_to: string;
   getCountdown: () => { timeText: string; isUrgent: boolean };
    item: ListedItem;
  isFavorited: boolean;
  toggleFavorite: (id: number) => void;
  onAddToCart?: (item: ListedItem) => void; // add


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

// utils/persistWishlist.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuctionItem } from '@/types/items';

const WISHLIST_KEY = 'wishlist_items';

// Save wishlist items
export async function persistWishlist(items: AuctionItem[]): Promise<void> {
  try {
    const json = JSON.stringify(items);
    await AsyncStorage.setItem(WISHLIST_KEY, json);
  } catch (e) {
    console.error('Failed to persist wishlist', e);
  }
}

// Load wishlist items
export async function loadWishlist(): Promise<AuctionItem[]> {
  try {
    const json = await AsyncStorage.getItem(WISHLIST_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    // Basic validation
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load wishlist', e);
    return [];
  }
}

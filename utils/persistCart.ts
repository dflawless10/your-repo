// utils/persistCart.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from './cartSlice';

const CART_KEY = 'cart_items';

// Save cart items
export async function persistCart(items: CartItem[]): Promise<void> {
  try {
    const json = JSON.stringify(items);
    await AsyncStorage.setItem(CART_KEY, json);
  } catch (e) {
    console.error('Failed to persist cart', e);
  }
}

// Load cart items
export async function loadCart(): Promise<CartItem[]> {
  try {
    const json = await AsyncStorage.getItem(CART_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load cart', e);
    return [];
  }
}

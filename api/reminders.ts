import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

export interface WishlistEventSettings {
  must_sell: boolean;
  discounted: boolean;
  relisted: boolean;
  threshold: boolean;
}

export interface WishlistReminderResponse {
  events: WishlistEventSettings | null;
  price_threshold: number | null;
  notified: {
    must_sell: boolean;
    discounted: boolean;
    relisted: boolean;
    threshold: boolean;
  } | null;
}

export interface SetReminderResult {
  success: boolean;
  message: string;
  item_name?: string;
}

export const getAuctionReminders = async (itemId: number): Promise<WishlistReminderResponse> => {
  const empty: WishlistReminderResponse = { events: null, price_threshold: null, notified: null };
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return empty;

    const response = await fetch(`${API_BASE_URL}/api/wishlist/${itemId}/reminder`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) return empty;
    return await response.json();
  } catch {
    return empty;
  }
};

export const setAuctionReminders = async (
  itemId: number,
  events: WishlistEventSettings,
  priceThreshold?: number | null
): Promise<SetReminderResult> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return { success: false, message: 'Not authenticated' };

    const response = await fetch(`${API_BASE_URL}/api/wishlist/${itemId}/reminder`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, price_threshold: priceThreshold ?? null }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, message: err.error || 'Failed to set reminders' };
    }

    const data = await response.json();
    return { success: true, message: data.message, item_name: data.item_name };
  } catch {
    return { success: false, message: 'Network error' };
  }
};

export const deleteAuctionReminders = async (itemId: number): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;
    await fetch(`${API_BASE_URL}/api/wishlist/${itemId}/reminder`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
};

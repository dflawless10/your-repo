import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

const API_URL = API_BASE_URL;

export interface ConvertToBuyNowRequest {
  buy_it_now_price: number;
}

export interface ConvertToBuyNowResponse {
  message: string;
  item_id: number;
  buy_it_now_price: number;
  previous_highest_bid: number;
}

/**
 * Convert a failed auction to a Buy It's Now listing
 * @param itemId - The item ID to convert
 * @param buyItNowPrice - New Buy It Now prices
 * @returns Success response with conversion details or null on error
 */
export const convertToBuyNow = async (
  itemId: number | string,
  buyItNowPrice: number
): Promise<ConvertToBuyNowResponse | null> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    const response = await fetch(`${API_URL}/api/items/${itemId}/convert-to-buy-now`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buy_it_now_price: buyItNowPrice,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Convert to Buy It Now failed:', errorData.error || response.statusText);
      throw new Error(errorData.error || 'Failed to convert to Buy It Now');
    }

    return await response.json();
  } catch (error) {
    console.error('Error converting to Buy It Now:', error);
    return null;
  }
};

/**
 * Check if an item is eligible for conversion to Buy It Now
 * @param item - Auction item to check
 * @returns true if item can be converted
 */
export const canConvertToBuyNow = (item: {
  status?: string;
  endDate?: string;
  hasBids?: boolean;
  bidCount?: number;
}): boolean => {
  // Item must have ended
  const hasEnded = item.endDate ? new Date(item.endDate) <= new Date() : false;
  if (!hasEnded) return false;

  // Item must not be sold
  if (item.status === 'sold') return false;

  // Can convert failed auctions (no bids or didn't meet reserve)
  return true;
};

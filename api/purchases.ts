import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.0.170:5000';

export interface PurchasedItem {
  id: number;
  name: string;
  description: string;
  category: number;
  original_price: number;
  purchase_price: number;
  tags: string;
  rarity: string;
  photo_url: string;
  purchase_date: string;
  order_status: string;
  ownership_confirmed?: boolean;
  seller: {
    username: string;
    avatar_url: string | null;
    joined: string;
  } | null;
}

export interface CollectionStats {
  total_items: number;
  total_value: number;
  avg_item_value: number;
}

export interface MyPurchasesResponse {
  items: PurchasedItem[];
  stats: CollectionStats;
  message: string;
}

/**
 * Get user's purchase history and collection statistics
 */
export const getMyPurchases = async (): Promise<MyPurchasesResponse | null> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');

    if (!token) {
      console.warn('No authentication token found');
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/my-purchases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Unauthorized - token may be expired');
        return null;
      }
      throw new Error(`Failed to fetch purchases: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching my purchases:', error);
    return null;
  }
};

/**
 * Helper function to format purchase date
 */
export const formatPurchaseDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Helper function to get rarity color
 */
export const getRarityColor = (rarity: string): string => {
  const rarityColors: Record<string, string> = {
    common: '#9E9E9E',
    uncommon: '#4CAF50',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800',
  };
  return rarityColors[rarity.toLowerCase()] || rarityColors.common;
};

/**
 * Helper function to get order status color
 */
export const getOrderStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    completed: '#4CAF50',
    pending: '#FF9800',
    shipped: '#2196F3',
    delivered: '#4CAF50',
    cancelled: '#F44336',
  };
  return statusColors[status.toLowerCase()] || '#9E9E9E';
};

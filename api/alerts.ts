// api/alerts.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

export type AlertType = 'price_drop' | 'auction_ending' | 'new_bid' | 'outbid' | 'item_sold' | 'new_listing';

export interface AlertRegistration {
  item_id: number;
  type: AlertType;
  threshold?: number; // Optional: For price_drop alerts (in dollars)
}

export interface AlertResponse {
  message: string;
}

/**
 * Register an alert for an item
 * Alert types:
 * - price_drop: Notify when item price drops (requires threshold)
 * - auction_ending: Notify when auction is about to end
 * - new_bid: Notify when someone places a bid
 * - outbid: Notify when user gets outbid
 * - item_sold: Notify when item sells
 * - new_listing: Notify when seller lists new item
 */
export const registerAlert = async (
  itemId: number,
  alertType: AlertType,
  threshold?: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    // Validate threshold for price_drop
    if (alertType === 'price_drop' && !threshold) {
      return {
        success: false,
        message: 'Price drop alerts require a threshold value'
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_id: itemId,
        type: alertType,
        threshold: threshold,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.error || 'Failed to register alert',
      };
    }

    const data: AlertResponse = await response.json();
    return {
      success: true,
      message: data.message || 'Alert registered successfully',
    };
  } catch (error) {
    console.error('Error registering alert:', error);
    return {
      success: false,
      message: 'Network error occurred',
    };
  }
};

/**
 * Get human-readable description for alert type
 */
export const getAlertDescription = (alertType: AlertType): string => {
  const descriptions: Record<AlertType, string> = {
    price_drop: 'Notify me when the price drops',
    auction_ending: 'Notify me when auction is about to end',
    new_bid: 'Notify me when someone places a bid',
    outbid: 'Notify me if I get outbid',
    item_sold: 'Notify me when this item sells',
    new_listing: 'Notify me when seller lists new items',
  };
  return descriptions[alertType] || 'Set up notification';
};

/**
 * Get icon name for alert type
 */
export const getAlertIcon = (alertType: AlertType): string => {
  const icons: Record<AlertType, string> = {
    price_drop: 'trending-down',
    auction_ending: 'time',
    new_bid: 'pricetag',
    outbid: 'alert-circle',
    item_sold: 'checkmark-circle',
    new_listing: 'add-circle',
  };
  return icons[alertType] || 'notifications';
};

/**
 * Get available alert types for an item
 */
export const getAvailableAlertTypes = (
  isAuction: boolean,
  isSeller: boolean
): AlertType[] => {
  const alerts: AlertType[] = [];

  if (isAuction) {
    alerts.push('auction_ending');
    if (!isSeller) {
      alerts.push('outbid');
      alerts.push('new_bid');
    }
  } else {
    alerts.push('price_drop');
  }

  if (!isSeller) {
    alerts.push('item_sold');
  }

  return alerts;
};

// api/reminders.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

export interface ReminderSetting {
  minutes_before: number;
  sent: boolean;
}

export interface RemindersResponse {
  reminders: ReminderSetting[];
}

/**
 * Get existing reminder settings for an auction item
 */
export const getAuctionReminders = async (itemId: number): Promise<ReminderSetting[]> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      console.warn('No JWT token found');
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/api/wishlist/${itemId}/reminder`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch reminders:', response.status);
      return [];
    }

    const data: RemindersResponse = await response.json();
    return data.reminders || [];
  } catch (error) {
    console.error('Error fetching auction reminders:', error);
    return [];
  }
};

/**
 * Set reminder notifications for auction ending times
 */
export const setAuctionReminders = async (
  itemId: number,
  reminderTimes: number[]
): Promise<{ success: boolean; message: string; item_name?: string }> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/wishlist/${itemId}/reminder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reminder_times: reminderTimes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Failed to set reminders' };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Reminders set successfully',
      item_name: data.item_name,
    };
  } catch (error) {
    console.error('Error setting auction reminders:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

/**
 * Format reminder time for display
 */
export const formatReminderTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Get common reminder options
 */
export const getCommonReminderOptions = (): number[] => {
  return [5, 15, 30, 60, 120, 360, 1440]; // 5min, 15min, 30min, 1h, 2h, 6h, 1day
};

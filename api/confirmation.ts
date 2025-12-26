// api/confirmation.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

export interface ConfirmOwnershipPayload {
  item_id: number;
  hash_code: string;
  timestamp: string;
}

export interface ConfirmOwnershipResponse {
  success: boolean;
  message: string;
  verified?: boolean;
}

/**
 * Generate a simple hash code for ownership verification
 * In production, this should be a more secure cryptographic hash
 */
export const generateHashCode = (itemId: number, userId: number): string => {
  const timestamp = Date.now().toString();
  const combined = `${itemId}-${userId}-${timestamp}`;

  // Simple hash function (in production, use a crypto library)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.codePointAt(i) || 0;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
};

/**
 * Confirm ownership of a purchased item
 */
export const confirmOwnership = async (
  itemId: number,
  hashCode: string
): Promise<ConfirmOwnershipResponse | null> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');

    if (!token) {
      console.warn('No JWT token found');
      return null;
    }

    const timestamp = new Date().toISOString();

    const payload: ConfirmOwnershipPayload = {
      item_id: itemId,
      hash_code: hashCode,
      timestamp,
    };

    const response = await fetch(`${API_BASE_URL}/api/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Confirmation failed:', errorData);
      return {
        success: false,
        message: errorData.error || 'Failed to confirm ownership',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Ownership confirmed successfully',
      verified: data.verified,
    };
  } catch (error) {
    console.error('Error confirming ownership:', error);
    return {
      success: false,
      message: 'Network error occurred',
    };
  }
};

/**
 * Format timestamp for display
 */
export const formatConfirmationTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

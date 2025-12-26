// api/admin.ts
import { API_BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CleanupResult {
  status: string;
  deleted_items: number;
  deleted_files: string[];
  failed_files: string[];
}

export interface AnalyticsEvent {
  id: number;
  event_type: string;
  item_id?: number;
  filename?: string;
  status: string;
  notes: string;
  user_triggered_by: string;
  ip_address: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  event_counts: [string, number][];
  mascot_reactions: AnalyticsEvent[];
  status_counts: [string, number][];
}

/**
 * Cleanup expired auction items and their images
 * Requires admin authentication
 */
export const cleanupExpiredItems = async (): Promise<CleanupResult> => {
  const token = await AsyncStorage.getItem('jwtToken');
  const username = await AsyncStorage.getItem('username') || 'unknown';

  const response = await fetch(`${API_BASE_URL}/api/cleanup_expired_items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Admin-User': username,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to cleanup expired items');
  }

  return await response.json();
};

/**
 * Get recent analytics events (last 50)
 */
export const getAnalyticsEvents = async (): Promise<AnalyticsEvent[]> => {
  const token = await AsyncStorage.getItem('jwtToken');

  const response = await fetch(`${API_BASE_URL}/api/analytics/events`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics events');
  }

  return await response.json();
};

/**
 * Get analytics summary with event counts and mascot reactions
 */
export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const token = await AsyncStorage.getItem('jwtToken');

  const response = await fetch(`${API_BASE_URL}/api/analytics/summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics summary');
  }

  return await response.json();
};

/**
 * Get shop items with category filtering
 */
export const getShopItems = async (
  categoryPath?: string,
  tag?: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> => {
  const params = new URLSearchParams();
  if (categoryPath) params.append('path', categoryPath);
  if (tag) params.append('tag', tag);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/shop-items?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shop items');
  }

  return await response.json();
};

/**
 * Get auction details by item ID
 */
export const getAuction = async (itemId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/auction/${itemId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch auction');
  }

  return await response.json();
};

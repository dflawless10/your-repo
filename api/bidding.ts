import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.0.170:5000';

export interface TopBid {
  rank: number;
  user_id: number;
  amount: number;
  timestamp: string;
}

export interface RecentBid {
  user_id: number;
  username: string;
  amount: number;
  timestamp: string;
}

export interface HighestBidResponse {
  highest_bid: number;
}

export interface RecentBidsResponse {
  recent_bids: RecentBid[];
}

/**
 * Get top 3 bids for an item (ranked by amount)
 */
export const getTopBids = async (itemId: number): Promise<TopBid[]> => {
  const response = await fetch(`${API_BASE_URL}/item/${itemId}/top-bids`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch top bids: ${response.status}`);
  }

  return await response.json();
};

/**
 * Get recent 10 bids for an item (chronologically ordered)
 */
export const getRecentBids = async (itemId: number): Promise<RecentBid[]> => {
  const response = await fetch(`${API_BASE_URL}/item/${itemId}/recent-bids`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Item not found');
    }
    throw new Error(`Failed to fetch recent bids: ${response.status}`);
  }

  const data: RecentBidsResponse = await response.json();
  return data.recent_bids;
};

/**
 * Get the current highest bid amount for an item
 */
export const getHighestBid = async (itemId: number): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/item/${itemId}/highest-bid`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Item not found');
    }
    throw new Error(`Failed to fetch highest bid: ${response.status}`);
  }

  const data: HighestBidResponse = await response.json();
  return data.highest_bid;
};

/**
 * Submit a sealed bid (alternative to /item/<id>/bid endpoint)
 */
export const submitSealedBid = async (
  itemId: number,
  userId: number,
  bidAmount: number
): Promise<{ status: string }> => {
  const response = await fetch(`${API_BASE_URL}/submit_bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: itemId,
      user_id: userId,
      bid_amount: bidAmount,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to submit bid: ${response.status}`);
  }

  return await response.json();
};

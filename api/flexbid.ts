import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.0.170:5000';

export interface FlexBidAuction {
  id: number;
  title: string;
  photo_url: string | null;
  description: string;
  minimum_price: number;
  soft_floor_price: number | null;
  auction_ends_at: string;
  bid_count: number;
  is_active: boolean;
}

export interface CreateFlexBidRequest {
  item_title: string;
  description: string;
  photo_url?: string;
  minimum_price: number;
  soft_floor_price?: number;
  auction_ends_at: string;
  seller_id: number;
}

export interface CreateFlexBidResponse {
  message: string;
  auction_id: number;
}

/**
 * Create a new FlexBid sealed reserve auction
 */
export const createFlexBid = async (
  data: CreateFlexBidRequest
): Promise<CreateFlexBidResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flex_bid_sealed_reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create FlexBid: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating FlexBid:', error);
    throw error;
  }
};

/**
 * Get all FlexBid auctions for the current seller
 */
export const getSellerFlexBids = async (): Promise<FlexBidAuction[]> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/seller/flex_bids`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch FlexBid auctions: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching seller FlexBids:', error);
    throw error;
  }
};

/**
 * Helper function to format auction end date for API
 */
export const formatAuctionEndDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Helper function to calculate auction end time from duration
 */
export const calculateAuctionEndTime = (durationHours: number): string => {
  const endTime = new Date();
  endTime.setHours(endTime.getHours() + durationHours);
  return formatAuctionEndDate(endTime);
};

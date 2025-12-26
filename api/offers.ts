import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.0.170:5000';

export interface Offer {
  id: number;
  item_id: number;
  buyer_id?: number;
  seller_id?: number;
  offer_amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  item_name: string;
  photo_url: string;
  buyer_username?: string;
  seller_username?: string;
}

export interface CreateOfferRequest {
  item_id: number;
  offer_amount: number;
  message?: string;
}

export interface CreateOfferResponse {
  success: boolean;
  offer_id: number;
  message: string;
  offer: {
    id: number;
    item_id: number;
    item_name: string;
    offer_amount: number;
    status: string;
    expires_at: string;
  };
}

/**
 * Create an offer on an expired/unsold item
 */
export const createOffer = async (data: CreateOfferRequest): Promise<CreateOfferResponse | null> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    const response = await fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create offer');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating offer:', error);
    return null;
  }
};

/**
 * Get offers received by seller
 */
export const getReceivedOffers = async (): Promise<Offer[] | null> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    const response = await fetch(`${API_URL}/api/offers/received`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch received offers');
    }

    const data = await response.json();
    return data.offers;
  } catch (error) {
    console.error('Error fetching received offers:', error);
    return null;
  }
};

/**
 * Get offers sent by buyer
 */
export const getSentOffers = async (): Promise<Offer[] | null> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    const response = await fetch(`${API_URL}/api/offers/sent`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sent offers');
    }

    const data = await response.json();
    return data.offers;
  } catch (error) {
    console.error('Error fetching sent offers:', error);
    return null;
  }
};

/**
 * Accept an offer (seller)
 */
export const acceptOffer = async (offerId: number): Promise<{ success: boolean; order_id?: number; error?: string }> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_URL}/api/offers/${offerId}/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to accept offer' };
    }

    return { success: true, order_id: data.order_id };
  } catch (error) {
    console.error('Error accepting offer:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Decline an offer (seller)
 */
export const declineOffer = async (offerId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_URL}/api/offers/${offerId}/decline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to decline offer' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error declining offer:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Format time remaining until offer expires
 */
export const getOfferTimeRemaining = (expiresAt: string): string => {
  const expires = new Date(expiresAt);
  const now = new Date();
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};

/**
 * Get offer status color
 */
export const getOfferStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#FF9800';
    case 'accepted':
      return '#4CAF50';
    case 'declined':
      return '#F44336';
    case 'expired':
      return '#9E9E9E';
    default:
      return '#757575';
  }
};

/**
 * Get offer status label
 */
export const getOfferStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return '⏳ Pending';
    case 'accepted':
      return '✅ Accepted';
    case 'declined':
      return '❌ Declined';
    case 'expired':
      return '⏰ Expired';
    default:
      return status;
  }
};

// api/revenue.ts
import { API_BASE_URL } from '@/config';

export interface ShippingCalculation {
  status: string;
  weight_lbs: number;
  shipping_cost: number;
}

export interface SellerPayoutBreakdown {
  sale_price: number;
  commission_fee: number;
  payment_processing_fee: number;
  total_bidgoat_fee: number;
  seller_payout: number;
  commission_rate: number;
  is_premium: boolean;
}

export interface SellerPayoutResponse {
  status: string;
  breakdown: SellerPayoutBreakdown;
}

export interface BuyerTotalBreakdown {
  item_price: number;
  shipping_cost: number;
  insurance_cost: number;
  total: number;
  weight_lbs: number;
  insurance_included: boolean;
}

export interface BuyerTotalResponse {
  status: string;
  breakdown: BuyerTotalBreakdown;
}

export interface PremiumPricing {
  subscription: {
    premium_seller_monthly: number;
    benefits: string[];
  };
  listing_features: {
    featured_listing: {
      cost: number;
      description: string;
    };
    reserve_price: {
      cost: number;
      description: string;
    };
  };
  shipping_rates: {
    small: string;
    medium: string;
    large: string;
    oversized: string;
  };
  insurance_tiers: {
    range: string;
    cost: string;
  }[];
}

/**
 * Calculate shipping cost based on weight
 */
export const calculateShipping = async (weightLbs: number): Promise<ShippingCalculation> => {
  const response = await fetch(`${API_BASE_URL}/api/calculate-shipping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      weight_lbs: weightLbs,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate shipping');
  }

  return await response.json();
};

/**
 * Calculate seller payout after BidGoat fees
 */
export const calculateSellerPayout = async (
  salePrice: number,
  isPremiumSeller: boolean = false
): Promise<SellerPayoutResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/calculate-seller-payout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sale_price: salePrice,
      is_premium_seller: isPremiumSeller,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate seller payout');
  }

  return await response.json();
};

/**
 * Calculate total buyer cost including shipping and insurance
 */
export const calculateBuyerTotal = async (
  itemId: number,
  includeInsurance: boolean = false
): Promise<BuyerTotalResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/calculate-buyer-total`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: itemId,
      include_insurance: includeInsurance,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate buyer total');
  }

  return await response.json();
};

/**
 * Get premium pricing information
 */
export const getPremiumPricing = async (): Promise<PremiumPricing> => {
  const response = await fetch(`${API_BASE_URL}/api/premium-features/pricing`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch premium pricing');
  }

  return await response.json();
};

/**
 * Sync a single item to Elasticsearch
 */
export const syncItemToElasticsearch = async (itemId: number): Promise<{ status: string }> => {
  const response = await fetch(`${API_BASE_URL}/sync-item/${itemId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to sync item to Elasticsearch');
  }

  return await response.json();
};

/**
 * Sync all items to Elasticsearch
 */
export const syncAllItemsToElasticsearch = async (): Promise<{
  status: string;
  synced: number;
  total: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/sync-all-items-to-es`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to sync all items to Elasticsearch');
  }

  return await response.json();
};

// api/appraisal.ts
import { API_BASE_URL } from '@/config';

export interface DiamondAppraisalRequest {
  carat: number;
  color: string;
  clarity: string;
  shape: string;
  certified: string;
}

export interface DiamondAppraisalResponse {
  carat: number;
  color: string;
  clarity: string;
  shape: string;
  certified: string;
  suggested_price: number;
}

/**
 * Get diamond appraisal from backend
 * Ensures consistent pricing logic between frontend and backend
 */
export const appraiseDiamond = async (
  request: DiamondAppraisalRequest
): Promise<DiamondAppraisalResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/diamondappraisalscreen/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Diamond appraisal error:', errorData);
      return null;
    }

    const data: DiamondAppraisalResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling diamond appraisal API:', error);
    return null;
  }
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

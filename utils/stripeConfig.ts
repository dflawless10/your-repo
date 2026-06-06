// utils/stripeConfig.ts
import { API_BASE_URL } from '@/config';

/**
 * Fetch Stripe publishable key from backend
 */
export async function fetchStripePublishableKey(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/config`);
    const data = await response.json();
    return data.publishableKey;
  } catch (error) {
    console.error('Failed to fetch Stripe publishable key:', error);
    // Fallback to hardcoded key for development (not recommended for production)
    return 'pk_test_51SUdsbCHq9GQl4oiKinO6o2otk141ECN1qfYBMV25o2SvI4GR4nnUrWO50Qf7rZX0V5VSkuY6cibpZW5cWO7J6Fa00EpJW0DnD';
  }
}

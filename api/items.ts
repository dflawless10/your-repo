// api/items.ts
import { API_BASE_URL } from '@/config';
import { AuctionItem } from '@/types/items';

export const getTrendingItems = async (): Promise<AuctionItem[]> => {
  const res = await fetch(`${API_BASE_URL}/api/items/trending`);
  if (!res.ok) throw new Error('Failed to fetch trending items');
  const data = await res.json();
  return data.items;
};

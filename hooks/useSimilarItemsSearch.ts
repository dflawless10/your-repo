import { useEffect, useState } from 'react';
import { performSearch, SearchParams } from '@/utils/searchUtils';
import { AuctionItem } from 'types/items';
import {API_URL} from "@/constants/api";


export function useSimilarItemsSearch(currentItem: AuctionItem | null) {
  const [similarItems, setSimilarItems] = useState<AuctionItem[]>([]);
  const [facets, setFacets] = useState({});
  const [loading, setLoading] = useState(false);
  const [ItemDetails, setItemDetails] = useState<any[]>([])


  type ItemDetails = {
  id: number;
  name: string;
  description?: string;
  price: number;
  highest_bid?: number;
  reserve_price?: number;
  buy_it_now?: number;
  must_sell_duration?: number;
  additional_photos?: string[];
  category?: string;
  tags?: string;
  photo_url?: string;
  listed_at: string;
  recent_bids?: {
    id: string;
    amount: number;
    user_id: number;
    timestamp: string;
  }[];
  is_highest_bidder?: number;
  type?: string;
  item_media?: string[];
  rarity?: string;
  auction_ends_at?: string;
  weight_lbs?: number;
  seller?: {
    id?: number;
    email?: string;
    username: string;
    items_sold: number;
    joined: string;
    is_premium?: boolean;
  };
};

  useEffect(() => {
    if (!currentItem) return;

    const filters = {
      categories: [currentItem.category_id.toString()],
      priceRange: {
        min: Number(currentItem.price) * 0.8,
        max: Number(currentItem.price) * 1.2,
      },
      condition: currentItem.condition ? [currentItem.condition] : [],
    };

    const params: SearchParams = {
      filters,
      facets: ['categories', 'price_ranges', 'materials', 'conditions'],
      limit: 10,
    };

    setLoading(true);
    performSearch(params)
      .then((res) => {
        setSimilarItems(res.items.filter((i: AuctionItem) => i.id !== currentItem.id));
        setFacets(res.facets);
      })
      .catch((err) => console.error('Similar items search failed:', err))
      .finally(() => setLoading(false));
  }, [currentItem]);

   function useSimilarItemsSearch(currentItem: ItemDetails | null) {
    const [similarItems, setSimilarItems] = useState<AuctionItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!currentItem?.category) return;

      const fetchSimilar = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_URL}/items/discover`);
          const allItems = await res.json();
          const filtered = allItems
            .filter((i: any) => i.category === currentItem.category && i.id !== currentItem.id)
            .slice(0, 5)
            .map((i: any) => ({
              id: i.id,
              title: i.name || i.title,
              description: i.description || '',
              image: i.photo_url,
              price: i.price || 0,
              mascot: {emoji: '🐐'},
              isFavorite: false,
            }));
          setSimilarItems(filtered);
        } catch (err) {
          console.error('Failed to fetch similar items:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchSimilar();
    }, [currentItem]);

  }

  return {similarItems, facets, loading}
}

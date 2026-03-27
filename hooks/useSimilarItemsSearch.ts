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
    if (!currentItem?.id) return;

    const fetchSimilar = async () => {
      setLoading(true);
      try {
        // Use the dedicated similar items endpoint
        const res = await fetch(`${API_URL}/items/${currentItem.id}/similar`);
        const similarItemsData = await res.json();

        // Filter for approved items only (backend should already do this, but double-check)
        const approvedItems = similarItemsData.filter((i: any) =>
          i.moderation_status === 'approved'
        );

        setSimilarItems(approvedItems);
      } catch (err) {
        console.error('Failed to fetch similar items from /similar endpoint:', err);

        // Fallback to discover endpoint
        try {
          const res = await fetch(`${API_URL}/items/discover`);
          const allItems = await res.json();
          const filtered = allItems
            .filter((i: any) =>
              i.category === currentItem.category &&
              i.id !== currentItem.id &&
              i.moderation_status === 'approved'
            )
            .slice(0, 12);
          setSimilarItems(filtered);
        } catch (fallbackErr) {
          console.error('Failed to fetch from discover fallback:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [currentItem])

  return {similarItems, facets, loading}
}

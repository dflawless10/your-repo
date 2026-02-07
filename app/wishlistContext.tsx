// wishlistContext.tsx
import React, { createContext, useMemo, useContext, useState, useEffect } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {AuctionItem} from "@/types/items";
import {API_BASE_URL} from "@/config";

export type WishlistContextType = {
  wishlistIds: number[];
  refreshWishlist: () => Promise<void>;
  addToWishlist: (id: string | number) => Promise<void>;
  removeFromWishlist: (id: string | number) => Promise<void>;
  wishlistItems: AuctionItem[];
  unWatchText: string;
};

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: [],
  wishlistItems: [],
  unWatchText: "",
  refreshWishlist: async () => {},
  addToWishlist: async (id: string | number) => {},
  removeFromWishlist: async (id: string | number) => {},
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [wishlistItems, setWishlistItems] = useState<AuctionItem[]>([]);
  const unWatchText = "Unwatch";

  const refreshWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.log("🐐 WishlistContext: No token found, skipping refresh");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.log("🐐 WishlistContext: Auth token expired, user needs to re-login");
          // Clear invalid token
          await AsyncStorage.removeItem('jwtToken');
          return;
        }

        const errorText = await res.text();
        console.log(`🐐 WishlistContext: Fetch returned ${res.status}:`, errorText);
        return;
      }

      const data = await res.json();
      // Handle new active/expired format
      const allItems = [...(data.active || []), ...(data.expired || [])];
      setWishlistItems(allItems);
      setWishlistIds(allItems.map((item: AuctionItem) => item.id)); // ✅ sync IDs
      console.log(`🐐 WishlistContext: Loaded ${data.active?.length || 0} active, ${data.expired?.length || 0} expired items`);

    } catch (err) {
      console.log('🐐 WishlistContext: Network error refreshing wishlist:', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const addToWishlist = async (id: string | number) => {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    console.log('🐐 WishlistContext: Adding item', numericId, 'to backend');
    setWishlistIds(prev => [...prev, numericId]); // optimistic update

    const token = await AsyncStorage.getItem('jwtToken');
    const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ auction_id: numericId }),
    });

    if (res.ok) {
      const responseData = await res.json();
      console.log('🐐 WishlistContext: Backend POST response:', responseData);
      await refreshWishlist();
      console.log('🐐 WishlistContext: After refresh, wishlistIds:', wishlistIds);
    } else {
      const errorText = await res.text();
      console.warn('❌ Failed to add to wishlist:', res.status, errorText);
      setWishlistIds(prev => prev.filter(wid => wid !== numericId)); // rollback
    }
  };

  const removeFromWishlist = async (id: string | number) => {
    const numericId = typeof id === "string" ? Number.parseInt(id, 10) : id;
    const token = await AsyncStorage.getItem('jwtToken');

    await fetch(`${API_BASE_URL}/api/wishlist/${numericId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    setWishlistIds(prev => prev.filter(wid => wid !== numericId)); // ✅ remove, not add
  };

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        await refreshWishlist();
      } else {
        console.warn("🐐 Skipping wishlist refresh — no token yet");
      }
    })();
  }, []);

  const contextValue = useMemo(() => ({
    wishlistItems,
    wishlistIds,
    addToWishlist,
    removeFromWishlist,
    refreshWishlist,
    unWatchText,
  }), [
    wishlistItems,
    wishlistIds,
  ]);

  return (
  <WishlistContext.Provider value={contextValue}>
    {children}
  </WishlistContext.Provider>
);

};
export const useWishlist = () => useContext(WishlistContext);

export default WishlistProvider



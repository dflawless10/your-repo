// utils/wishlistSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuctionItem } from '@/types/items'; // 👈 your app's AuctionItem type

// --- State shape ---
export interface WishlistState {
  items: AuctionItem[];
}

const initialState: WishlistState = {
  items: [],
};

// --- Slice ---
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // Hydrate wishlist from backend response
    setWishlistItems(state, action: PayloadAction<AuctionItem[]>) {
      state.items = action.payload.map((i) => ({
        ...i,
        id: String(i.id), // normalize IDs to string
      }));
    },

    // Add a single item if not already present
    addToWishlist(state, action: PayloadAction<AuctionItem>) {
      const id = String(action.payload.id);
      const exists = state.items.some((item) => String(item.id) === id);
      if (!exists) {
        state.items.push({ ...action.payload, id });
      }
    },

    // Remove by ID
    removeFromWishlist(state, action: PayloadAction<string | number>) {
      const id = String(action.payload);
      state.items = state.items.filter((item) => String(item.id) !== id);
    },

    // Clear all items
    clearWishlist(state) {
      state.items = [];
    },
  },
});

// --- Actions ---
export const {
  setWishlistItems,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = wishlistSlice.actions;

// --- Reducer ---
export default wishlistSlice.reducer;

// utils/wishlistSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  isWishlisted?: boolean;
  preparer?: string;
}

interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlistItems(state, action: PayloadAction<WishlistItem[]>) {
      state.items = action.payload.map((i) => ({
        ...i,
        id: String(i.id),          // normalize just in case
      }));
    },

    // Accept partial from UI, normalize before reducing
    addToWishlist: {
      reducer(state, action: PayloadAction<WishlistItem>) {
        const exists = state.items.find((item) => item.id === action.payload.id);
        if (!exists) {
          state.items.push(action.payload);
        }
      },
      prepare(item: any) {
        return {
          payload: {
            id: String(item.id),
            name: item.name,
            price: item.price ?? 0,
            image: item.image,
            isWishlisted: typeof item.isWishlisted === 'boolean' ? item.isWishlisted : undefined,
            preparer: item.preparer,
          } as WishlistItem,
        };
      },
    },

    // Support both string and number IDs from callers
    removeFromWishlist(state, action: PayloadAction<string | number>) {
      const id = String(action.payload);
      state.items = state.items.filter((item) => item.id !== id);
    },

    clearWishlist(state) {
      state.items = [];
    },
  },
});

const {
  setWishlistItems,
  addToWishlist: _addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = wishlistSlice.actions;

// Export with proper typing to accept any item with id and name
export const addToWishlist = _addToWishlist as any as (item: any) => ReturnType<typeof _addToWishlist>;

export {
  setWishlistItems,
  removeFromWishlist,
  clearWishlist,
};

export default wishlistSlice.reducer;

// Optional selectors for cleaner components
export const selectWishlistItems = (state: { wishlist: WishlistState }) => state.wishlist.items;
export const selectIsInWishlist =
  (id: string | number) =>
  (state: { wishlist: WishlistState }) =>
    state.wishlist.items.some((i) => i.id === String(id));

// utils/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';


// types/items.ts
export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  photo_url: string;   // ✅ required for UI
  startingPrice?: number;
  theme: string;
  isInCart: boolean;
  listed_at?: string;
  listedAt?: string;
  registration_time?: string;
}



interface CartState {
  items: CartItem[];
}

// --- Initial State ---
const initialState: CartState = {
  items: [],
};

// --- Slice ---
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload.map((i) => ({
        ...i,
        id: String(i.id), // normalize IDs to string
      }));
    },
    addItem(state, action: PayloadAction<CartItem>) {
      const id = String(action.payload.id);
      const existing = state.items.find((item) => item.id === id);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push({ ...action.payload, id });
      }
    },
    removeItem(state, action: PayloadAction<string | number>) {
      const id = String(action.payload);
      state.items = state.items.filter((item) => item.id !== id);
    },
    clearCart(state) {
      state.items = [];
    },
    updateQuantity(
      state,
      action: PayloadAction<{ id: string | number; quantity: number }>
    ) {
      const id = String(action.payload.id);
      const item = state.items.find((i) => i.id === id);
      if (item) {
        if (action.payload.quantity <= 0) {
          // auto-remove if quantity is zero
          state.items = state.items.filter((i) => i.id !== id);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },
  },
});

// --- Actions (typed) ---
export const setCartItems: ActionCreatorWithPayload<CartItem[]> =
  cartSlice.actions.setCartItems;
export const addItem: ActionCreatorWithPayload<CartItem> =
  cartSlice.actions.addItem;
export const removeItem: ActionCreatorWithPayload<string | number> =
  cartSlice.actions.removeItem;
export const clearCart = cartSlice.actions.clearCart;
export const updateQuantity =
  cartSlice.actions.updateQuantity;

// --- Reducer ---
export default cartSlice.reducer;

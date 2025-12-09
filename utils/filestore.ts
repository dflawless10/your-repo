import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import wishlistReducer, { WishlistState } from './wishlistSlice';
import userReducer from './userSlice';
import { persistWishlist } from './persistWishlist';
import { persistCart } from './persistCart';


export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

store.subscribe(() => {
  const state = store.getState();
  persistWishlist(state.wishlist.items);
  persistCart(state.cart.items);
});

export default store;

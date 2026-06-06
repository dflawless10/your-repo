import { configureStore } from '@reduxjs/toolkit';
import cartReducer from 'utils/cartSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

// Typed Redux helpers
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

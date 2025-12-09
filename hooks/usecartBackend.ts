// hooks/useCartBackend.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from './reduxHooks';
import { setCartItems } from 'utils/cartSlice';

// types/items.ts
export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  photo_url: string;   // ✅ required for UI
  startingPrice?: number;
  isInCart?: boolean;
  listed_at?: string;
  listedAt?: string;
  registration_time?: string;
}


export function useCartBackend() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch('http://10.0.0.170:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      dispatch(setCartItems(data.items));
    } catch (err) {
      setError('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch('http://10.0.0.170:5000/api/cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: productId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cart add error:', errorData);
        throw new Error(errorData.error || 'Failed to add item');
      }

      await fetchCart(); // refresh cart
    } catch (err) {
      console.error('Add to cart error:', err);
      setError('Failed to add item');
      throw err;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      await fetch(`http://10.0.0.170:5000/api/cart/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCart();
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const isInCart = (productId: string | number) => {
    return cartItems.some(item => item.id === productId);
  };

  useEffect(() => {
    void fetchCart();
  }, []);

  return {
    cartItems,
    loading,
    error,
    fetchCart,
    addToCart,
    removeFromCart,
    isInCart, // ✅ now included
  };
}

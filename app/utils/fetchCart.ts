import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import { setCartItems } from 'utils/cartSlice';
import { AppDispatch } from '../store/store';

export const fetchCart = async (dispatch: AppDispatch) => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      dispatch(setCartItems(data.items || []));
    }
  } catch (error) {
    console.error('🐐 Cart fetch error:', error);
  }
};

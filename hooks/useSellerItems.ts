import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSellerItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      try {
        const res = await fetch('http://10.0.0.170:5000/seller/items', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('Error fetching seller items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return { items, loading };
};

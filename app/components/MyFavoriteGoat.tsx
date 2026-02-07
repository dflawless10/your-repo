import { API_BASE_URL } from '@/config';

// components/MyFavoriteGoat.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, Animated
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router, useRouter} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';

type FavoriteItem = {
  id: number;
  name: string;
  price: number;
  photo_url: string;
  description: string;
};

const API_URL = API_BASE_URL;

export default function MyFavoriteGoat() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const fetchFavorites = async () => {
    try {
      const [token, savedUsername] = await Promise.all([
        AsyncStorage.getItem('jwtToken'),
        AsyncStorage.getItem('username'),
      ]);

      setUsername(savedUsername);

      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        Alert.alert('Session Expired', 'Please log in again');
        router.push('/login');
        return;
      }

      const data = await res.json();
      setFavorites(data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      Alert.alert('Error', 'Could not load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const removeFavorite = async (itemId: number) => {
    const token = await AsyncStorage.getItem('jwtToken');
    try {
      const res = await fetch(`${API_URL}/api/favorites?item_id=${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFavorites(prev => prev.filter(item => item.id !== itemId));
        Alert.alert('Removed', 'Item taken off your favorites');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      Alert.alert('Error', 'Could not remove item');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleItemPress = async (item: FavoriteItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/item/${item.id}`);
  };

  // ...then comes your return() block and StyleSheet code below

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: HEADER_MAX_HEIGHT },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  emptyMessage: { fontSize: 16, color: '#777', textAlign: 'center' },
  card: { marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9' },
  image: { height: 100, borderRadius: 8, marginBottom: 8 },
  details: { paddingLeft: 6 },
  name: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, color: '#555', marginVertical: 4 },
  favoriteButton: { marginTop: 6, padding: 8, backgroundColor: '#eee', borderRadius: 4 },
  actionText: { fontSize: 14, color: '#f00' },
  list: { padding: 16, paddingTop: HEADER_MAX_HEIGHT + 16 },
});
import React, { useCallback } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ItemCard from '@/components/ItemCard';
import MascotOverlay from '@/app/components/MascotOverlay';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setWishlistItems } from '@/utils/wishlistSlice';
import { AuctionItem } from '@/types/items';
import { ROUTES } from '@/types/routes';
import { persistWishlist, loadWishlist } from '@/utils/persistWishlist';

export default function WishlistScreen() {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load persisted wishlist on focus
  const hydrateWishlist = useCallback(async () => {
    const stored = await loadWishlist();
    if (stored.length > 0) {
      dispatch(setWishlistItems(stored));
    }
  }, [dispatch]);

  // Fetch from the backend and persist
  const fetchWishlist = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://10.0.0.170:5000/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setWishlistItems(data.items as AuctionItem[]));
        await persistWishlist(data.items); // persist to AsyncStorage
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      hydrateWishlist(); // load from storage first
      fetchWishlist();   // then refresh from the backend
    }, [hydrateWishlist, fetchWishlist])
  );

  const handleItemPress = (itemId: string | number) => {
    router.push({ pathname: '/item/[itemId]', params: { itemId: String(itemId) } });
  };

  const handleExplorePress = () => {
    router.push(ROUTES.HOME.pathname as any);
  };

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyState}>
      <MascotOverlay
        mood="Sad"
        message="The goat is confused. What auctions do you desire?"
      />
      <ThemedText style={styles.emptyStateText}>
        No items in your wishlist yet
      </ThemedText>
      <ThemedText type="link" onPress={handleExplorePress} style={styles.exploreLink}>
        Explore Available Items
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>💖 My Wishlist</ThemedText>
      {isLoading ? (
        <ThemedText>Loading wishlist...</ThemedText>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => handleItemPress(item.id)} />
          )}
          ListEmptyComponent={renderEmptyState()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, fontSize: 24, fontWeight: '600' },
  listContent: { padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyStateText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 },
  exploreLink: { fontSize: 16, color: '#007AFF' },
});

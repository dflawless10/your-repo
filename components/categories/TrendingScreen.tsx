import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import {router, useNavigation} from 'expo-router';
import { AuctionItem } from '@/types/items';


import {API_BASE_URL} from "@/config";

export default function TrendingScreen() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/items/trending`);
        const data = await res.json();
       setItems(data ?? []);
      } catch (error) {
        console.warn('Failed to fetch trending items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const renderItem = ({ item }: { item: AuctionItem }) => (
    <TouchableOpacity
  style={styles.card}
  onPress={() =>
  router.push({
    pathname: "/auction/[auctionId]",
    params: { auctionId: item.id.toString() },
  })
}

>

      <ImageBackground
        source={{ uri: item.image_url }}
        style={styles.image}
        imageStyle={{ borderRadius: 12 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.price}>💎 ${item.current_bid}</Text>
          <Text style={styles.mascot}>🐐 {item.MASCOT_MOODS}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🔥 Trending Auctions</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#ff9900" />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No trending items yet. The goats are still grazing...</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  grid: {
    gap: 12,
  },
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    height: 180,
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    color: '#ffdd00',
    fontSize: 14,
    marginTop: 4,
  },
  mascot: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    color: '#888',
  },
});

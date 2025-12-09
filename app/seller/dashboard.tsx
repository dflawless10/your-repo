import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, Animated,
  Animated as RNAnimated
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import {playGoatSoundByName} from "@/assets/sounds/officialGoatSoundsSoundtrack";
import EnhancedHeader from '@/app/components/EnhancedHeader';




type SellerItem = {
  id: number;
  name: string;
  price: number;
  photo_url: string;
  bid_count: number;
};

const API_URL = 'http://10.0.0.170:5000';

function SellerDashboardScreen() {
  const [items, setItems] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);
  const router = useRouter();

useEffect(() => {
  (async () => {
    const avatar = await AsyncStorage.getItem('avatar_url');
    setAvatarUrl(avatar || null);
  })();
}, []);

  useEffect(() => {
    const fetchSellerItems = async () => {
  try {
    const [name, token, avatar] = await Promise.all([
      AsyncStorage.getItem('username'),
      AsyncStorage.getItem('jwtToken'),
      AsyncStorage.getItem('avatar_url'),
    ]);
    setAvatarUrl(avatar || null);
    if (!token) return setItems([]);
    const res = await fetch(`${API_URL}/seller/items`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error loading items:', err);
    setItems([]);
  } finally {
    setLoading(false);
  }
};
    fetchSellerItems();
    loadUsername();
  }, []);

  const loadUsername = async () => {
    const name = await AsyncStorage.getItem('userEmail');
    setUsername(name);
  };

  const handleDelete = async (itemId: number) => {
  const token = await AsyncStorage.getItem('jwtToken');

  try {
    const res = await fetch(`${API_URL}/item/${itemId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      playGoatSoundByName('Bleat'); // 🐐✨ Bleat to delete!
      Alert.alert('Deleted!', 'Item removed from your vault.');
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } else {
      const message = await res.text();
      Alert.alert('Error', message);
    }
  } catch (error) {
    console.error('Delete error:', error);
    Alert.alert('Error', 'Could not delete item.');
  }
};


  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader
  scrollY={scrollY}
  username={username}
  avatarUrl={avatarUrl ?? undefined}
  onSearch={q => console.log('search', q)}
/>

      {/* Page Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Seller Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/seller/orders' as any)}
          >
            <Text style={styles.headerButtonText}>📦 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/seller/revenue' as any)}
          >
            <Text style={styles.headerButtonText}>💰 Revenue</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.FlatList
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingTop: 160 }}
        renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/item/${item.id}`)}
        >
          <Image
  source={{ uri: item.photo_url || 'https://via.placeholder.com/100' }}
  style={styles.image}
/>
          <View style={styles.details}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>💰 ${item.price}</Text>
            <Text>📊 Bids: {item.bid_count}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() =>
                router.push({
                  pathname: '/seller/item/[itemId]/edit',
                  params: { itemId: item.id.toString() }
                })
              }>
                <Text style={styles.actionText}>✏️ Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
  onPress={() =>
    Alert.alert('Confirm Delete', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDelete(item.id); // ✅ explicitly voided
        },
      },
    ])
  }
>
  <Text style={[styles.actionText, { color: '#e53e3e' }]}>🗑️ Delete</Text>
</TouchableOpacity>


            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  container: { padding: 16 },
  card: {
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#edf2f7',
    borderRadius: 6,
  },
  image: { width: 100, height: 100 },
  details: { padding: 10, flex: 1 },
  name: { fontSize: 18, fontWeight: '600', marginBottom: 4 }
});
export default SellerDashboardScreen;
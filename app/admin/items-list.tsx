import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import GlobalFooter from '../components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';
import PageHeader from '../components/PageHeader';

interface Item {
  id: number;
  name: string;
  price: number;
  photo_url?: string;
  is_sold: boolean;
  status: string;
  created_at: string;
  seller_id: number;
}

export default function ItemsListScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = React.useRef(new Animated.Value(1)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Get filter from params ('all', 'sold', 'active')
  const filter = (params.filter as string) || 'all';

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  }, []);

  useEffect(() => {
   void loadItems();
  }, [filter]);

  const loadItems = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.replace('/sign-in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/items?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (filter === 'sold') return `Sold Items (${items.length})`;
    if (filter === 'active') return `Active Items (${items.length})`;
    return `All Items (${items.length})`;
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/item/${item.id}` as any)}
    >
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={32} color="#999" />
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, { color: isDark ? '#B794F4' : '#6A0DAD' }]}>${item.price.toFixed(2)}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              item.is_sold
                ? styles.soldBadge
                : item.status === 'active'
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.is_sold
                  ? styles.soldText
                  : item.status === 'active'
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {item.is_sold ? 'Sold' : item.status}
            </Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#999'} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#B794F4' : '#6A0DAD'} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

  <Animated.View style={{ flex: 1, marginTop: HEADER_MAX_HEIGHT }}>
    <PageHeader title={getTitle()} opacity={headerOpacity} scale={headerScale} />

    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{
        paddingBottom: 120,
      }}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={isDark ? '#555' : '#CCC'} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items found</Text>
        </View>
          }
        />
      </Animated.View>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    marginTop: HEADER_MAX_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: HEADER_MAX_HEIGHT,
  },
  listContainer: {
    padding: 4,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldBadge: {
    backgroundColor: '#D1FAE5',
  },
  activeBadge: {
    backgroundColor: '#DBEAFE',
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  soldText: {
    color: '#059669',
  },
  activeText: {
    color: '#2563EB',
  },
  inactiveText: {
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

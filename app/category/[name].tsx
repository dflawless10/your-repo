import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { Image } from 'expo-image';

const API_URL = 'http://10.0.0.170:5000';

type GenderFilter = 'all' | 'women' | 'men' | 'unisex' | 'kids' | 'pets';

interface Item {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  gender?: string;
  current_bid?: number;
  auction_ends_at?: string;
}

export default function CategoryScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState<GenderFilter>('all');

  // Map category names to display format and backend categories
  const categoryDisplayName = typeof name === 'string'
    ? name
    : 'Category';

  // Map frontend categories to backend category values - Updated alphabetically
  const getCategoryParams = (displayName: string): string[] => {
    const categoryMap: Record<string, string[]> = {
      'Accessories': ['accessory', 'accessories'],
      'Bracelets': ['bracelet', 'bracelets'],
      'Charms': ['charm', 'charms'],
      'Coins': ['coin', 'coins'],
      'Earrings': ['earring', 'earrings'],
      'Fancy Color Gems': ['fancy color gem', 'fancy color gems', 'colored gem', 'colored gems'],
      'Necklaces': ['necklace', 'necklaces'],
      'Pendants': ['pendant', 'pendants'],
      'Rings': ['ring', 'rings'],
      'Vintage': ['vintage'],
      'Watches': ['watch', 'watches'],
    };
    return categoryMap[displayName] || [displayName.toLowerCase()];
  };

  useEffect(() => {
    fetchItems();
  }, [name, selectedGender]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      // Build query params
      const params = new URLSearchParams();
      if (typeof name === 'string') {
        const categories = getCategoryParams(categoryDisplayName);
        // Send multiple category values - backend should handle OR logic
        categories.forEach(cat => params.append('category', cat));
      }
      if (selectedGender !== 'all') {
        params.append('gender', selectedGender);
      }

      const url = `${API_URL}/api/items?${params.toString()}`;
      console.log('Fetching items from:', url);

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched items:', data.length);
        setItems(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch items:', response.status, errorText);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const renderFilterChip = (filter: GenderFilter, label: string, icon?: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterChip,
        selectedGender === filter && styles.filterChipActive,
      ]}
      onPress={() => setSelectedGender(filter)}
    >
      {icon && <Text style={styles.filterIcon}>{icon}</Text>}
      <Text
        style={[
          styles.filterChipText,
          selectedGender === filter && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => router.push(`/item/${item.id}`)}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.itemImage}
        contentFit="cover"
        placeholder={require('../../assets/goat-icon.png')}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          {item.current_bid ? (
            <>
              <Text style={styles.currentBid}>
                ${item.current_bid.toFixed(2)}
              </Text>
              <Text style={styles.bidLabel}>Current Bid</Text>
            </>
          ) : (
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          )}
        </View>
        {item.auction_ends_at && (
          <View style={styles.auctionBadge}>
            <Ionicons name="time-outline" size={12} color="#FF6B35" />
            <Text style={styles.auctionText}>Auction</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A202C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {renderFilterChip('all', 'All')}
          {renderFilterChip('women', "Women's", '👩')}
          {renderFilterChip('men', "Men's", '👨')}
          {renderFilterChip('unisex', 'Unisex', '⚥')}
          {renderFilterChip('kids', 'Kids/Teens', '👶')}
          {renderFilterChip('pets', 'Pets', '🐾')}
        </ScrollView>
      </View>

      {/* Items Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Loading {categoryDisplayName}...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="diamond-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubtext}>
            Check back soon for new {categoryDisplayName.toLowerCase()}!
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    flex: 1,
    textAlign: 'center',
  },
  filterContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 9,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#F0F4FF',
    borderColor: '#6A0DAD',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#6A0DAD',
  },
  gridContent: {
    paddingTop: 200,
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
    minHeight: 40,
  },
  priceRow: {
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  currentBid: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38a169',
  },
  bidLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  auctionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  auctionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 200,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

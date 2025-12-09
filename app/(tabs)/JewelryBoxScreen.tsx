import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  useColorScheme,
  Animated,
  TouchableOpacity,
  Dimensions, ActivityIndicator, Share,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { formatTimeWithSeconds } from '@/utils/time';
import { AuctionItem, ListedItem } from '@/types/items';
import {useWishlist} from "@/app/wishlistContext";
import {useAppDispatch} from "@/hooks/reduxHooks";
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import {setUser} from "@/utils/userSlice";
import {getUserProfile} from "@/api/auth";

import AsyncStorage from '@react-native-async-storage/async-storage';



const listedItem: {
    id: string;
    name: string;
    title: string;
    description: string;
    image: string;

    price: number;
    auction_id: string;
    timeLeft: string;
    listed_at: string;
    is_trending: boolean;
    reserve_price: number;
    final_price: number;
    sold_to: string;
    getCountdown: string;
    item: string;
    isFavorited: boolean;
    toggleFavorite: () => void;
    sold_at: string;
    sold_at_timestamp: string;
    sold_at_formatted: string;
    sold_at_formatted_timestamp: string;
    is_sold: boolean;
    is_active: boolean;
    is_listed: boolean;
    is_favorite: boolean;
    is_sold_out: boolean;
    is_sold_out_at: string;
    is_sold_out_at_timestamp: string;
    is_sold_out_at_formatted: string;
    is_sold_out_at_formatted_timestamp: string;
    preview: string;
    recent_bids: string;
    photo_url: string;
    auction_ends_at: string;
    registration_time: string;
    end_time: string;
    bidCount: number;
    seller: { name: string; avatar: string };
    category?: string;
    amount: number;
    user_id: string;
    timestamp: string;
    isDerived: boolean;
    mascot?: { emoji?: string };
    isWishlisted: string;
    quantity_available: number;
    image_url: string;
    tags: string
  } = {
  amount: 0,
  auction_ends_at: "",
  auction_id: "",
  bidCount: 0,
  description: "",
  end_time: "",
  final_price: 0,
  getCountdown: "",
  id: "",
  image: "",
  image_url: "",
  isDerived: false,
  isFavorited: false,
  is_active: false,
  is_favorite: false,
  is_listed: false,
  is_sold: false,
  is_sold_out: false,
  is_sold_out_at: "",
  is_sold_out_at_formatted: "",
  is_sold_out_at_formatted_timestamp: "",
  is_sold_out_at_timestamp: "",
  is_trending: false,
   item: "",
  listed_at: "",
  name: "",
  photo_url: "",
  preview: "",
  price: 0,
  recent_bids: "",
  registration_time: "",
  reserve_price: 0,
  seller: {avatar: "", name: ""},
  sold_at: "",
  sold_at_formatted: "",
  sold_at_formatted_timestamp: "",
  sold_at_timestamp: "",
  sold_to: "",
  timeLeft: "",
  timestamp: "",
  title: "",
  toggleFavorite(): void {
  },
  user_id: "",

  isWishlisted: 'true',
    quantity_available: 1,

    tags: ''
};

export const goatColors = {
  light: {
    background: '#ffffff',
    card: '#f5f5f5',
    text: '#000',
    subtext: '#f5f5f5',
    empty: '#fff',
  },
  dark: {
    background: '#fff',     // softer than pure black
    card: '#f5f5f5',           // velvet charcoal
    text: '#000',           // off-white for less contrast
    subtext: '#b0b0b5',        // softened gray
    empty: '#fff',          // lighter than before
  },
};


export default function JewelryBoxScreen() {
  const router = useRouter();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const { addToWishlist, refreshWishlist } = useWishlist();
  const [wishlistItems, setWishlistItems] = useState<AuctionItem[]>([]);
  const { isAuthenticated, username, token } = useAuth();
  const [allItems, setAllItems] = useState<ListedItem[]>([]);
  const [favoritedMap, setFavoritedMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const scheme = useColorScheme() ?? 'light';
  const item = listedItem;
  const theme = goatColors[scheme];
  const scrollY = useRef(new Animated.Value(0)).current;
  const now = Date.now();

  useEffect(() => {
  if (token) {
    refreshWishlist(); // ✅ no arguments needed
  }
}, [token]);

  // Fetch favorites from the backend (with auto-cleanup of unavailable items)
  const fetchFavoritesFromBackend = async () => {
    try {
      const response = await fetch('http://10.0.0.170:5000/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        console.log('🐐 JewelryBox: Fetched', items.length, 'favorites from backend');
        setAllItems(items);

        // Sync backend favorites to AsyncStorage
        const favMap: Record<number, boolean> = {};
        items.forEach((item: ListedItem) => {
          favMap[item.id] = true;
        });
        setFavoritedMap(favMap);
        await AsyncStorage.setItem('favoritedItems', JSON.stringify(favMap));
        console.log('🐐 JewelryBox: Synced', items.length, 'favorites to AsyncStorage');
      } else {
        console.warn('🐐 JewelryBox: Failed to fetch favorites:', await response.text());
        setAllItems([]);
      }
    } catch (error) {
      console.error('🐐 JewelryBox: Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load favorited items from AsyncStorage (fallback for offline)
  const loadFavoritedMap = async () => {
    try {
      const stored = await AsyncStorage.getItem('favoritedItems');
      console.log('🐐 JewelryBox: Raw favorited items from AsyncStorage:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🐐 JewelryBox: Parsed favorited map:', parsed);
        setFavoritedMap(parsed);
      }
    } catch (err) {
      console.error('🐐 JewelryBox: Failed to load favorited map:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFavoritesFromBackend();
    }
  }, [token]);

  // Reload favorites whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchFavoritesFromBackend();
      } else {
        loadFavoritedMap();
      }
    }, [token])
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
  const hydrateUser = async () => {
    if (token) {
      const profile = await getUserProfile(token);
      if (profile) {
        dispatch(setUser(profile));
      }
    }
  };
  hydrateUser();
}, [token, dispatch]);


  const handleToggleFavorite = async (itemId: number) => {
    const updated = {
      ...favoritedMap,
      [itemId]: !favoritedMap[itemId],
    };
    setFavoritedMap(updated);

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('favoritedItems', JSON.stringify(updated));
      console.log(`🐐 Toggled favorite for item ${itemId}`);

      // Sync with backend
      if (updated[itemId]) {
        // Add to favorites
        await fetch('http://10.0.0.170:5000/api/favorites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: itemId }),
        });
        console.log(`🐐 Item ${itemId} added to backend favorites`);
      } else {
        // Remove from favorites
        await fetch(`http://10.0.0.170:5000/api/favorites/${itemId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log(`🐐 Item ${itemId} removed from backend favorites`);

        // Refresh the list to remove unfavorited item
        await fetchFavoritesFromBackend();
      }
    } catch (err) {
      console.error('🐐 Failed to toggle favorite:', err);
    }
  };

  const handleShare = async (item: AuctionItem | ListedItem) => {
    try {
      await Share.share({
        message: `Check out this item: ${item.name}\n${item.photo_url}`,
        url: item.photo_url,
        title: item.name,
      });
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

 const getCountdownColor = (endTime: string): { color: string; fontWeight: '600' } => {
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const diffHours = (end - now) / (1000 * 60 * 60);

  return {
    color: diffHours <= 2 ? '#e53e3e' : '#38a169', // red if ≤2h, green otherwise
    fontWeight: '600',
  };
};

  // Items are already favorites from the backend (with auto-cleanup applied)
  console.log('🐐 JewelryBox: Displaying', allItems.length, 'favorited items');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>
      ) : (
        <Animated.FlatList
          data={allItems}
          numColumns={2}
          keyExtractor={(item, index) => item?.id?.toString() ?? `fallback-${index}`}
          renderItem={({ item, index }) => {
            console.log('🐐 Rendering item:', item.id, item.name);
            return (
              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => {
                  console.log('🐐 Tapped item:', item.id, item.name);
                  router.push(`/item/${item.id}`);
                }}
                activeOpacity={0.9}
              >

              <View style={[styles.jewelryItem, { backgroundColor: theme.card }]}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.photo_url }} style={styles.image} resizeMode="cover" />

                  {/* Heart Icon - Top Right */}
                  <TouchableOpacity
                    style={styles.heartIconTopRight}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(item.id);
                    }}
                  >
                    <Ionicons name="heart" size={24} color="#FF1744" />
                  </TouchableOpacity>

                  {/* Share Icon - Bottom Left (where heart used to be) */}
                  <TouchableOpacity
                    style={styles.shareIconBottomLeft}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShare(item);
                    }}
                  >
                    <Ionicons name="share-social" size={20} color="#6A0DAD" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.jewelryName, { color: theme.text }]} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.cardPrice}>
                    ${(item.highest_bid ?? item.price ?? 0).toFixed(2)}
                  </Text>
                  {(item.bidCount ?? 0) > 0 && (
                    <Text style={styles.bidBadge}>{item.bidCount} BIDS</Text>
                  )}
                </View>

                <View style={styles.statsContainer}>
                  <Text style={styles.statsText}>👀 {Math.floor(Math.random() * 20) + 5} watching</Text>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                  <Text
                    style={[
                      styles.statsText,
                      item.auction_ends_at ? getCountdownColor(item.auction_ends_at) : {},
                    ]}
                    numberOfLines={1}
                  >
                    {item.auction_ends_at
                      ? formatTimeWithSeconds(item.auction_ends_at, Date.now())
                      : 'Not auctioned'}
                  </Text>
                </View>

                {/* Seller Name */}
                {item.seller && (
                  <Text style={styles.sellerName} numberOfLines={1}>
                    by {item.seller.username || 'Seller'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyState, { color: theme.empty }]}>
                💖 No favorites yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                Tap the heart icon on items you love! ✨
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingTop: HEADER_MAX_HEIGHT + 20,
            paddingHorizontal: 16,
            paddingBottom: 20,
          }}
          columnWrapperStyle={{ gap: 12, justifyContent: 'space-between' }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
      <EnhancedHeader scrollY={scrollY} username={username ?? null} onSearch={() => {}} />
    </View>
  );
}

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 32 - COLUMN_GAP) / NUM_COLUMNS;

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardWrapper: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  jewelryItem: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  jewelryInner: {
    borderRadius: 16,
    overflow: 'hidden',
    width: ITEM_WIDTH,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  heartIconTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  shareIconBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: ITEM_WIDTH * 1.2,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
priceTagContainer: {
    position: 'absolute',
  top: 8,
  left: 8,
},

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  bidBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  infoContainer: {
    padding: 12,
  },

  jewelryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  sellerName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
loader: {
    marginVertical: 20,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
  },

});

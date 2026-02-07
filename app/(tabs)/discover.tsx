import { API_BASE_URL } from '@/config';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  FlatList, View, Text, Image, TouchableOpacity, RefreshControl,
  ActivityIndicator, StyleSheet, Dimensions, Platform, Animated as RNAnimated
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';

import { playGoatSoundByName } from 'assets/sounds/officialGoatSoundsSoundtrack';
import { useFocusEffect } from '@react-navigation/native';
import {BlurView} from "expo-blur";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import {formatTimeWithSeconds} from "@/utils/time";
import {useWishlist} from "app/wishlistContext"; // ✅ External header component
import { useAppDispatch } from 'hooks/reduxHooks';
import {addToWishlist} from 'app/wishlistslice';
import GoatGenieBadge from 'app/GoatGenieBadge';
import useThemeColor from '@/hooks/useThemeColor';
import { useTheme } from '@/app/theme/ThemeContext';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';




const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 32 - COLUMN_GAP) / NUM_COLUMNS;

interface AuctionItem {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  price: number;
  highest_bid?: number;
  auction_id: string;
  timeLeft: string;
  listed_at: string;
  is_trending: boolean;
  is_must_sell: number;
  selling_strategy: string;
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
  buy_it_now: string;
  photo_url: string;
  auction_ends_at: string;
  registration_time: string;

  end_time: string;
  bidCount: number;
  seller?: {
    id: number;
    username: string;
    avatar?: string;
    avg_rating?: number;
    total_reviews?: number;
    positive_percent?: number;
  };
  category?: string;
  amount: number;
  user_id: string;
  timestamp: string;
  isDerived: boolean;
  mascot?: {
    emoji?: string;
  };
}



export default function Discover() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    fetchItems();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const normalizeAuctionEndsAt = (it: AuctionItem) => {
  const raw = it.auction_ends_at || it.end_time || "";
  if (!raw) return ""; // no auction
  const hasTZ = raw.includes("T") || raw.includes("+") || raw.endsWith("Z");
  return hasTZ ? raw : raw.replace(" ", "T") + "Z";
};

const fetchItems = async () => {
  let data: AuctionItem[] = [];
  try {
    const res = await fetch('http://10.0.0.170:5000/items/discover');
    data = await res.json();
    console.log('🔍 Raw discover data:', data);
    console.log('🔍 First item buy_it_now:', data[0]?.buy_it_now);
    const normalized = data.map((item: AuctionItem) => ({
      ...item,
      title: item.title || item.name || "",
      auction_ends_at: normalizeAuctionEndsAt(item),
      bid_count: item.bidCount,
      buy_it_now: item.buy_it_now, // Explicitly preserve buy_it_now
      is_must_sell: item.is_must_sell,
      selling_strategy: item.selling_strategy,
    }));
    console.log('🔍 Normalized first item buy_it_now:', normalized[0]?.buy_it_now);
    setItems(normalized);
  } catch (err) {
    console.error('Discover fetch error:', err);
    console.log('Fallback items:', data);
  }
};
const { wishlistIds, addToWishlist: addToWishlistBackend } = useWishlist();

const dispatch = useAppDispatch();

const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, []);



  const playBah = async () => {
    await playGoatSoundByName('Stutter Baa');
  };

  const handleItemPress = async (item: AuctionItem) => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await playBah();
  router.push(`/item/${item.id}`);
};


 const formatTime = (iso: string): string => {
  if (!iso) return "Auction ended";

  const parsed = iso.endsWith('Z') || iso.includes('+')
    ? new Date(iso)
    : new Date(iso + 'Z'); // force UTC if missing

  if (Number.isNaN(parsed.getTime())) return "Auction ended";

  const now = Date.now();
  const diffMs = parsed.getTime() - now;
  if (diffMs <= 0) return "Auction ended";

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Ends in ${diffHrs}h ${diffMin}m`;
};


const now = Date.now();


const handleAddToWishlist = async (item: AuctionItem) => {
  const itemId = item.id;
  console.log('🐐 Discover: Adding item to wishlist:', itemId, item.name);
  
  try {
    // Add to the backend first
    await addToWishlistBackend(itemId);
    console.log('🐐 Discover: Added to backend successfully');
    
    // Then update Redux state
    const listedItem = {
      ...item,
      isWishlisted: 'true',
      quantity_available: 1,
      image_url: item.photo_url,
      tags: '',
    };
    dispatch(addToWishlist(listedItem));
    
    // Navigate to wishlist with small delay
    await new Promise(resolve => setTimeout(resolve, 300));
    router.push('/wishlist');
  } catch (error) {
    console.error('🐐 Discover: Error adding to wishlist:', error);
  }
};
const backgroundColor = useThemeColor({}, 'background');

  const renderItem = ({ item }: { item: AuctionItem }) => {
    const isAuctionEnded = new Date(item.auction_ends_at).getTime() <= Date.now();
    const timeLeftMs = new Date(item.auction_ends_at).getTime() - Date.now();
    const isUrgent = timeLeftMs > 1 && timeLeftMs <= 7200000; // Less than 2 hours

    // Debug: Log buy_it_now value for each item
    if (item.buy_it_now) {
      console.log(`🏷️ Item ${item.id} has buy_it_now:`, item.buy_it_now);
    }

    return (

         <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.9}
        >
         <View style={styles.imageContainer}>
  <Image source={{ uri: item.photo_url }} style={styles.image} />

  {/* Buy It Now Badge */}
  {item.buy_it_now && (
    <View style={styles.buyItNowBadge}>
      <Text style={styles.buyItNowText}>BUY NOW</Text>
    </View>
  )}

           {/* Must Sell Badge */}
{(Number(item.is_must_sell) === 1 || item.selling_strategy === 'must_sell') && (
  <View style={styles.mustSellBadge}>
    <Text style={styles.mustSellText}>⚡ MUST SELL</Text>
  </View>
)}


  {/* Wishlist Goat Badge - Bottom Right of Image */}
  <Animated.View style={styles.wishlistIconWrapper}>
    <GoatGenieBadge onWish={() => handleAddToWishlist(item)} />
  </Animated.View>
  </View>

           <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

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
              <MaterialCommunityIcons name="clock-outline" size={14} color={isUrgent ? '#c62828' : '#2e7d32'} style={{marginHorizontal: 4}}/>
             <Text style={[styles.statsText, isUrgent ? styles.urgentText : styles.timeText]}>
              {item.auction_ends_at ? formatTimeWithSeconds(item.auction_ends_at, now) : 'Not auctioned'}
             </Text>
            </View>

           {item.seller && (
             <View style={styles.sellerRow}>
               {!!(item.seller.avatar) && (
                 <Image source={{ uri: item.seller.avatar }} style={styles.sellerAvatar} />
               )}
               <TouchableOpacity
                 style={styles.sellerNameContainer}
                 onPress={() => {
                   if (item.seller?.id) {
                     router.push(`/seller/${item.seller.id}`);
                   }
                 }}
               >
                 <Text style={styles.sellerName} numberOfLines={1}>{item.seller.username}</Text>
               </TouchableOpacity>
               {typeof item.seller.avg_rating === 'number' && item.seller.avg_rating > 0 && (
                 <View style={styles.ratingContainer}>
                   <Ionicons name="star" size={12} color="#FFD700" />
                   <Text style={styles.ratingText} numberOfLines={1}>
                     {item.seller.avg_rating.toFixed(1)} ({item.seller.total_reviews || 0})
                   </Text>
                 </View>
               )}
             </View>
           )}

{item.isDerived && !isAuctionEnded && (
  <Text style={{ fontSize: 10, color: '#999' }}>⏳ Estimated end time</Text>
)}
          </View>
        </TouchableOpacity>



    );
  };
 return (
  <View style={{ flex: 1, backgroundColor }}>
    <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => `discover-${item.id}`}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.columnWrapper}

      ListHeaderComponent={
        <View style={{ backgroundColor }}>
          <View style={{ padding: 16, paddingTop: 32, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme === 'dark' ? '#333' : '#eee', flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>Discover Treasures</Text>
              <Text style={{ fontSize: 14, color: theme === 'dark' ? '#999' : '#666' }}>Find unique pieces from verified sellers</Text>
            </View>
          </View>
        </View>

      }
      stickyHeaderIndices={[0]}

      ListFooterComponent={
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <Text style={{ color: '#666' }}>You&#39;ve reached the end 🐐</Text>
          )}
        </View>
      }

      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      onEndReached={async () => {
        setLoading(true);
        await new Promise(res => setTimeout(res, 1500));
        setLoading(false);
      }}
      onEndReachedThreshold={0.5}
    />
  </View>
);
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingTop: HEADER_MAX_HEIGHT + 16,
    paddingBottom: 100,
  },
  wishlistIconWrapper: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 2,
    padding: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  timeText: {
    color: '#38a169',
    fontWeight: '600',
  },
  urgentText: {
    color: '#c62828',
    fontWeight: '700',
  },
  mustSellBadge: {
  position: 'absolute',
  top: 8,
  left: 8,
  backgroundColor: '#FF6B35',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 6,
  zIndex: 5,
},
mustSellText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 0.5,
},

  columnWrapper: {
    gap: COLUMN_GAP,
    justifyContent: 'space-between',
  },
  itemContainer: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'visible', // Changed to visible so badge isn't clipped
  },
  buyItNowBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 10, // Higher z-index to show above wishlist badge
    elevation: 10, // Android elevation
  },
  buyItNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  image: {
    width: '100%',
    height: ITEM_WIDTH * 1.2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  priceTagContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  priceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  priceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bidLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },
  infoContainer: {
    padding: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 17,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  sellerNameContainer: {
    flexShrink: 1,
    flexGrow: 0,
    marginRight: 6,
  },
  sellerName: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 6,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 13,
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
  loader: {
    marginVertical: 20,
    alignSelf: 'center',
  },
});

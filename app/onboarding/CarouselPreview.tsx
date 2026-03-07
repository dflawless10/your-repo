import { API_BASE_URL } from '@/config';

import React, { useEffect,  useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { formatTimeWithSeconds } from '@/utils/time';
import { useWishlist } from 'app/wishlistContext';
import { useAppDispatch } from 'hooks/reduxHooks';
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import {goatSounds, playGoatSoundByName} from "@/assets/sounds/officialGoatSoundsSoundtrack";
const { width } = Dimensions.get('window');
const TEN_MIN_MS = 10 * 60 * 1000;
const LAST_GOAT_KEY = 'last_goat_sound_ts';

type Category = 'Just Listed' | 'Create Auction' | 'Sell Now';

type CarouselItem = {
  id: number;
  title: string;
  price?: number;
  bid_count?: number;
  image: { uri: string };
  countdown?: string;
  auctionEndsAt?: string;
  description?: string;
  buy_it_now?: number;
  original_price?: number;
  relist_count?: number;
  seller?: {
    id: number;
    username: string;
    avatar_url?: string;
    avg_rating: number;
    positive_percent: number;
    total_reviews: number;
    joined?: string;
  };
};



interface Props {
  category: Category;
  onFirstSwipe?: () => void;
}

const API_URL = API_BASE_URL;

// Helper function to get countdown color based on time remaining
const getCountdownColor = (endTime: string): string => {
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const diffHours = (end - now) / (1000 * 60 * 60);

  if (diffHours <= 2) {
    return '#E53E3E'; // Bright red if ≤2h
  } else if (diffHours <= 24) {
    return '#c53030'; // Red if ≤24h
  }
  return '#38a169'; // Green otherwise
};

const CarouselPreview: React.FC<Props> = ({ category, onFirstSwipe }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;
  const lastGoatRef = useRef<number>(0);
  const hasTriggeredSwipe = useRef(false);
  const [loading, setLoading] = useState(true);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [favoritedItems, setFavoritedItems] = useState<Record<number, boolean>>({});

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { wishlistIds, addToWishlist, removeFromWishlist, refreshWishlist } = useWishlist();

  // 🧠 Load last goat sound timestamp
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(LAST_GOAT_KEY)
      .then((v) => {
        if (mounted) {
          const parsed = v ? Number(v) : 0;
          lastGoatRef.current = Number.isFinite(parsed) ? parsed : 0;
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // 🪄 Animate on category change
  useEffect(() => {
    fade.setValue(0);
    scale.setValue(0.98);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
    ]).start();
  }, [category]);

  // 🧩 Load favorites from storage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem('favoritedItems');
        if (stored) {
          setFavoritedItems(JSON.parse(stored));
        }
      } catch (err) {
        console.error('🐐 Carousel: Failed to load favorites:', err);
      }
    };
    loadFavorites();
  }, []);

  // 🧩 Fetch items based on category
  useEffect(() => {
    const fetchItems = async () => {
  setLoading(true); // 🪄 Start shimmer

  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      console.warn('🐐 Carousel: No token found');
      setLoading(false);
      return;
    }

    // Map category to endpoint
    const endpoints = {
      'Just Listed': `${API_BASE_URL}/api/just-listed`,
      'Create Auction': `${API_BASE_URL}/api/just-listed`,
      'Sell Now': `${API_BASE_URL}/api/shop/relisted-discounts`,
    };

    const url = endpoints[category];
    console.log(`🐐 Carousel fetching from: ${url}`);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`🐐 ${category} API response - full data:`, data);
      console.log(`🐐 ${category} API response - first item:`, JSON.stringify(data.items?.[0] || data.auctions?.[0], null, 2));

      // Handle different response formats
      const rawItems = data.items || data.auctions || [];
      const mapped = rawItems.map((item: any) => {
        const rawTimestamp = item.auctionEndsAt ?? item.auction_ends_at ?? item.endDate ?? '';
        const safeTimestamp = rawTimestamp.includes('T')
          ? rawTimestamp
          : rawTimestamp.replace(' ', 'T') + 'Z';

        const timeText = formatTimeWithSeconds(safeTimestamp, Date.now());

        // Debug seller data
        if (item.seller) {
          console.log(`🐐 Item ${item.id} has seller:`, item.seller.username, 'joined:', item.seller.joined);
        } else {
          console.warn(`🐐 Item ${item.id} missing seller data`);
        }

        return {
          id: item.id,
          title: item.name || item.title,
          price: item.highest_bid?.toString() || item.current_bid?.toString() || item.price?.toString() || item.currentPrice?.toString() || '0.00',
          bid_count: item.bid_count || item.bidCount || 0,
          image: { uri: item.photo_url || item.image },
          countdown: timeText,
          auctionEndsAt: safeTimestamp,
          description: item.description || '',
          buy_it_now: item.buy_it_now || item.buyItNow,
          original_price: item.original_price || item.originalPrice,
          relist_count: item.relist_count || item.relistCount || 0,
          seller: item.seller ? {
            id: item.seller.id,
            username: item.seller.username,
            avatar_url: item.seller.avatar_url,
            avg_rating: item.seller.avg_rating || 0,
            positive_percent: item.seller.positive_percent || 0,
            total_reviews: item.seller.total_reviews || 0,
            joined: item.seller.joined,
          } : undefined,
        };
      });

      setCarouselItems(mapped); // 🐐 Load complete
      console.log(`🐐 Loaded ${mapped.length} items, ${mapped.filter((i: CarouselItem) => i.seller).length} with seller info`);
    }
  } catch (err) {
    console.warn('Failed to fetch carousel items:', err);
  } finally {
    setLoading(false); // 🧼 Stop shimmer
  }
};

    fetchItems();
  }, [category]);

  // 📊 Load seller meta directly into items when jewelry-box doesn't provide it
  useEffect(() => {
    let cancelled = false;

    const enrichWithSellerData = async () => {
      // Only fetch if items are missing seller data
      const itemsNeedingSeller = carouselItems.filter(item => !item.seller);
      if (itemsNeedingSeller.length === 0) return;

      console.log(`🐐 Fetching seller data for ${itemsNeedingSeller.length} items...`);

      const enrichedItems = await Promise.all(
        carouselItems.map(async (item) => {
          // Already has a seller? Keep as-is
          if (item.seller) return item;

          try {
            // Fetch individual item to get seller info
            const itemRes = await fetch(`${API_BASE_URL}/item/${item.id}`);
            if (!itemRes.ok) return item;

            const itemData = await itemRes.json();
            console.log(`🐐 Fetched seller for item ${item.id}:`, itemData.seller?.username);

            if (itemData) {
            console.log('🧪 item snapshot:', itemData);
            } else {
            console.warn(`🧪 item snapshot for item ${item.id} is null or undefined`);
            }


            if (!itemData.seller) return item;

            // Get seller rating from seller endpoint
            let avg_rating = 0;
            let positive_percent = 0;
            let total_reviews = 0;

            try {
              const sellerRes = await fetch(`${API_BASE_URL}/seller/${itemData.seller.id}`);
              if (sellerRes.ok) {
                const sellerData = await sellerRes.json();
                avg_rating = sellerData?.review_stats?.avg_rating || 0;
                positive_percent = sellerData?.review_stats?.positive_percent || 0;
                total_reviews = sellerData?.review_stats?.total_reviews || 0;
              }
           } catch (err) {
  console.warn(`🐐 Could not fetch seller stats for ${itemData.seller.id}:`, err);
 avg_rating = 0;
positive_percent = 0;
total_reviews = 0;

}


            // Return enriched item
            return {
              ...item,
              seller: {
                id: itemData.seller.id,
                username: itemData.seller.username,
                avatar_url: itemData.seller.avatar_url,
                avg_rating,
                positive_percent,
                total_reviews,
                joined: itemData.seller.joined,
              },
            };
          } catch (err) {
            console.warn(`🐐 Failed to enrich item ${item.id}:`, err);
            return item;
          }
        })
      );

      if (!cancelled) {
        setCarouselItems(enrichedItems);
        console.log(`🐐 Enriched! Now ${enrichedItems.filter(i => i.seller).length}/${enrichedItems.length} have seller info`);
      }
    };

    if (carouselItems.length > 0) {
      enrichWithSellerData();
    }

    return () => {
      cancelled = true;
    };
  }, [carouselItems.length]); // Only run when item count changes, not on every item update

  useEffect(() => {
  // Set up interval that checks every 10 minutes
  const interval = setInterval(() => {
    // Use ref to access current items without adding to dependencies
    const titleLen = carouselItems.length > 0 
      ? (carouselItems[Math.floor(Math.random() * carouselItems.length)]?.title?.length || 10)
      : 10;

    maybePlayGoat(titleLen);
  }, TEN_MIN_MS);

  return () => clearInterval(interval);
}, []); // Empty dependency array - only run once on mount


  const maybePlayGoat = async (titleLen: number) => {
  const now = Date.now();
  if (now - lastGoatRef.current >= TEN_MIN_MS) {
    try {
      console.log('🐐 Triggering goat sound with titleLen:', titleLen);

      const index = Math.min(goatSounds.length - 1, Math.max(0, titleLen % goatSounds.length));
      const selectedSoundName = goatSounds[index].name;

      await playGoatSoundByName(selectedSoundName);

      lastGoatRef.current = now;
      await AsyncStorage.setItem(LAST_GOAT_KEY, String(now));
    } catch (error) {
      console.warn('🐐 Unable to play goat sound:', error);
    }
  }
};


  // 💖 Favorite toggle - syncs with backend and navigates to JewelryBox
  const handleFavoriteTap = async (item: CarouselItem) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.warn('🐐 Carousel: No token found');
        return;
      }

      const isFavorited = favoritedItems[item.id];
      const updated = {
        ...favoritedItems,
        [item.id]: !isFavorited,
      };

      // Update local state immediately
      setFavoritedItems(updated);

      // Save to AsyncStorage
      await AsyncStorage.setItem('favoritedItems', JSON.stringify(updated));

      // Sync with backend
      if (!isFavorited) {
        // Add to favorites
        await fetch(`${API_BASE_URL}/api/favorites`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: item.id }),
        });
        console.log(`🐐 Carousel: Item ${item.id} added to favorites`);

        // Navigate to JewelryBox only when adding
        router.push('/JewelryBoxScreen');
      } else {
        // Remove from favorites
        await fetch(`${API_BASE_URL}/api/favorites/${item.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log(`🐐 Carousel: Item ${item.id} removed from favorites`);
      }
    } catch (err) {
      console.error('🐐 Carousel: Failed to toggle favorite:', err);
    }
  };

  // 📊 Track click-to-seller (CTS) for rewards
  const trackSellerClick = async (sellerId: number, itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.warn('🐐 No token found for CTS tracking');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/track-cts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seller_id: sellerId,
          item_id: itemId,
          source: 'carousel',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log('🐐 CTS tracked successfully');
      } else {
        console.warn(`🐐 CTS tracking failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to track CTS:', error);
    }
  };

  // 🔗 Navigate to the seller profile with tracking
  const handleSellerTap = (item: CarouselItem) => {
    if (!item.seller) return;
    trackSellerClick(item.seller.id, item.id);
    router.push(`/seller/${item.seller.id}?from=carousel&itemId=${item.id}`);
  };
  // Show loading or empty state
  if (loading) {
    return (
      <View style={{ height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 16, color: '#999' }}>Loading carousel...</Text>
      </View>
    );
  }

  if (carouselItems.length === 0) {
    return (
      <View style={{ height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 16, color: '#999' }}>No featured items yet 🐐</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
      <Carousel
        key={category}
        loop
        width={width}
        height={300}
        autoPlay={carouselItems.length > 1}
        data={carouselItems}
        scrollAnimationDuration={2000}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        onSnapToItem={(index) => {
          const item = carouselItems[index];
          if (item) maybePlayGoat(item.title.length);
          if (!hasTriggeredSwipe.current && onFirstSwipe) {
            hasTriggeredSwipe.current = true;
            onFirstSwipe();
          }
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/item/${item.id}`)}
            activeOpacity={0.9}
            style={styles.cardWrapper}
          >
            <View style={styles.card}>
              {/* Image Container */}
              <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />

                {/* Buy It Now Badge - Top Left */}
                {!!item.buy_it_now && (
                  <View style={styles.buyItNowBadge}>
                    <Text style={styles.buyItNowText}>BUY NOW</Text>
                  </View>
                )}

                {/* Discount Badge - Top Left (below Buy Now if both exist) */}
                {item.original_price && item.price && item.original_price > item.price && (
                  <View style={[styles.discountBadge, !!item.buy_it_now && { top: 40 }]}>
                    <Text style={styles.discountText}>
                      {Math.round(((item.original_price - Number(item.price)) / item.original_price) * 100)}% OFF
                    </Text>
                  </View>
                )}

                {/* Favorite Heart - Top Right */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleFavoriteTap(item);
                  }}
                  style={styles.heartButton}
                >
                  <Ionicons
                    name={favoritedItems[item.id] ? "heart" : "heart-outline"}
                    size={24}
                    color="#6A0DAD"
                  />
                </TouchableOpacity>

              </View>

              {/* Info Container */}
              <View style={styles.infoContainer}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.cardPrice}>
                    ${Number(item.price || 0).toFixed(2)}
                  </Text>
                  {(item.bid_count ?? 0) > 0 && (
                    <Text style={styles.bidBadge}>{item.bid_count} BIDS</Text>
                  )}
                </View>

                <View style={styles.bottomRow}>
                  {item.countdown && item.auctionEndsAt && (
                    <View style={styles.statsContainer}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                      <Text
                        style={[
                          styles.statsText,
                          { color: getCountdownColor(item.auctionEndsAt) },
                        ]}
                        numberOfLines={1}
                      >
                        {item.countdown}
                      </Text>
                    </View>
                  )}

                  {item.seller && (
                    <View style={styles.sellerRatingRow}>
                      {item.seller.avatar_url && (
                        <Image source={{ uri: item.seller.avatar_url }} style={styles.sellerAvatar} />
                      )}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleSellerTap(item);
                        }}
                      >
                        <Text style={styles.sellerName} numberOfLines={1}>
                           {item.seller.username}
                        </Text>
                      </TouchableOpacity>
                      {item.seller.avg_rating > 0 && (
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.ratingText}>
                            {item.seller.avg_rating.toFixed(1)} ({item.seller.total_reviews})
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />


    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: 8,
  },
  card: {
    width: width * 0.85,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#BB86FC',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  sellerName: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginLeft: 4,
  },
  sellerRow: {
    marginTop: 4,
  },
  buyItNowBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 10,
    elevation: 10,
  },
  buyItNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E53935',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 9,
    elevation: 9,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default CarouselPreview;

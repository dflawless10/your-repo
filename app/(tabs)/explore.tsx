import { API_BASE_URL } from '@/config';
import React, { useCallback, useState, useMemo, useRef } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Modal,
  Share,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCountdownLocal, getTimeColor } from '@/utils/time';
import Toast from 'react-native-toast-message';
import { useWishlist } from '@/app/wishlistContext';
import { useAppDispatch, useAppSelector } from 'hooks/reduxHooks';
import { addToWishlist } from 'app/wishlistslice';
import { addItem } from '@/utils/cartSlice';
import GoatGenieBadge from '@/app/GoatGenieBadge';
import { ListedItem } from '@/types/items';
import { useTheme } from '@/app/theme/ThemeContext';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';



// Constants
const COLUMN_GAP = 12;




type ListedItemWithStatus = ListedItem & {
  isWishlisted: string;
  isFavorited: boolean;

};


function shuffleArray(array: ListedItem[]): ListedItem[] {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

const JustListedCard = React.memo(
  ({
    item,
    isFavorited,
    isWishlisted,
    toggleFavorite,
    onWishlistTap,
    onShare,
    itemWidth,
  }: {
    item: ListedItem;
    isFavorited: boolean;
    isWishlisted: boolean;
    toggleFavorite: (id: number) => void;
    onWishlistTap: (item: ListedItem) => void;
    onShare: (item: ListedItem) => void;
    itemWidth: number;
  }) => {
    const { timeText } = getCountdownLocal(item.auction_ends_at);
    const timeColor = getTimeColor(item.auction_ends_at);
    const displayPrice = Number(item.highest_bid ?? item.buy_it_now ?? item.price ?? 0);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/item/${item.id}` as const)}
        activeOpacity={0.9}
        style={styles.cardWrapper}
      >

        <View style={[styles.carouselCard, { width: itemWidth }]}>

          {/* Image Container */}
          <View style={[styles.imageContainer, { height: itemWidth * 1.2 }]}>
            <Image source={{ uri: item.photo_url }} style={styles.carouselImage} resizeMode="cover" />

            {/* Heart Icon - Top Right */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
              style={styles.heartIconOverlay}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={24}
                color="#6A0DAD"
              />
            </TouchableOpacity>

            {/* GoatGenieBadge - Wishlist Badge */}
            <View style={styles.wishlistCoinOverlay}>
              <GoatGenieBadge
                onWish={() => {
                  onWishlistTap(item);
                }}
              />
            </View>

            {/* Must Sell Badge - Top Left */}
            {(item.mustSell || item.is_super_deal) && (
              <View style={styles.mustSellBadge}>
                <Text style={styles.mustSellText}>MUST SELL</Text>
              </View>
            )}

            {/* Buy It Now Badge - Top Left (below Must Sell if present) */}
            {item.buy_it_now && (
              <View style={[styles.buyItNowBadge, (item.mustSell || item.is_super_deal) ? { top: 40 } : undefined]}>
                <Text style={styles.buyItNowText}>BUY NOW</Text>
              </View>
            )}
          </View>

          {/* Info Container */}
          <View style={styles.infoContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.name}
            </Text>

            <View style={styles.productPriceRow}>
              <Text style={styles.productPrice}>
                ${displayPrice.toFixed(2)}
              </Text>
              {(item.bidCount ?? item.bid_count ?? 0) > 0 && (
                <Text style={styles.bidBadge}>{item.bidCount ?? item.bid_count} BIDS</Text>
              )}
            </View>

            {item.auction_ends_at && (
              <View style={styles.statsContainer}>
                <Ionicons name="time-outline" size={14} color={timeColor} />
                <Text
                  style={[
                    styles.statsText,
                    { color: timeColor },
                  ]}
                  numberOfLines={1}
                >
                  {timeText}
                </Text>
              </View>
            )}

            {item.seller && (
              <View style={styles.sellerRatingRow}>
                {item.seller?.avatar_url && (
                  <Image source={{ uri: item.seller.avatar_url }} style={styles.sellerAvatar} />
                )}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/seller/${item.seller?.id}` as const);
                  }}
                  activeOpacity={0.7}
                  style={styles.sellerNameContainer}
                >
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.seller?.username}
                  </Text>
                </TouchableOpacity>
                {((item.seller?.avg_rating || 0) > 0 || (item.seller?.total_reviews || 0) > 0) && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {(item.seller?.avg_rating || 0).toFixed(1)}{' '}
                    </Text>
                    <Text style={styles.reviewCount}>
                      ({item.seller?.total_reviews || 0})
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

JustListedCard.displayName = 'JustListedCard';

export default function TabTwoScreen() {
  const {theme, colors} = useTheme();
  const { width, height } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Reactive landscape constants
  const isLandscape = useMemo(() => width > height, [width, height]);
  const NUM_COLUMNS = useMemo(() => isLandscape ? 3 : 2, [isLandscape]);
  const COLUMN_GAP = 12
  // Responsive card width — fills available grid space for current orientation/columns
  const ITEM_WIDTH = useMemo(
    () => (width - 32 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
    [width, NUM_COLUMNS]
  );
  const TRENDING_CARD_WIDTH = 190;
  const TRENDING_CARD_HEIGHT = useMemo(() => TRENDING_CARD_WIDTH * 1.2, [TRENDING_CARD_WIDTH]); // Image height
  const trendingHeight = useMemo(() => TRENDING_CARD_HEIGHT + 165, [TRENDING_CARD_HEIGHT]); // Image + info container + padding
  const titleLineHeight = useMemo(() => isLandscape ? 16 : 18, [isLandscape]);
  const countdownFont = useMemo(() => isLandscape ? 11 : 12, [isLandscape]);
  const countdownMargin = useMemo(() => isLandscape ? 2 : 4, [isLandscape]);
  const sectionSpacing = useMemo(() => isLandscape ? 12 : 24, [isLandscape]);
  const trendingSectionPadding = useMemo(() => isLandscape ? 4 : 8, [isLandscape]);
  const trendingSectionMargin = useMemo(() => isLandscape ? 8 : 12, [isLandscape]);



  const [justListedItems, setJustListedItems] = useState<ListedItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<ListedItem[]>([]);
  const [favoritedItems, setFavoritedItems] = useState<Record<number, boolean>>({});


  // Filter states
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedStone, setSelectedStone] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const {wishlistIds, refreshWishlist, addToWishlist: addToWishlistBackend} = useWishlist();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user.profile);

  // Load user info for header
  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedAvatar = await AsyncStorage.getItem('avatarUrl');
        setUsername(storedUsername);
        setAvatarUrl(storedAvatar);
      };
      void loadUser();

      // Fade in title
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      return () => {
        titleOpacity.setValue(0);
      };
    }, [titleOpacity])
  );


  const toggleFavorite = useCallback(async (id: number) => {
    const updated = {
      ...favoritedItems,
      [id]: !favoritedItems[id],
    };

    setFavoritedItems(updated);

    try {
      // Save to AsyncStorage for offline support
      await AsyncStorage.setItem('favoritedItems', JSON.stringify(updated));
      console.log(`Favorited item ${id} stored locally`);

      // Sync with backend
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        if (updated[id]) {
          // Add to favorites
          await fetch(`${API_BASE_URL}/api/favorites`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({item_id: id}),
          });
          console.log(`🐐 Item ${id} synced to backend favorites`);
        } else {
          // Remove from favorites
          await fetch(`${API_BASE_URL}/api/favorites/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          console.log(`🐐 Item ${id} removed from backend favorites`);
        }
      }
    } catch (err) {
      console.error('Failed to sync favorite:', err);
    }

    if (updated[id]) {
      console.log(`TappedHeart activated for item ${id} 🫀 Redirecting to JewelryBoxScreen`);
      router.push('/JewelryBoxScreen');
    }
  }, [favoritedItems]);

  const loadFavoritesFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('favoritedItems');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavoritedItems(parsed);
        console.log('🐐 Explore: Loaded favorites from storage:', parsed);
      }
    } catch (err) {
      console.error('🐐 Explore: Failed to load favorites:', err);
    }
  };

  const handleShare = useCallback(async (item: ListedItem) => {
    try {
      const message = `Check out this ${item.name} on BidGoat! 💎\n\nPrice: $${((item.highest_bid ?? item.buy_it_now ?? item.price) ?? 0).toFixed(2)}\n\nView: https://bidgoat.com/listing/${item.id}`;

      const result = await Share.share({
        message,
        title: item.name,
        url: `https://bidgoat.com/listing/${item.id}`,
      });

      if (result.action === Share.sharedAction) {
        Toast.show({
          type: 'success',
          text1: 'Shared Successfully! 🎉',
          text2: 'Thanks for spreading the word!',
          visibilityTime: 2000,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  const fetchTrending = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/just-listed`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.items)) {
          const sortedItems = data.items
            .sort((a: ListedItem, b: ListedItem) => (b.bidCount ?? 0) - (a.bidCount ?? 0))
            .slice(0, 10);
          setTrendingItems(sortedItems);
        }
      }
    } catch (err) {
      console.error('Failed to fetch trending items:', err);
    }
  };

  const fetchJustListed = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.warn('No token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/just-listed`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Response not OK:', await response.text());
        return;
      }

      const data = await response.json();

      if (Array.isArray(data.items)) {
        const normalizeTimestamp = (timestamp: string): string => {
          if (!timestamp?.trim()) return '';
          return timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T') + 'Z';
        };

        const safeItems = data.items
          .filter((item: any) => item.buy_it_now && item.buy_it_now > 0) // Filter for Buy It Now only (has a buy_it_now price)
          .map((item: any) => {
            const rawTimestamp = item.auctionEndsAt ?? item.auction_ends_at ?? '';
            const safeTimestamp = normalizeTimestamp(rawTimestamp);

            return {
              ...item,
              auction_ends_at: safeTimestamp,
              price: Number(item.price ?? item.buy_it_now ?? 0), // Add default price
              highest_bid: item.highest_bid ? Number(item.highest_bid) : undefined,
            };
          });

        setJustListedItems(shuffleArray(safeItems));
      } else {
        console.warn('🐐 No items array in response:', data);
        setJustListedItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch just listed items:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void fetchJustListed();
      void fetchTrending();
      void loadFavoritesFromStorage();
      void loadSortPreference();
    }, [])
  );





  // Load sort preference from storage
  const loadSortPreference = async () => {
    try {
      const savedSort = await AsyncStorage.getItem('exploreSortPreference');
      if (savedSort) {
        setSortBy(savedSort);
      }
    } catch (error) {
      console.log('Failed to load sort preference:', error);
    }
  };

  // Save sort preference
  const handleSortChange = async (newSort: string) => {
    setSortBy(newSort);
    setSortModalVisible(false);
    try {
      await AsyncStorage.setItem('exploreSortPreference', newSort);
    } catch (error) {
      console.log('Failed to save sort preference:', error);
    }
  };

  const handleWishlistTap = useCallback(async (item: ListedItem) => {
    console.log('🐐 Explore: Adding item to wishlist:', item.id, item.name);

    try {
      // Add to the backend first
      await addToWishlistBackend(item.id);
      console.log('🐐 Explore: Added to backend successfully');

      // Then update Redux state
      const listedItem: ListedItem = {
        ...item,
        isWishlisted: 'true',
        tags: item.tags ?? '',
        image_url: item.image_url ?? item.photo_url,
        quantity_available: item.quantity_available ?? 1,
      };
      dispatch(addToWishlist(listedItem));

      // Navigate with a small delay
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push('/wishlist');

      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/wishlist`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer token`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({auction_id: item.id}),
        });
      }
    } catch (err) {
      console.error('Failed to sync wishlist with backend:', err);
    }

    await refreshWishlist();

    Toast.show({
      type: 'success',
      text1: 'Added to Wishlist 🐐',
      text2: item.name,
      visibilityTime: 2000,
      position: 'top',
    });
  }, [addToWishlistBackend, dispatch, refreshWishlist]);

  const handleAddToCart = async (item: ListedItem) => {
    // CHECK: Is this the seller's own item?
    if (user?.id && item.seller?.id && user.id === Number(item.seller.id)) {
      Alert.alert('Cannot Add to Cart', 'Sorry, buyers cannot add their own items to the cart');
      return;
    }

    try {
      // Check with backend FIRST before updating UI
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Please sign in', 'You need to be signed in to add items to cart');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({item_id: item.id, quantity: 1}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Cannot Add to Cart', errorData.error || 'Failed to add to cart');
        return;
      }

      // Backend approved - NOW update Redux and show success
      await response.json(); // Consume response body

      dispatch(addItem({
        id: item.id,
        name: item.name,
        price: item.price ?? 0,
        quantity: 1,
        photo_url: item.photo_url,
        theme: 'default',
        isInCart: true,
      }));

      Toast.show({
        type: 'success',
        text1: 'Added to Cart 🛒',
        text2: item.name,
        visibilityTime: 2000,
        position: 'top',
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add to cart. Please try again.');
    }
  };

  const cartItemsRedux = useAppSelector((state) => state.cart.items);
  const cartItemIds = useMemo(() => new Set(cartItemsRedux.map(i => String(i.id))), [cartItemsRedux]);

  const uniqueItems = justListedItems.filter((item, index, self) =>
    index === self.findIndex((t) => t.id === item.id) && !cartItemIds.has(String(item.id))
  );

  // Apply filters
  const filteredItems = uniqueItems.filter(item => {
    const price = item.highest_bid ?? item.buy_it_now ?? item.price ?? 0;
    const itemTags = (item.tags || '').toLowerCase();
    const itemName = (item.name || '').toLowerCase();
    const itemDesc = (item.description || '').toLowerCase();

    // Metal filter
    if (selectedMetal !== 'All') {
      const metalMatch = itemTags.includes(selectedMetal.toLowerCase()) ||
        itemName.includes(selectedMetal.toLowerCase()) ||
        itemDesc.includes(selectedMetal.toLowerCase());
      if (!metalMatch) return false;
    }

    // Stone filter
    if (selectedStone !== 'All') {
      const stoneMatch = itemTags.includes(selectedStone.toLowerCase()) ||
        itemName.includes(selectedStone.toLowerCase()) ||
        itemDesc.includes(selectedStone.toLowerCase());
      if (!stoneMatch) return false;
    }

    // Type filter
    if (selectedType !== 'All') {
      const typeMatch = itemTags.includes(selectedType.toLowerCase()) ||
        itemName.includes(selectedType.toLowerCase()) ||
        itemDesc.includes(selectedType.toLowerCase());
      if (!typeMatch) return false;
    }

    // Price range filter
    if (priceRange !== 'All') {
      if (priceRange === 'under100' && price >= 100) return false;
      if (priceRange === '100-500' && (price < 100 || price > 500)) return false;
      if (priceRange === '500-1000' && (price < 500 || price > 1000)) return false;
      if (priceRange === 'over1000' && price < 1000) return false;
    }

    return true;
  });

  // Apply sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    const priceA = a.highest_bid ?? a.buy_it_now ?? a.price ?? 0;
    const priceB = b.highest_bid ?? b.buy_it_now ?? b.price ?? 0;

    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'ending_soon') {
      const endA = new Date(a.auction_ends_at || 0).getTime();
      const endB = new Date(b.auction_ends_at || 0).getTime();
      return endA - endB;
    }
    if (sortBy === 'most_popular') {
      // Sort by bid count + watchers (popularity indicator)
      const popularityA = (a.bidCount || a.bid_count || 0) + (a.watching_count || 0);
      const popularityB = (b.bidCount || b.bid_count || 0) + (b.watching_count || 0);
      return popularityB - popularityA;
    }
    if (sortBy === 'seller_rating') {
      // Sort by seller rating (highest first)
      const ratingA = a.seller?.avg_rating || 0;
      const ratingB = b.seller?.avg_rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      // If same rating, sort by review count
      const reviewsA = a.seller?.total_reviews || 0;
      const reviewsB = b.seller?.total_reviews || 0;
      return reviewsB - reviewsA;
    }
    if (sortBy === 'relevance') {
      // Best match algorithm: combines multiple factors
      const scoreA =
        (a.bidCount || a.bid_count || 0) * 3 + // Bid activity weighted heavily
        (a.watching_count || 0) * 2 + // Watchers weighted moderately
        (a.seller?.avg_rating || 0) * 10 + // Seller rating weighted heavily
        (a.is_must_sell ? 5 : 0); // Must sell items get bonus
      const scoreB =
        (b.bidCount || b.bid_count || 0) * 3 +
        (b.watching_count || 0) * 2 +
        (b.seller?.avg_rating || 0) * 10 +
        (b.is_must_sell ? 5 : 0);
      return scoreB - scoreA;
    }
    // Default: newest
    const dateA = new Date(a.listed_at || a.listedAt || 0).getTime();
    const dateB = new Date(b.listed_at || b.listedAt || 0).getTime();
    return dateB - dateA;
  });

  const itemsWithWatchStatus = sortedItems.map((item: ListedItem) => ({
    ...item,
    isWishlisted: wishlistIds.includes(item.id) ? 'true' : 'false', // ✅ string
    isFavorited: favoritedItems[item.id],
  }));

  const renderItem = useCallback(
    ({item}: { item: ListedItemWithStatus }) => (
      <JustListedCard
        item={item}
        isFavorited={item.isFavorited}
        isWishlisted={item.isWishlisted === 'true'}
        toggleFavorite={toggleFavorite}
        onWishlistTap={handleWishlistTap}
        onShare={handleShare}
        itemWidth={ITEM_WIDTH}
      />
    ),
    [toggleFavorite, handleWishlistTap, handleShare, ITEM_WIDTH]
  );

  const renderTrendingItem = useCallback(
    ({item}: { item: ListedItemWithStatus }) => (
      <JustListedCard
        item={item}
        isFavorited={item.isFavorited}
        isWishlisted={item.isWishlisted === 'true'}
        toggleFavorite={toggleFavorite}
        onWishlistTap={handleWishlistTap}
        onShare={handleShare}
        itemWidth={TRENDING_CARD_WIDTH}
      />
    ),
    [toggleFavorite, handleWishlistTap, handleShare, TRENDING_CARD_WIDTH]
  );
  return (
    <ThemedView style={{flex: 1}}>
      {/* EnhancedHeader */}
      <EnhancedHeader
        scrollY={scrollY}
        username={username}
        avatarUrl={avatarUrl ?? undefined}
        onSearch={(q) => console.log('Explore search:', q)}
        onSelect={(result) => {
          if (result.type === 'item') {
            router.push(`/item/${result.value}`);
          }
        }}
      />

      <Animated.ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{
    paddingTop: HEADER_MAX_HEIGHT,
    paddingBottom: 40,
  }}
  showsVerticalScrollIndicator={false}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  )}
  scrollEventThrottle={16}
>
  <Animated.View
    style={[
      styles.exploreTitleContainerInline,
      {
        opacity: titleOpacity,
        marginTop: 24, // adjust this number until it looks perfect
      },
    ]}
  >
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
    </TouchableOpacity>
    <Text style={[styles.exploreTitle, { color: colors.textPrimary }]}>
      Explore
    </Text>
  </Animated.View>


      {/* Clean Filter Tabs */}
      <ThemedView style={styles.filtersSection}>
        {/* Filter Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              {backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: '#6A0DAD'},
              sortBy !== 'newest' && {borderColor: '#6A0DAD', borderWidth: 2}
            ]}
            onPress={() => setSortModalVisible(true)}
          >
            <Ionicons name="swap-vertical" size={18}
                      color={sortBy !== 'newest' ? '#6A0DAD' : (theme === 'dark' ? '#ECEDEE' : '#666')}/>
            <Text style={[
              styles.filterTabText,
              {color: theme === 'dark' ? '#ECEDEE' : '#333'},
              sortBy !== 'newest' && {color: '#6A0DAD', fontWeight: '700'}
            ]}>
              Sort {sortBy !== 'newest' && '•'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              {backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: '#FF6B6B'},
              activeFilterTab === 'metal' && styles.filterTabActive
            ]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'metal' ? null : 'metal')}
          >
            <Text style={[
              styles.filterTabText,
              {color: theme === 'dark' && activeFilterTab !== 'metal' ? '#ECEDEE' : '#333'},
              activeFilterTab === 'metal' && styles.filterTabTextActive
            ]}>
              Metal {selectedMetal !== 'All' && '•'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={activeFilterTab === 'metal' ? '#FFF' : theme === 'dark' ? '#ECEDEE' : '#666'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              {backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: '#FF6B6B'},
              activeFilterTab === 'gems' && styles.filterTabActive
            ]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'gems' ? null : 'gems')}
          >
            <Text style={[
              styles.filterTabText,
              {color: theme === 'dark' && activeFilterTab !== 'gems' ? '#ECEDEE' : '#333'},
              activeFilterTab === 'gems' && styles.filterTabTextActive
            ]}>
              Gems {selectedStone !== 'All' && '•'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={activeFilterTab === 'gems' ? '#FFF' : theme === 'dark' ? '#ECEDEE' : '#666'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              {backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: '#FF6B6B'},
              activeFilterTab === 'type' && styles.filterTabActive
            ]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'type' ? null : 'type')}
          >
            <Text style={[
              styles.filterTabText,
              {color: theme === 'dark' && activeFilterTab !== 'type' ? '#ECEDEE' : '#333'},
              activeFilterTab === 'type' && styles.filterTabTextActive
            ]}>
              Type {selectedType !== 'All' && '•'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={activeFilterTab === 'type' ? '#FFF' : theme === 'dark' ? '#ECEDEE' : '#666'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              {backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: '#FF6B6B'},
              activeFilterTab === 'price' && styles.filterTabActive
            ]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'price' ? null : 'price')}
          >
            <Text style={[
              styles.filterTabText,
              {color: theme === 'dark' && activeFilterTab !== 'price' ? '#ECEDEE' : '#333'},
              activeFilterTab === 'price' && styles.filterTabTextActive
            ]}>
              Price {priceRange !== 'All' && '•'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={activeFilterTab === 'price' ? '#FFF' : theme === 'dark' ? '#ECEDEE' : '#666'}
            />
          </TouchableOpacity>
        </ScrollView>


        {/* Expanded Filter Options */}
        {activeFilterTab === 'metal' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', 'Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold'].map((metal) => (
              <TouchableOpacity
                key={metal}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5',
                    borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0'
                  },
                  selectedMetal === metal && styles.filterPillActive
                ]}
                onPress={() => {
                  setSelectedMetal(metal);
                  setActiveFilterTab(null);
                }}
              >
                <Text style={[
                  styles.filterPillText,
                  {color: theme === 'dark' ? '#ECEDEE' : '#666'},
                  selectedMetal === metal && styles.filterPillTextActive
                ]}>
                  {metal}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'gems' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', 'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Opal', 'Amethyst'].map((stone) => (
              <TouchableOpacity
                key={stone}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5',
                    borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0'
                  },
                  selectedStone === stone && styles.filterPillActive
                ]}
                onPress={() => {
                  setSelectedStone(stone);
                  setActiveFilterTab(null);
                }}
              >
                <Text style={[
                  styles.filterPillText,
                  {color: theme === 'dark' ? '#ECEDEE' : '#666'},
                  selectedStone === stone && styles.filterPillTextActive
                ]}>
                  {stone}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'type' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', 'Ring', 'Necklace', 'Earrings', 'Bracelet', 'Watch', 'Brooch', 'Pendant'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5',
                    borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0'
                  },
                  selectedType === type && styles.filterPillActive
                ]}
                onPress={() => {
                  setSelectedType(type);
                  setActiveFilterTab(null);
                }}
              >
                <Text style={[
                  styles.filterPillText,
                  {color: theme === 'dark' ? '#ECEDEE' : '#666'},
                  selectedType === type && styles.filterPillTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'price' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {[
              {label: 'All Prices', value: 'All'},
              {label: 'Under $100', value: 'under100'},
              {label: '$100-$500', value: '100-500'},
              {label: '$500-$1,000', value: '500-1000'},
              {label: 'Over $1,000', value: 'over1000'},
            ].map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5',
                    borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0'
                  },
                  priceRange === range.value && styles.filterPillActive
                ]}
                onPress={() => {
                  setPriceRange(range.value);
                  setActiveFilterTab(null);
                }}
              >
                <Text style={[
                  styles.filterPillText,
                  {color: theme === 'dark' ? '#ECEDEE' : '#666'},
                  priceRange === range.value && styles.filterPillTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Results Count & Clear All - Moved Below Filters */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsCount}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          </Text>
          {(selectedMetal !== 'All' || selectedStone !== 'All' || selectedType !== 'All' || priceRange !== 'All' || sortBy !== 'newest') && (
            <TouchableOpacity
              onPress={() => {
                setSelectedMetal('All');
                setSelectedStone('All');
                setSelectedType('All');
                setPriceRange('All');
                setSortBy('newest');
                setActiveFilterTab(null);
              }}
              style={styles.clearAllButton}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
      <View style={{height: sectionSpacing}}/>

      {/* Trending Section - Always Show (Horizontal Scroll) */}
      {trendingItems.length > 0 && (
        <ThemedView
          style={{
            paddingVertical: trendingSectionPadding,
            marginBottom: trendingSectionMargin,
          }}
        >

          <ThemedText type="title" style={{marginBottom: 8, paddingHorizontal: 16, paddingTop: 8}}>🔥 Trending Now</ThemedText>
          <ThemedText style={{fontSize: 14, color: '#666', marginBottom: 16, paddingHorizontal: 16}}>
            Most popular items in the last 24 hours
          </ThemedText>

          <FlatList
            data={trendingItems.map((item: ListedItem) => ({
              ...item,
              isWishlisted: wishlistIds.includes(item.id) ? 'true' : 'false',
              isFavorited: favoritedItems[item.id],
            }))}
            extraData={favoritedItems}
            keyExtractor={(item) => `trending-${item.id}`}
            renderItem={renderTrendingItem}
            horizontal
            style={{height: trendingHeight + 20}}
            contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 20}}
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
          />
        </ThemedView>
      )}

      {/* Shop Instantly Section - Filtered */}
      <ThemedView style={styles.shopInstantlySection}>
        <ThemedText style={[styles.sectionTitle, {paddingHorizontal: 16, marginBottom: 8}]}>⚡ Shop Instantly</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, {paddingHorizontal: 16, marginBottom: 16}]}>Skip the wait - buy your favorites now! 🛍️</ThemedText>

        {itemsWithWatchStatus.length > 0 ? (
          <FlatList
            data={itemsWithWatchStatus}
            renderItem={({item}) => {
              const displayPrice = (item.highest_bid ?? item.buy_it_now ?? item.price) ?? 0;
              const placeholder = require('../../assets/goat-icon.png');

              return (
                <TouchableOpacity
                  style={[styles.productCard, { width: ITEM_WIDTH }]}
                  onPress={() => router.push(`/item/${item.id}` as const)}
                  activeOpacity={0.9}
                >
                  {/* Image Container */}
                  <View style={[styles.productImageContainer, { height: ITEM_WIDTH * 1.2 }]}>
                    <Image
                      source={item.photo_url ? {uri: item.photo_url} : placeholder}
                      style={styles.productImage}
                      resizeMode="cover"
                    />

                    {/* Heart Icon - Top Right */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        void toggleFavorite(item.id);
                      }}
                      style={styles.heartIconOverlay}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={favoritedItems[item.id] ? "heart" : "heart-outline"}
                        size={24}
                        color="#6A0DAD"
                      />
                    </TouchableOpacity>

                    {/* Must Sell Badge */}
                    {(!!(item.mustSell) || item.is_super_deal) && (
                      <View style={styles.mustSellBadge}>
                        <Text style={styles.mustSellText}>MUST SELL</Text>
                      </View>
                    )}

                    {/* Buy It Now Badge */}
                    {item.buy_it_now && (
                      <View
                        style={[styles.buyItNowBadge, (item.mustSell || item.is_super_deal) ? {top: 40} : undefined]}>
                        <Text style={styles.buyItNowText}>BUY NOW</Text>
                      </View>
                    )}

                    {/* Wishlist Coin - Bottom Right */}
                    <View style={styles.wishlistCoinOverlay}>
                      <GoatGenieBadge
                        onWish={() => {
                         void handleWishlistTap(item);
                        }}
                      />
                    </View>
                  </View>

                  {/* Info Container */}
                  <View style={styles.productInfo}>
                    <Text
                      style={[styles.productTitle, {lineHeight: titleLineHeight, minHeight: titleLineHeight * 2}]}
                      numberOfLines={2}
                    >

                      {item.name}
                    </Text>

                    <View style={styles.productPriceRow}>
                      <Text style={styles.productPrice}>
                        ${displayPrice.toFixed(2)}
                      </Text>
                    </View>

                    {item.auction_ends_at && (() => {
                      const endTime = new Date(item.auction_ends_at).getTime();
                      const timeLeft = endTime - Date.now();
                      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                      const tColor = getTimeColor(item.auction_ends_at);

                      if (days >= 2) {
                        const formattedDate = new Date(item.auction_ends_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        return (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: countdownMargin }}>
                            <Ionicons name="time-outline" size={countdownFont} color="#38A169" />
                            <Text style={[styles.buyBeforeText, { color: '#38A169', fontSize: countdownFont }]}>
                              Buy Before {formattedDate}
                            </Text>
                          </View>
                        );
                      } else {
                        const {timeText} = getCountdownLocal(item.auction_ends_at);
                        return (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: countdownMargin }}>
                            <Ionicons name="time-outline" size={countdownFont} color={tColor} />
                            <Text style={[styles.buyBeforeText, { color: tColor, fontSize: countdownFont }]}>
                              {timeText}
                            </Text>
                          </View>
                        );
                      }
                    })()}

                    {item.seller && (
                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, marginTop: 4}}>
                        {item.seller?.avatar_url && (
                          <Image source={{uri: item.seller.avatar_url}}
                                 style={{width: 22, height: 22, borderRadius: 11, marginRight: 6}}/>
                        )}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            if (item.seller?.id) {
                              router.push(`/seller/${item.seller.id}` as const);
                            }
                          }}
                          activeOpacity={0.7}
                          style={{flexShrink: 1, flexGrow: 0, marginRight: 6}}
                        >
                          <Text
                            style={{fontSize: 11, color: '#007AFF', fontWeight: '600', textDecorationLine: 'underline'}}
                            numberOfLines={1}>
                            {item.seller.username}
                          </Text>
                        </TouchableOpacity>
                        {typeof item.seller.avg_rating === 'number' && (
                          <View style={{flexDirection: 'row', alignItems: 'center', flexShrink: 0, marginLeft: 2}}>
                            <Ionicons name="star" size={14} color="#FFD700"/>
                            <Text style={{fontSize: 12, color: '#666', fontWeight: '600', marginLeft: 4}}
                                  numberOfLines={1}>
                              {item.seller.avg_rating.toFixed(1)}{' '}
                            </Text>
                            <Text
                              style={{fontSize: 12, color: '#666', fontWeight: '600', textDecorationLine: 'underline'}}
                              numberOfLines={1}>
                              ({item.seller.total_reviews || 0})
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Add to Cart Button */}
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                       void handleAddToCart(item);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="cart" size={16} color="#FFF"/>
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => `buy-it-now-${item.id}`}
            numColumns={NUM_COLUMNS}
            key={`grid-${NUM_COLUMNS}`}
            contentContainerStyle={[
              styles.gridContainer,
              {width: '100%', paddingBottom: 0,  paddingHorizontal: 16, flexGrow: 1}
            ]}
            style={{width: '100%'}}



            columnWrapperStyle={[styles.gridColumnWrapper]}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            ListFooterComponent={
              itemsWithWatchStatus.length > 0 ? (
                <View style={{paddingTop: 32, paddingBottom: 56, alignItems: 'center'}}>
                  {loading ? (
                    <ActivityIndicator size="large" color="#FF6B35"/>
                  ) : (
                    <Text style={{color: '#666'}}>You&#39;ve reached the end 🐐</Text>
                  )}
                </View>
              ) : null
            }
            onEndReached={async () => {
              if (!loading && itemsWithWatchStatus.length > 0) {
                setLoading(true);
                await new Promise(res => setTimeout(res, 1500));
                setLoading(false);
              }
            }}
            onEndReachedThreshold={0.5}
          />
        ) : (
          <ThemedText style={{textAlign: 'center', marginVertical: 16}}>
            No items available right now.
          </ThemedText>
        )}
      </ThemedView>

      {/* Category Collections */}


      {/* Modern Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.sortModalOverlay}>
          <TouchableOpacity
            style={styles.sortModalBackdrop}
            activeOpacity={1}
            onPress={() => setSortModalVisible(false)}
          />
          <View style={[styles.sortModalContent, {backgroundColor: colors.background}]}>
            {/* Handle Bar */}
            <View style={styles.sortModalHandle}/>

            {/* Header */}
            <View style={styles.sortModalHeader}>
              <Text style={[styles.sortModalTitle, {color: colors.textPrimary}]}>Sort By</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}
                                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close" size={24} color={theme === 'dark' ? '#999' : '#666'}/>
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <ScrollView style={styles.sortOptionsContainer} showsVerticalScrollIndicator={false}>
              {[
                {label: '🆕 Newest First', value: 'newest', subtitle: 'Recently listed items', icon: 'time-outline'},
                {label: '🔥 Trending', value: 'most_popular', subtitle: 'Most bids & views', icon: 'trending-up'},
                {label: '⏰ Ending Soon', value: 'ending_soon', subtitle: 'Time running out', icon: 'hourglass-outline'},
                {label: '💵 Price: Low to High', value: 'price_asc', subtitle: 'Best deals first', icon: 'arrow-up'},
                {
                  label: '💎 Price: High to Low',
                  value: 'price_desc',
                  subtitle: 'Premium items first',
                  icon: 'arrow-down'
                },
                {label: '⭐ Highest Rated Sellers', value: 'seller_rating', subtitle: 'Top-rated sellers', icon: 'star'},
                {label: '🎯 Best Match', value: 'relevance', subtitle: 'Recommended for you', icon: 'sparkles'},
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    {backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF'},
                    sortBy === option.value && styles.sortOptionSelected,
                    sortBy === option.value && {
                      backgroundColor: theme === 'dark' ? '#2C1C4A' : '#F0E6FF',
                      borderColor: '#6A0DAD'
                    }
                  ]}
                  onPress={() => handleSortChange(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sortOptionLeft}>
                    <View style={[
                      styles.sortOptionIconContainer,
                      {backgroundColor: sortBy === option.value ? '#6A0DAD' : (theme === 'dark' ? '#2C2C2E' : '#F5F5F5')}
                    ]}>
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={sortBy === option.value ? '#FFF' : (theme === 'dark' ? '#999' : '#666')}
                      />
                    </View>
                    <View style={styles.sortOptionTextContainer}>
                      <Text style={[
                        styles.sortOptionLabel,
                        {color: colors.textPrimary},
                        sortBy === option.value && {fontWeight: '700', color: '#6A0DAD'}
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.sortOptionSubtitle,
                        {color: theme === 'dark' ? '#999' : '#666'},
                        sortBy === option.value && {color: '#8B5CF6'}
                      ]}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#6A0DAD"/>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.sortModalFooter, {borderTopColor: theme === 'dark' ? '#333' : '#E5E5E5'}]}>
              <Text style={[styles.sortModalFooterText, {color: theme === 'dark' ? '#999' : '#666'}]}>
                {itemsWithWatchStatus.length} items • Sorted by {
                sortBy === 'newest' ? 'Newest' :
                  sortBy === 'most_popular' ? 'Trending' :
                    sortBy === 'ending_soon' ? 'Ending Soon' :
                      sortBy === 'price_asc' ? 'Price (Low to High)' :
                        sortBy === 'price_desc' ? 'Price (High to Low)' :
                          sortBy === 'seller_rating' ? 'Seller Rating' :
                            'Best Match'
              }
              </Text>
            </View>
          </View>
        </View>
      </Modal>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  exploreTitleContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  exploreTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  wishlistIconWrapper: {
  position: 'absolute',
  bottom: 8,
  right: 8, //
  zIndex: 2,
  padding: 1,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.8)',
  },

  wishlistIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    right: -35,
    position: 'absolute',
  },
  titleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  listedImage: {
    height: 80,
    borderRadius: 8,
    marginVertical: 8,
    alignSelf: 'center',
  },
    itemCard: {
    marginVertical: 8,
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
    thumbnail: {
  width: '100%',
  height: 160,
  borderRadius: 4,
  marginBottom: 4,
},
  timeLeft: {
  fontSize: 14,
  color: '#7D5BA6',
  fontStyle: 'italic',
  opacity: 0.8,
  marginTop: 4,
    textAlign: 'center',
  },
 countdownText: {
  fontSize: 18,
  color:  '#38a169',
  fontWeight: '600',
  marginTop: 4,
},
  urgentText: {
    color: '#c62828',
    fontWeight: '700',
  },

title: {
  fontSize: 14,
  fontWeight: '600',
  marginTop: 6,
  textAlign: 'center',
  color: '#000',
},
  lowStockText: {
  fontSize: 18,
  color: '#c62828', // red for urgency
  fontWeight: '700',
  marginTop: 6,
  textAlign: 'center',
},
modalBackdrop: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 12,
  width: '80%',
  alignItems: 'center',
},
modalText: {
  fontSize: 12,
  marginBottom: 16,
  textAlign: 'center',
},
modalClose: {
  fontSize: 16,
  color: '#007AFF',
  fontWeight: '600',
},
  cardWrapper: {
    paddingHorizontal: 2,
  },
  carouselCard: {
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
    backgroundColor: '#f5f5f5',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  shareButtonOverlay: {
    position: 'absolute',
    top: 8,
    right: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#222',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
    padding: 12,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  subtitle: {
  fontSize: 14,
  color: '#666',
  marginTop: 4,
  fontStyle: 'italic',
},

  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  bidCount: {
    fontSize: 12,
    color: '#666',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  sellerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 6,
  },
  sellerNameContainer: {
    flexShrink: 1,
    marginRight: 6,
  },
  sellerName: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 0,
  },
  memberSince: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  sellerRating: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f6ad55',
  },
  featuredBadge: {
    marginTop: 12,
    fontSize: 12,
    color: '#ff9900',
  },
   heartIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  outlineRed: {
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.85)',
    fontWeight: '600',
  },
  outlineBlue: {
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.85)',
  },
  outlineGreen: {
    borderWidth: 1,
    borderColor: 'rgba(0,200,0,0.85)',
    fontWeight: '600',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  filtersSection: {
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    marginHorizontal: 16,
    color: '#000',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,

  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A0DAD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  activeFilterClose: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6A0DAD',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterRow: {
    marginVertical: 4,
    paddingLeft: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterPillActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  shareButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  shareIcon: {
    fontSize: 18,
  },
  // Category Collections
  shopInstantlySection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 14,
    fontStyle: 'italic',
  },
  // Modern Product Grid
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 0,
  },
  gridColumnWrapper: {
    gap: COLUMN_GAP,
    justifyContent: 'center',
    marginBottom: 12,
  },
  productCard: {
    flexShrink: 0,
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  heartIconOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#BB86FC',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  mustSellBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mustSellText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyItNowBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buyItNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wishlistCoinOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  wishlistCoinImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 18,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    marginTop: -2,
  },
  productPrice: {
    fontSize: 15,
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
  productSeller: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 11,
    color: '#999',
  },
  buyBeforeText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  bidCountText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
    marginTop: 4,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6A0DAD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
  },
  filterTabActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  filterOptionsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  // Modern Sort Modal Styles
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalBackdrop: {
    flex: 1,
  },
  sortModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sortModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sortOptionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortOptionSelected: {
    borderWidth: 2,
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortOptionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sortOptionTextContainer: {
    flex: 1,
  },
  sortOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sortOptionSubtitle: {
    fontSize: 13,
  },
  sortModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  sortModalFooterText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },

});
import { API_BASE_URL } from '@/config';

import React, { useCallback, useEffect, useState, useRef } from 'react';
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
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16; // Add this
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - (HORIZONTAL_PADDING * 2) - COLUMN_GAP) / NUM_COLUMNS; // Update this
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { router, } from 'expo-router';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Collapsible } from '@/components/Collapsible';
import ItemScreen from '@/app/(tabs)/list-item';
import UnTappedHeart from '@/assets/unTappedHeart.svg';
import TappedHeart from '@/assets/TappedHeart.svg';
import { Animated as RNAnimated } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Avatar } from 'app/components/Avatar'
import {formatDateTime, getCountdownLocal, isLowStock} from "@/utils/time";
import Toast from "react-native-toast-message";
import {useWishlist} from "@/app/wishlistContext";
import { useAppDispatch } from 'hooks/reduxHooks';
import { addToWishlist } from 'app/wishlistslice';
import { addItem } from '@/utils/cartSlice';
import GoatGenieBadge from "@/app/GoatGenieBadge";
import {ListedItem} from "@/types/items";

import { GoatFlip } from '@/components/GoatAnimator/goatFlip';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/theme/ThemeContext';


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
  }: {
    item: ListedItem;
    isFavorited: boolean;
    isWishlisted: boolean;

    toggleFavorite: (id: number) => void;
    onWishlistTap: (item: ListedItem) => void;
    onShare: (item: ListedItem) => void;
  }) => {
    const { timeText, isUrgent } = getCountdownLocal(item.auction_ends_at);
   const displayPrice = Number(item.highest_bid ?? item.price ?? 0);
    const isBid = item.highest_bid && item.highest_bid > item.price;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/item/${item.id}` as const)}
        activeOpacity={0.9}
        style={styles.cardWrapper}
      >
        <View style={styles.carouselCard}>
          {/* Image Container */}
          <View style={styles.imageContainer}>
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
              {isFavorited ? (
                <TappedHeart width={24} height={24} />
              ) : (
                <UnTappedHeart width={24} height={24} />
              )}
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
                <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                <Text
                  style={[
                    styles.statsText,
                    { color: isUrgent ? '#e53e3e' : '#38a169' },
                  ]}
                  numberOfLines={1}
                >
                  {timeText}
                </Text>
              </View>
            )}

            {item.seller && (
              <Text style={styles.productSeller} numberOfLines={1}>
                by {item.seller.username}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

JustListedCard.displayName = 'JustListedCard';

export default function TabTwoScreen() {
  const { theme, colors } = useTheme();
  const [justListedItems, setJustListedItems] = useState<ListedItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<ListedItem[]>([]);
  const [favoritedItems, setFavoritedItems] = useState<Record<number, boolean>>({});
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ListedItem | null>(null);

  // Filter states
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedStone, setSelectedStone] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);

  // Share modal
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);
  const [itemToShare, setItemToShare] = useState<ListedItem | null>(null);

  // Goat animations
  const headerOpacity = useRef(new RNAnimated.Value(0)).current;
  const headerScale = useRef(new RNAnimated.Value(1)).current;
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const { wishlistIds, refreshWishlist, addToWishlist: addToWishlistBackend } = useWishlist();
  const dispatch = useAppDispatch();

  // Fade in header title and arrow
  useEffect(() => {
    setTimeout(() => {
      RNAnimated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            RNAnimated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  }, []);

  const toggleFavorite = async (id: number) => {
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
          await fetch('http://10.0.0.170:5000/api/favorites', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_id: id }),
          });
          console.log(`🐐 Item ${id} synced to backend favorites`);
        } else {
          // Remove from favorites
          await fetch(`http://10.0.0.170:5000/api/favorites/${id}`, {
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
  };

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
      const message = `Check out this ${item.name} on BidGoat! 💎\n\nPrice: $${((item.highest_bid ?? item.price) ?? 0).toFixed(2)}\n\nView: https://bidgoat.com/item/${item.id}`;

      const result = await Share.share({
        message,
        title: item.name,
        url: `https://bidgoat.com/item/${item.id}`,
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

      // For now, simulate trending by sorting by bidCount
      // In production; this should call a dedicated /api/trending endpoint
      const response = await fetch('http://10.0.0.170:5000/api/just-listed', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.items)) {
          const trending = [...data.items]
            .sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0))
            .slice(0, 10);
          setTrendingItems(trending);
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

      const response = await fetch('http://10.0.0.170:5000/api/just-listed', {
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
         const safeItems = data.items
          .filter((item: any) => item.buy_it_now && item.buy_it_now > 0) // Filter for Buy It Now only (has a buy_it_now price)
          .map((item: any) => {
            const rawTimestamp = item.auctionEndsAt ?? item.auction_ends_at ?? '';
            let safeTimestamp = '';

            if (rawTimestamp && rawTimestamp.trim()) {
              safeTimestamp = rawTimestamp.includes('T')
                ? rawTimestamp
                : rawTimestamp.replace(' ', 'T') + 'Z';
            }

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
      fetchJustListed();
      fetchTrending();
      loadFavoritesFromStorage();
    }, [])
  );

  const handleWishlistTap = async (item: ListedItem) => {
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
        await fetch('http://10.0.0.170:5000/api/wishlist', {
          method: 'POST',
          headers: {
            Authorization: `Bearer token`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ auction_id: item.id }),
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
  };

  const handleConfirmAdd = async () => {
    if (selectedItem) {
      console.log('🐐 Explore Modal: Adding item to wishlist:', selectedItem.id);
      try {
        // Add to the backend first
        await addToWishlistBackend(selectedItem.id);
        console.log('🐐 Explore Modal: Added to backend successfully');

        // Then update Redux state
        dispatch(addToWishlist({ id: selectedItem.id, name: selectedItem.name }));
        setModalVisible(false);
      } catch (error) {
        console.error('🐐 Explore Modal: Error adding to wishlist:', error);
      }
    }
  };

  const handleAddToCart = async (item: ListedItem) => {
    try {
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

      // Sync with backend
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        await fetch('http://10.0.0.170:5000/api/cart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: item.id, quantity: 1 }),
        });
      }
    } catch (error) {
      console.error('🐐 Error adding to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add to cart',
        text2: 'Please try again',
        visibilityTime: 2000,
        position: 'top',
      });
    }
  };

  const uniqueItems = justListedItems.filter((item, index, self) =>
    index === self.findIndex((t) => t.id === item.id)
  );

  // Apply filters
  const filteredItems = uniqueItems.filter(item => {
    const price = item.highest_bid ?? item.price ?? 0;
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
    const priceA = a.highest_bid ?? a.price ?? 0;
    const priceB = b.highest_bid ?? b.price ?? 0;

    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'ending_soon') {
      const endA = new Date(a.auction_ends_at || 0).getTime();
      const endB = new Date(b.auction_ends_at || 0).getTime();
      return endA - endB;
    }
    if (sortBy === 'most_popular') {
      // Sort by bid count (popularity indicator)
      return (b.bidCount || b.bid_count || 0) - (a.bidCount || a.bid_count || 0);
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
  ({ item }: { item: ListedItemWithStatus }) => (
    <JustListedCard
      item={item}
      isFavorited={item.isFavorited}
      isWishlisted={item.isWishlisted === 'true'}
      toggleFavorite={toggleFavorite}
      onWishlistTap={handleWishlistTap}
      onShare={handleShare}
    />
  ),
  [toggleFavorite, handleWishlistTap, handleShare]
);


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
      <ParallaxScrollView scrollY={scrollY}
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={<></>}
      >
          <View style={{ marginTop: HEADER_MAX_HEIGHT - 80 }}>
          {/* Page Header with Title and Back Arrow */}
          <RNAnimated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Explore</Text>
          </RNAnimated.View>

          {/* Clean Filter Tabs */}
          <ThemedView style={[styles.filtersSection, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#e5e5e5' }]}>
            {/* Filter Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsRow}>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#FF6B6B' : '#FF6B6B' },
                  activeFilterTab === 'sort' && styles.filterTabActive
                ]}
                onPress={() => setActiveFilterTab(activeFilterTab === 'sort' ? null : 'sort')}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: theme === 'dark' && activeFilterTab !== 'sort' ? '#ECEDEE' : '#333' },
                  activeFilterTab === 'sort' && styles.filterTabTextActive
                ]}>
                  Sort {sortBy !== 'newest' && '•'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={activeFilterTab === 'sort' ? '#FFF' : (theme === 'dark' ? '#ECEDEE' : '#666')} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#FF6B6B' : '#FF6B6B' },
                  activeFilterTab === 'metal' && styles.filterTabActive
                ]}
                onPress={() => setActiveFilterTab(activeFilterTab === 'metal' ? null : 'metal')}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: theme === 'dark' && activeFilterTab !== 'metal' ? '#ECEDEE' : '#333' },
                  activeFilterTab === 'metal' && styles.filterTabTextActive
                ]}>
                  Metal {selectedMetal !== 'All' && '•'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={activeFilterTab === 'metal' ? '#FFF' : (theme === 'dark' ? '#ECEDEE' : '#666')} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#FF6B6B' : '#FF6B6B' },
                  activeFilterTab === 'gems' && styles.filterTabActive
                ]}
                onPress={() => setActiveFilterTab(activeFilterTab === 'gems' ? null : 'gems')}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: theme === 'dark' && activeFilterTab !== 'gems' ? '#ECEDEE' : '#333' },
                  activeFilterTab === 'gems' && styles.filterTabTextActive
                ]}>
                  Gems {selectedStone !== 'All' && '•'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={activeFilterTab === 'gems' ? '#FFF' : (theme === 'dark' ? '#ECEDEE' : '#666')} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#FF6B6B' : '#FF6B6B' },
                  activeFilterTab === 'type' && styles.filterTabActive
                ]}
                onPress={() => setActiveFilterTab(activeFilterTab === 'type' ? null : 'type')}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: theme === 'dark' && activeFilterTab !== 'type' ? '#ECEDEE' : '#333' },
                  activeFilterTab === 'type' && styles.filterTabTextActive
                ]}>
                  Type {selectedType !== 'All' && '•'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={activeFilterTab === 'type' ? '#FFF' : (theme === 'dark' ? '#ECEDEE' : '#666')} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#FF6B6B' : '#FF6B6B' },
                  activeFilterTab === 'price' && styles.filterTabActive
                ]}
                onPress={() => setActiveFilterTab(activeFilterTab === 'price' ? null : 'price')}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: theme === 'dark' && activeFilterTab !== 'price' ? '#ECEDEE' : '#333' },
                  activeFilterTab === 'price' && styles.filterTabTextActive
                ]}>
                  Price {priceRange !== 'All' && '•'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={activeFilterTab === 'price' ? '#FFF' : (theme === 'dark' ? '#ECEDEE' : '#666')} />
              </TouchableOpacity>
            </ScrollView>


            {/* Expanded Filter Options */}
            {activeFilterTab === 'sort' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
                {[
                  { label: '🆕 Newest First', value: 'newest' },
                  { label: '⏰ Ending Soon', value: 'ending_soon' },
                  { label: '💰 Price: Low to High', value: 'price_asc' },
                  { label: '💎 Price: High to Low', value: 'price_desc' },
                  { label: '👀 Most Popular', value: 'most_popular' },
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.value}
                    style={[
                      styles.filterPill,
                      { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                      sortBy === sort.value && styles.filterPillActive
                    ]}
                    onPress={() => { setSortBy(sort.value); setActiveFilterTab(null); }}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: theme === 'dark' ? '#ECEDEE' : '#666' },
                      sortBy === sort.value && styles.filterPillTextActive
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {activeFilterTab === 'metal' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
                {['All', 'Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold'].map((metal) => (
                  <TouchableOpacity
                    key={metal}
                    style={[
                      styles.filterPill,
                      { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                      selectedMetal === metal && styles.filterPillActive
                    ]}
                    onPress={() => { setSelectedMetal(metal); setActiveFilterTab(null); }}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: theme === 'dark' ? '#ECEDEE' : '#666' },
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
                      { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                      selectedStone === stone && styles.filterPillActive
                    ]}
                    onPress={() => { setSelectedStone(stone); setActiveFilterTab(null); }}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: theme === 'dark' ? '#ECEDEE' : '#666' },
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
                      { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                      selectedType === type && styles.filterPillActive
                    ]}
                    onPress={() => { setSelectedType(type); setActiveFilterTab(null); }}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: theme === 'dark' ? '#ECEDEE' : '#666' },
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
                  { label: 'All Prices', value: 'All' },
                  { label: 'Under $100', value: 'under100' },
                  { label: '$100-$500', value: '100-500' },
                  { label: '$500-$1,000', value: '500-1000' },
                  { label: 'Over $1,000', value: 'over1000' },
                ].map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    style={[
                      styles.filterPill,
                      { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                      priceRange === range.value && styles.filterPillActive
                    ]}
                    onPress={() => { setPriceRange(range.value); setActiveFilterTab(null); }}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: theme === 'dark' ? '#ECEDEE' : '#666' },
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

          {/* Trending Section - Bigger Cards */}
          {trendingItems.length > 0 && (
            <ThemedView style={{ paddingVertical: 16, marginBottom: 16 }}>
              <ThemedText type="title" style={{ marginBottom: 8, paddingHorizontal: 16 }}>🔥 Trending Now</ThemedText>
              <ThemedText style={{ fontSize: 14, color: '#666', marginBottom: 16, paddingHorizontal: 16 }}>
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
                renderItem={renderItem}
                horizontal
                style={{ height: 380 }}
                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
              />
            </ThemedView>
          )}


          {/* Shop Instantly Section */}
          <ThemedView style={styles.shopInstantlySection}>
            <ThemedText style={styles.sectionTitle}>⚡ Shop Instantly</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>Skip the wait - buy your favorites now! 🛍️</ThemedText>

            {justListedItems.length > 0 ? (
              <FlatList
                data={justListedItems}
                renderItem={({ item }) => {
                  const displayPrice = (item.highest_bid ?? item.price) ?? 0;
                  const isBid = item.highest_bid && item.highest_bid > item.price;
                  const placeholder = require('../../assets/goat-icon.png');

                  return (
                    <TouchableOpacity
                      style={styles.productCard}
                      onPress={() => router.push(`/item/${item.id}` as const)}
                      activeOpacity={0.9}
                    >
                      {/* Image Container */}
                      <View style={styles.productImageContainer}>
                        <Image
                          source={item.photo_url ? { uri: item.photo_url } : placeholder}
                          style={styles.productImage}
                          resizeMode="cover"
                        />

                        {/* Heart Icon - Top Right */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          style={styles.heartIconOverlay}
                          activeOpacity={0.7}
                        >
                          {favoritedItems[item.id] ? (
                            <TappedHeart width={24} height={24} />
                          ) : (
                            <UnTappedHeart width={24} height={24} />
                          )}
                        </TouchableOpacity>

                        {/* Must Sell Badge */}
                        {(!!(item.mustSell) || item.is_super_deal) && (
                          <View style={styles.mustSellBadge}>
                            <Text style={styles.mustSellText}>MUST SELL</Text>
                          </View>
                        )}

                        {/* Buy It Now Badge */}
                        {item.buy_it_now && (
                          <View style={[styles.buyItNowBadge, (item.mustSell || item.is_super_deal) ? { top: 40 } : undefined]}>
                            <Text style={styles.buyItNowText}>BUY NOW</Text>
                          </View>
                        )}

                        {/* Wishlist Coin - Bottom Right */}
                        <View style={styles.wishlistCoinOverlay}>
                          <GoatGenieBadge
                            onWish={() => {
                              handleWishlistTap(item);
                            }}
                          />
                        </View>
                      </View>

                      {/* Info Container */}
                      <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                          {item.name}
                        </Text>

                        <View style={styles.productPriceRow}>
                          <Text style={styles.productPrice}>
                            ${displayPrice.toFixed(2)}
                          </Text>
                        </View>

                        {item.auction_ends_at && (
                          <Text style={styles.buyBeforeText}>
                            🎁 Buy Before {new Date(item.auction_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        )}

                        {item.seller_username && (
                          <Text style={styles.productSeller} numberOfLines={1}>
                            by {item.seller_username}
                          </Text>
                        )}

                        {/* Add to Cart Button */}
                        <TouchableOpacity
                          style={styles.addToCartButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="cart" size={16} color="#FFF" />
                          <Text style={styles.addToCartText}>Add to Cart</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item) => `buy-it-now-${item.id}`}
                numColumns={2}
                contentContainerStyle={[styles.gridContainer]}
                columnWrapperStyle={[styles.gridColumnWrapper]}
                scrollEnabled={false}
                style={{ marginHorizontal: -16 }}
              />
            ) : (
              <ThemedText style={{ textAlign: 'center', marginVertical: 16 }}>
                No items available right now.
              </ThemedText>
            )}
          </ThemedView>

          {/* Category Collections */}
          </View>
        </ParallaxScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  wishlistIconWrapper: {
  position: 'absolute',
  bottom: 8,
  right: 8, // 👈 this puts it in the top-left corner
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
  fontSize: 12,
  color: '#7D5BA6',
  fontStyle: 'italic',
  opacity: 0.8,
  marginTop: 4,
    textAlign: 'center',
  },
 countdownText: {
  fontSize: 16,
  color:  '#38a169',
  fontWeight: '600',
  marginTop: 4,
},
urgentText: {
  color: '#c62828', // red when urgent
},
title: {
  fontSize: 14,
  fontWeight: '600',
  marginTop: 6,
  textAlign: 'center',
  color: '#000',
},
  lowStockText: {
  fontSize: 14,
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
    paddingHorizontal: 8,
  },
  carouselCard: {
    width: ITEM_WIDTH,
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
    height: ITEM_WIDTH * 1.2,
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
  },
  subtitle: {
  fontSize: 14,
  color: '#666',
  marginTop: 4,
  fontStyle: 'italic',
},

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
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
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 0,
  },
  sellerName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6A0DAD',
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
  },
  outlineBlue: {
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.85)',
  },
  outlineGreen: {
    borderWidth: 1,
    borderColor: 'rgba(0,200,0,0.85)',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  filtersSection: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
    justifyContent: 'space-between',
  marginBottom: 16,
  },
  productCard: {
    width: ITEM_WIDTH,
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
    height: ITEM_WIDTH * 1.2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  bidBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#F57C00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  productSeller: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buyBeforeText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
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

});
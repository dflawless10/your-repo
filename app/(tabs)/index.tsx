import { API_BASE_URL } from '@/config';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme, Dimensions, ActivityIndicator, Modal,
 Animated as RNAnimated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import EnhancedHeader from '@/app/components/EnhancedHeader';
import { ListedItem } from '@/types/items';
import { SafeAreaView } from 'react-native-safe-area-context';
import CarouselPreview from '@/app/onboarding/CarouselPreview';

import Animated from 'react-native-reanimated';
import {router} from "expo-router";
import SparkleItemCard from "@/app/components/SparkleItemCard";
import { useAppDispatch } from 'hooks/reduxHooks';
import {addToWishlist} from "@/app/wishlistslice";
import Toast from "react-native-toast-message";
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/app/theme/ThemeContext';






const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;

const goatColors = {
  light: {
    primary: '#fff',
    background: '#fff',
    text: '#242c40',
    tabBackground: '#eee',
    overlay: 'rgba(255,255,255,0.85)',
  },
  dark: {
    primary: '#1C1C1E',
    background: '#0F1213',
    text: '#ECEDEE',
    tabBackground: '#1C1C1E',
    overlay: 'rgba(0,0,0,0.85)',
  },
};




export default function HomeScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'Just Listed' | 'Create Auction' | 'Sell Now'>('Just Listed');
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const { theme: appTheme } = useTheme();
  const theme = goatColors[appTheme];
  const [items, setItems] = useState<ListedItem[]>([]);
  const [favoritedItems, setFavoritedItems] = useState<Record<number, boolean>>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenWelcome').then((value) => {
      if (!value) {
        setShowWelcomeModal(true);
        AsyncStorage.setItem('hasSeenWelcome', 'true');
      }
    });
  }, []);

  const closeModal = () => setShowWelcomeModal(false);

  // Check authentication and redirect if needed
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.push('/landing');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          setItems([]);
          setLoading(false);
          return;
        }

      const endpoints = {
        'Just Listed': '/api/just-listed',
        'Sell Now': '/api/sell-now',
        'Create Auction': '/api/my-auctions',
      } as const;

      const endpoint = endpoints[activeCategory];
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      const mapped = (data.items ?? []).map((item: any, index: number) => ({
        id: item.id ?? index,
        name: item.name,
        description: item.description || '',
        price: item.price || 0,
        highest_bid: item.highest_bid || item.highestBid,
        photo_url: item.image || item.photo_url || '',
        bid_count: item.bid_count || item.bidCount,
        bidCount: item.bidCount || item.bid_count || 0,
        listed_at: item.listed_at,
        auction_ends_at: item.auctionEndsAt ?? item.auction_ends_at ?? '',
        end_time: item.end_time ?? '',
        timeLeft: item.timeLeft,
        rarity: ['common', 'rare', 'legendary'].includes(item.rarity) ? item.rarity : 'common',
        seller: item.seller || { name: '', avatar: '', id: 0, username: '', avg_rating: 0, total_reviews: 0 },
        quantity_available: item.quantity_available || 1,
        watchers: item.watchers || '0',
        selling_strategy: item.selling_strategy || 'auction',
        is_must_sell: item.selling_strategy === 'must_sell',
      }));

      setItems(mapped);
    } catch (err) {
      console.error('🐐 Fetch error:', err);
      setItems([]);
    }

    setLoading(false);
  })();
}, [activeCategory]);




  useEffect(() => {
    (async () => {
      const [name, token, avatar] = await Promise.all([
        AsyncStorage.getItem('username'),
        AsyncStorage.getItem('jwtToken'),
        AsyncStorage.getItem('avatar_url'),
      ]);
      setUsername(name);
      setAvatarUrl(avatar || null);
      if (!token) {
        await AsyncStorage.multiRemove(['username', 'jwtToken']);
      console.log('🐐 items:', items);

      }
    })();
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  // Reload favorites from AsyncStorage when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          const stored = await AsyncStorage.getItem('favoritedItems');
          if (stored) {
            const parsed = JSON.parse(stored);
            setFavoritedItems(parsed);
            console.log('🐐 HomeScreen: Reloaded favorites from storage:', parsed);
          }
        } catch (err) {
          console.error('🐐 HomeScreen: Failed to load favorites:', err);
        }
      };
      loadFavorites();
    }, [])
  );

  // Helper: Check if item was listed within last 24 hours
  const isItemJustListed = useCallback((listedAt: string | undefined): boolean => {
    if (!listedAt) return false;
    const listed = new Date(listedAt).getTime();
    const now = Date.now();
    const diffHours = (now - listed) / (1000 * 60 * 60);
    return diffHours <= 24;
  }, []);

  // Helper: Map API item to ListedItem
  const mapApiItemToListedItem = useCallback((item: any, index: number): ListedItem => ({
    id: item.id ?? index,
    name: item.name,
    description: item.description || '',
    price: item.price || 0,
    highest_bid: item.highest_bid || item.highestBid,
    photo_url: item.image || item.photo_url || '',
    bid_count: item.bid_count || item.bidCount,
    bidCount: item.bidCount || item.bid_count || 0,
    listed_at: item.listed_at,
    auction_ends_at: item.auctionEndsAt ?? item.auction_ends_at ?? '',
    end_time: item.end_time ?? '',
    timeLeft: item.timeLeft,
    rarity: ['common', 'rare', 'legendary'].includes(item.rarity) ? item.rarity : 'common',
    seller: item.seller || { name: '', avatar: '', id: 0, username: '', avg_rating: 0, total_reviews: 0 },
    quantity_available: item.quantity_available || 1,
    watchers: item.watchers || '0',
    selling_strategy: item.selling_strategy || 'auction',
    is_must_sell: item.selling_strategy === 'must_sell',
    isJustListed: isItemJustListed(item.listed_at),
  }), [isItemJustListed]);

  // Fetch items based on active category
  const fetchCategoryItems = useCallback(async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    const endpoints = {
      'Just Listed': '/api/just-listed',
      'Sell Now': '/api/sell-now',
      'Create Auction': '/api/my-auctions',
    } as const;

    const endpoint = endpoints[activeCategory];

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setItems([]);
        return;
      }

      const data = await res.json();
      console.log('🐐 Home Screen API Response Sample:', data.items?.[0]);

      const mapped: ListedItem[] = (data.items ?? []).map(mapApiItemToListedItem);

      console.log('🐐 Home Screen Mapped Item Sample:', mapped[0]);
      setItems(mapped);
    } catch {
      setItems([]);
    }
  }, [activeCategory, mapApiItemToListedItem]);

  useEffect(() => {
    fetchCategoryItems();
  }, [fetchCategoryItems]);

  const toggleFavorite = async (id: number) => {
    const updated = {
      ...favoritedItems,
      [id]: !favoritedItems[id],
    };
    setFavoritedItems(updated);

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('favoritedItems', JSON.stringify(updated));
      console.log(`🐐 Toggled favorite for item ${id}`);

      // Sync with backend
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        if (updated[id]) {
          // Add to favorites
          const response = await fetch(`${API_BASE_URL}/api/favorites`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_id: id }),
          });
          if (response.ok) {
            console.log(`🐐 Item ${id} added to backend favorites`);
          } else {
            console.error(`🐐 Failed to add item ${id} to favorites: ${response.status} ${await response.text()}`);
          }
        } else {
          // Remove from favorites
          const response = await fetch(`${API_BASE_URL}/api/favorites/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            console.log(`🐐 Item ${id} removed from backend favorites`);
          } else {
            console.error(`🐐 Failed to remove item ${id} from favorites: ${response.status} ${await response.text()}`);
          }
        }
      } else {
        console.warn('🐐 No JWT token found, cannot sync to backend');
      }
    } catch (err) {
      console.error('🐐 Failed to toggle favorite:', err);
    }

    // Redirect to JewelryBox when favoriting (not unfavoriting)
    if (updated[id]) {
      console.log(`TappedHeart activated for item ${id} 🫀 Redirecting to JewelryBoxScreen`);
      router.push('/JewelryBoxScreen');
    }
  };

  const renderHeader = () => (
    <>
      {/* Hidden category buttons - logic kept for CarouselPreview and other screens */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.categorySlider, { display: 'none', height: 0, marginTop: 0, paddingVertical: 0 }]}>
        {(['Just Listed', 'Create Auction', 'Sell Now'] as const).map(label => {
          const isActive = activeCategory === label;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => setActiveCategory(label)}
              style={[
                styles.categoryTab,
                { backgroundColor: theme.tabBackground },
                isActive ? { backgroundColor: theme.primary, borderColor: '#ffd700', borderWidth: 2 } : null,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: theme.text },
                  isActive ? { color: '#fff', fontWeight: 'bold' } : null,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={[styles.carouselHeaderWrap, { marginTop: 110 }]}>
        <CarouselPreview category={activeCategory} />
      </View>
    </>
  );

  const handleWishlistTap = async (item: ListedItem) => {
  try {
    dispatch(addToWishlist({ id: String(item.id), name: item.name }));

    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auction_id: item.id }),
      });
    }

    Toast.show({
      type: 'success',
      text1: 'Added to Wishlist 🐐',
      text2: item.name,
      visibilityTime: 2000,
      position: 'top',
    });
  } catch (err) {
    console.error('Failed to sync wishlist:', err);
  }
};


  return (
  <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
    {/* 🎉 Welcome Modal */}
    {showWelcomeModal && (
      <Modal transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉 Welcome to BidGoatMobile!</Text>
            <Text style={styles.modalSubtitle}>Your auction adventure begins now.</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                closeModal();
                router.push('/explore');
              }}
            >
              <Text style={styles.modalButtonText}>Browse Auctions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                closeModal();
                router.push('/profile');
              }}
            >
              <Text style={styles.modalButtonText}>Set Up My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalLink}
              onPress={() => {
                closeModal();
                router.push('/about');
              }}
            >
              <Text style={styles.modalLinkText}>Learn more about BidGoatMobile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )}

    {/*  Main Feed */}
    <EnhancedHeader
      scrollY={scrollY}
      username={username}
      avatarUrl={avatarUrl ?? undefined}
      onSearch={(q) => console.log('search', q)}
    />

    <Animated.FlatList
      data={items}
      keyExtractor={(item, index) => `index-${item.id}-${index}`}
      numColumns={2}
      renderItem={({ item }) => (
        <SparkleItemCard
  item={item}
  isFavorited={favoritedItems[item.id]}
  toggleFavorite={toggleFavorite}
  onAddToCart={() => {}}
  onWishlistTap={handleWishlistTap}
  showRemoveButton={false}
  toggleWishlist={() => {}}
  total_reviews={""}
  id={""}
/>

      )}
      contentContainerStyle={styles.cardList}
      columnWrapperStyle={styles.columnWrapper}
      onScroll={RNAnimated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
      ListHeaderComponent={renderHeader}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 64 }} />
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 32, color: theme.text }}>
            No items yet—your goat magic awaits!
          </Text>
        )
      }
    />
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderColor: 'red', // 🐐 debug border
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalLink: {
    marginTop: 8,
  },
  modalLinkText: {
    fontSize: 14,
    color: '#3182CE',
    textDecorationLine: 'underline',
  },
  categorySlider: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 110,
  },
  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center'
  },
  categoryText: {
    fontSize: 13
  },
  carouselHeaderWrap: {
    alignSelf: 'stretch',
    height: 320,
    marginVertical: 8,
  },
  categoryBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12
  },
 priceText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#fff',
  textShadowColor: 'rgba(0, 0, 0, 0.9)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
},

bidLabel: {
  fontSize: 10,
  fontWeight: '600',
  color: '#fff',
  marginTop: 2,
  opacity: 0.9,
},

  cardList: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 120,
  },
  columnWrapper: {
    gap: COLUMN_GAP,
    justifyContent: 'space-between',
  },
});
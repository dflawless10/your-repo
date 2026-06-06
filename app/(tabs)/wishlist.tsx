import { API_BASE_URL } from '@/config';
import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Image as RNImage,
  Animated as RNAnimated,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import GoatGenieAlertBadge from '../GoatGenieAlertBadge';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setWishlistItems, removeFromWishlist } from '@/utils/wishlistSlice';
import { AuctionItem } from '@/types/items';
import { persistWishlist, loadWishlist } from '@/utils/persistWishlist';
import { useWishlist } from '@/app/wishlistContext';
import { getAuctionReminders, setAuctionReminders, WishlistEventSettings } from '@/api/reminders';
import { getSentOffers, getOfferTimeRemaining, getOfferStatusColor, getOfferStatusLabel, Offer } from '@/api/offers';
import { useTheme } from '@/app/theme/ThemeContext';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';


type SortOption = 'recent' | 'price-low' | 'price-high' | 'ending-soon';
type FilterOption = 'all' | 'act-now' | 'price-drop' | 'desperate';
type ViewMode = 'grid' | 'list' | 'moodboard' | 'offers';

export default function WishlistScreen() {
  const { theme, colors } = useTheme();
  const dispatch = useAppDispatch();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const NUM_COLUMNS = isLandscape ? 3 : 2;
  const MOOD_COLUMNS = isLandscape ? 3 : 2;
  const CARD_WIDTH = useMemo(
    () => (width - 32 - 12 * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
    [width, NUM_COLUMNS]
  );
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasTriggeredEnd, setHasTriggeredEnd] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('ending-soon');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const defaultEvents: WishlistEventSettings = { must_sell: true, discounted: true, relisted: false, threshold: false };
  const [selectedEvents, setSelectedEvents] = useState<WishlistEventSettings>(defaultEvents);
  const [priceThreshold, setPriceThreshold] = useState<string>('');
  const { removeFromWishlist: removeFromWishlistBackend } = useWishlist();
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const modalScrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const headerOpacity = useRef(new RNAnimated.Value(0)).current;
  const headerScale = useRef(new RNAnimated.Value(1)).current;

  // Fade in header title and arrow animation
  useEffect(() => {
    setTimeout(() => {
      RNAnimated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
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
    }, 100);
  }, []);

  const offersMap = useMemo(() => {
    const m = new Map<number, Offer>();
    sentOffers.forEach(o => m.set(o.item_id, o));
    return m;
  }, [sentOffers]);

  const fetchSentOffers = async () => {
    setOffersLoading(true);
    const data = await getSentOffers();
    if (data) setSentOffers(data);
    setOffersLoading(false);
  };

  useEffect(() => { void fetchSentOffers(); }, []);

  // Calculate total wishlist value
  const totalValue = useMemo(() => {
    return wishlistItems.reduce((sum, item) => sum + ((item.buy_it_now ?? item.price) || 0), 0);
  }, [wishlistItems]);

  const totalDiscounts = useMemo(() => {
    return wishlistItems.reduce((sum, item) => sum + ((item as any).discount_amount || 0), 0);
  }, [wishlistItems]);

  // Count active auctions
  const activeCount = useMemo(() => {
    return wishlistItems.filter(item => item.timeLeft && item.timeLeft !== 'Ended').length;
  }, [wishlistItems]);

  // Smart filter counts — shown on chips before tapping
  const filterCounts = useMemo(() => ({
    'act-now': wishlistItems.filter(item => {
      if (!item.auction_ends_at || item.timeLeft === 'Ended') return false;
      const hoursLeft = (new Date(item.auction_ends_at).getTime() - Date.now()) / 3600000;
      return hoursLeft > 0 && hoursLeft < 24;
    }).length,
    'price-drop': wishlistItems.filter(item => (item as any).discount_amount > 0).length,
    'desperate': wishlistItems.filter(item =>
      (item as any).relist_count >= 2 ||
      (item as any).selling_strategy === 'must_sell' ||
      (item as any).is_must_sell
    ).length,
  }), [wishlistItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...wishlistItems];

    // Apply filters
    if (filterBy === 'act-now') {
      filtered = filtered.filter(item => {
        if (!item.auction_ends_at || item.timeLeft === 'Ended') return false;
        const hoursLeft = (new Date(item.auction_ends_at).getTime() - Date.now()) / 3600000;
        return hoursLeft > 0 && hoursLeft < 24;
      });
    } else if (filterBy === 'price-drop') {
      filtered = filtered.filter(item => (item as any).discount_amount > 0);
    } else if (filterBy === 'desperate') {
      filtered = filtered.filter(item =>
        (item as any).relist_count >= 2 ||
        (item as any).selling_strategy === 'must_sell' ||
        (item as any).is_must_sell
      );
    }

    // Apply sorting
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'ending-soon') {
      filtered.sort((a, b) => {
        const aMatch = typeof a.timeLeft === 'string' ? a.timeLeft.match(/(\d+)h/) : null;
        const bMatch = typeof b.timeLeft === 'string' ? b.timeLeft.match(/(\d+)h/) : null;
        const aHours = aMatch ? parseInt(aMatch[1]) : 999999;
        const bHours = bMatch ? parseInt(bMatch[1]) : 999999;
        return aHours - bHours;
      });
    }

    return filtered;
  }, [wishlistItems, sortBy, filterBy]);

  // Load persisted wishlist
  const hydrateWishlist = useCallback(async () => {
    const stored = await loadWishlist();
    if (stored.length > 0) {
      dispatch(setWishlistItems(stored));
    }
  }, [dispatch]);

  // Fetch from backend
  const fetchWishlist = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allItems = [
          ...(data.active || []),
          ...(data.expired || []).filter((item: any) => !item.is_sold),
        ];

        if (allItems.length > 0 || wishlistItems.length === 0) {
          dispatch(setWishlistItems(allItems as AuctionItem[]));
          await persistWishlist(allItems);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, wishlistItems.length]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      hydrateWishlist();
      fetchWishlist();
    }, [hydrateWishlist, fetchWishlist])
  );

  const handleItemPress = (itemId: string | number) => {
    router.push({ pathname: '/item/[itemId]', params: { itemId: String(itemId) } });
  };

  const handleDeleteItem = async (itemId: string | number) => {
    try {
      await removeFromWishlistBackend(itemId);
      dispatch(removeFromWishlist(itemId));
      const updatedItems = wishlistItems.filter(item => item.id !== itemId);
      await persistWishlist(updatedItems);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleSetReminder = async (item: AuctionItem) => {
    setSelectedItem(item);
    const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
    const existing = await getAuctionReminders(itemId);
    if (existing.events) {
      setSelectedEvents(existing.events);
      setPriceThreshold(existing.price_threshold ? String(existing.price_threshold) : '');
    } else {
      setSelectedEvents(defaultEvents);
      setPriceThreshold('');
    }
    setReminderModalVisible(true);
  };

  const saveReminders = async () => {
    if (!selectedItem) return;
    const anyEnabled = Object.values(selectedEvents).some(Boolean);
    if (!anyEnabled) {
      Alert.alert('Select at least one alert', 'Choose what you want BidGoat to watch for you.');
      return;
    }
    try {
      const itemId = typeof selectedItem.id === 'string' ? parseInt(selectedItem.id) : selectedItem.id;
      const threshold = priceThreshold && selectedEvents.threshold ? parseFloat(priceThreshold) : null;
      const result = await setAuctionReminders(itemId, selectedEvents, threshold);
      if (result.success) {
        Alert.alert('🐐 Goat Genie Activated!', `BidGoat is watching "${result.item_name || 'this item'}" for you.`);
        setReminderModalVisible(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to set alerts');
      }
    } catch {
      Alert.alert('Error', 'Failed to set alerts');
    }
  };

  const toggleEvent = (key: keyof WishlistEventSettings) => {
    setSelectedEvents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCircle}>
        <LinearGradient
          colors={['#6A0DAD', '#8B5CF6']}
          style={styles.emptyGradient}
        >
          <Ionicons name="heart-outline" size={64} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Start saving items you love!{'\n'}
        Tap the ✨ icon on any auction to add it here.
      </Text>

      <View style={styles.emptyFeatures}>
        <View style={styles.emptyFeature}>
          <Ionicons name="notifications" size={20} color="#6A0DAD" />
          <Text style={styles.emptyFeatureText}>Get ending alerts</Text>
        </View>
        <View style={styles.emptyFeature}>
          <Ionicons name="analytics" size={20} color="#6A0DAD" />
          <Text style={styles.emptyFeatureText}>Track prices</Text>
        </View>
        <View style={styles.emptyFeature}>
          <Ionicons name="flash" size={20} color="#6A0DAD" />
          <Text style={styles.emptyFeatureText}>Quick bid access</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/')}>
        <LinearGradient
          colors={['#6A0DAD', '#8B5CF6']}
          style={styles.emptyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="search" size={20} color="#FFF" />
          <Text style={styles.emptyButtonText}>Explore Auctions</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
  const loadMoreItems = async () => {
  setLoadingMore(true);

  // Simulate real loading OR fetch more items
  await new Promise(resolve => setTimeout(resolve, 1500));

  // If you had real pagination, you'd append items here
  // setFilteredAndSortedItems(prev => [...prev, ...newItems]);

  setLoadingMore(false);
};


  const getReviewMinutesLeft = (review_ends_at?: string): number => {
    if (!review_ends_at) return 0;
    const diff = new Date(review_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 60000));
  };

  const renderGridItem = ({ item }: { item: AuctionItem }) => {
    const isInReview = item.in_review === true;
    const isEnded = !isInReview && item.timeLeft === 'Ended';
    const hoursMatch = typeof item.timeLeft === 'string' ? item.timeLeft.match(/^(\d+)h/) : null;
    const isEndingSoon = !isInReview && !isEnded && hoursMatch !== null && parseInt(hoursMatch[1]) < 24;
    const getTimeColor = (): string => {
      if (isEnded) return '#999';
      if (!item.auction_ends_at) return '#38A169';
      const diffHours = (new Date(item.auction_ends_at).getTime() - Date.now()) / 3600000;
      if (diffHours <= 2) return '#E53E3E';
      if (diffHours <= 24) return '#DD6B20';
      return '#38A169';
    };
    const timeColor = getTimeColor();

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.gridCard}>
          {/* Image Container */}
          <View style={styles.gridImageContainer}>
            <RNImage
              source={{ uri: item.photo_url }}
              style={styles.gridImage}
              resizeMode="cover"
            />

            {/* Status Badge */}
            {isInReview && (
              <View style={[styles.endingSoonBadge, { backgroundColor: '#6B7280' }]}>
                <Ionicons name="time-outline" size={12} color="#FFF" />
                <Text style={styles.endingSoonBadgeText}>IN REVIEW</Text>
              </View>
            )}
            {isEnded && (
              <View style={styles.endedBadge}>
                <Text style={styles.endedBadgeText}>Ended</Text>
              </View>
            )}
            {isEndingSoon && (
              <View style={styles.endingSoonBadge}>
                <Ionicons name="flame" size={12} color="#FFF" />
                <Text style={styles.endingSoonBadgeText}>ENDING SOON</Text>
              </View>
            )}

            {/* Discount + Relist badges — top right */}
            {((item as any).discount_amount > 0 || (item as any).relist_count >= 2) && (
              <View style={styles.overlayBadgeStack}>
                {(item as any).discount_amount > 0 && (
                  <View style={styles.discountBadgeOverlay}>
                    <Text style={styles.discountBadgeText}>🔥 -{Math.round((item as any).discount_pct ?? 0)}%</Text>
                  </View>
                )}
                {(item as any).relist_count >= 2 && (
                  <View style={styles.relistBadgeOverlay}>
                    <Text style={styles.relistBadgeText}>↩️ {(item as any).relist_count}×</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.gridActions}>
              <GoatGenieAlertBadge
                isActive={!!(item as any).reminder_active}
                onPress={() => handleSetReminder(item)}
                size={36}
              />
              <TouchableOpacity
                style={[styles.gridActionButton, styles.deleteActionButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
              >
                <Ionicons name="trash" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.gridContent}>
            <Text style={styles.gridTitle} numberOfLines={2}>{item.name}</Text>
            <View style={styles.gridBottom}>
              <View style={styles.gridPriceRow}>
                <Text style={styles.gridPrice}>${(item.buy_it_now ?? item.price)?.toLocaleString()}</Text>
                {!!((item as any).bid_count) && (
                  <Text style={styles.bidBadge}>{(item as any).bid_count} BIDS</Text>
                )}
              </View>
              {(() => {
                const numId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
                const offer = offersMap.get(numId);
                if (!offer || offer.status === 'declined' || offer.status === 'expired') return null;
                return (
                  <View style={[styles.offerInlineBadge, { backgroundColor: getOfferStatusColor(offer.status) }]}>
                    <Ionicons name="paper-plane" size={10} color="#FFF" />
                    <Text style={styles.offerInlineBadgeText}>
                      {offer.status === 'accepted' ? '✅' : '⏳'} ${offer.offer_amount.toFixed(0)} offered
                    </Text>
                  </View>
                );
              })()}
              {isInReview ? (
                <View style={styles.gridTimeContainer}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={[styles.gridTimeText, { color: '#6B7280' }]}>
                    Available in ~{getReviewMinutesLeft(item.review_ends_at)}m
                  </Text>
                </View>
              ) : item.timeLeft && (
                <View style={styles.gridTimeContainer}>
                  <Ionicons name="time-outline" size={14} color={timeColor} />
                  <Text style={[styles.gridTimeText, { color: timeColor }]}>
                    {item.timeLeft}
                  </Text>
                </View>
              )}
              {item.seller && (
                <View style={styles.gridSellerRow}>
                  {item.seller.avatar_url ? (
                    <RNImage source={{ uri: item.seller.avatar_url }} style={styles.gridSellerAvatar} />
                  ) : null}
                  <Text style={styles.gridSellerName} numberOfLines={1}>{item.seller.username}</Text>
                  {(item.seller.avg_rating ?? 0) > 0 && (
                    <View style={styles.gridRatingRow}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                      <Text style={styles.gridRatingText}>{item.seller.avg_rating?.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: AuctionItem }) => {
    const isInReview = item.in_review === true;
    const isEnded = !isInReview && item.timeLeft === 'Ended';
    const getTimeColor = (): string => {
      if (isEnded) return '#999';
      if (!item.auction_ends_at) return '#38A169';
      const diffHours = (new Date(item.auction_ends_at).getTime() - Date.now()) / 3600000;
      if (diffHours <= 2) return '#E53E3E';
      if (diffHours <= 24) return '#DD6B20';
      return '#38A169';
    };
    const timeColor = getTimeColor();

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.9}
      >
        <RNImage
          source={{ uri: item.photo_url }}
          style={styles.listImage}
          resizeMode="cover"
        />
        <View style={styles.listContent}>
          <Text style={styles.listTitle} numberOfLines={2}>{item.name}</Text>
          <View style={styles.listPriceRow}>
            <Text style={styles.listPrice}>${(item.buy_it_now ?? item.price)?.toLocaleString()}</Text>
            {!!((item as any).bid_count) && (
              <Text style={styles.bidBadge}>{(item as any).bid_count} BIDS</Text>
            )}
          </View>
          {((item as any).discount_amount > 0 || (item as any).relist_count >= 2) && (
            <View style={styles.listBadgeRow}>
              {(item as any).discount_amount > 0 && (
                <View style={styles.discountBadgeOverlay}>
                  <Text style={styles.discountBadgeText}>🔥 -{Math.round((item as any).discount_pct ?? 0)}%</Text>
                </View>
              )}
              {(item as any).relist_count >= 2 && (
                <View style={styles.relistBadgeOverlay}>
                  <Text style={styles.relistBadgeText}>↩️ {(item as any).relist_count}×</Text>
                </View>
              )}
            </View>
          )}
          {(() => {
            const numId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
            const offer = offersMap.get(numId);
            if (!offer || offer.status === 'declined' || offer.status === 'expired') return null;
            return (
              <View style={[styles.offerInlineBadge, { backgroundColor: getOfferStatusColor(offer.status), alignSelf: 'flex-start', marginBottom: 4 }]}>
                <Ionicons name="paper-plane" size={10} color="#FFF" />
                <Text style={styles.offerInlineBadgeText}>
                  {offer.status === 'accepted' ? '✅' : '⏳'} ${offer.offer_amount.toFixed(0)} offered
                </Text>
              </View>
            );
          })()}
          {isInReview ? (
            <View style={styles.listTimeContainer}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={[styles.listTimeText, { color: '#6B7280' }]}>
                In review — available in ~{getReviewMinutesLeft(item.review_ends_at)}m
              </Text>
            </View>
          ) : item.timeLeft && (
            <View style={styles.listTimeContainer}>
              <Ionicons name="time-outline" size={14} color={timeColor} />
              <Text style={[styles.listTimeText, { color: timeColor }]}>
                {item.timeLeft}
              </Text>
            </View>
          )}
          {item.seller && (
            <View style={styles.gridSellerRow}>
              {item.seller.avatar_url ? (
                <RNImage source={{ uri: item.seller.avatar_url }} style={styles.gridSellerAvatar} />
              ) : null}
              <Text style={styles.gridSellerName} numberOfLines={1}>{item.seller.username}</Text>
              {(item.seller.avg_rating ?? 0) > 0 && (
                <View style={styles.gridRatingRow}>
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text style={styles.gridRatingText}>{item.seller.avg_rating?.toFixed(1)}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.listActions}>
          <GoatGenieAlertBadge
            isActive={!!(item as any).reminder_active}
            onPress={() => handleSetReminder(item)}
            size={40}
          />
          <TouchableOpacity
            style={[styles.listActionButton, styles.deleteActionButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteItem(item.id);
            }}
          >
            <Ionicons name="trash" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMoodboardItem = ({ item, index }: { item: AuctionItem; index: number }) => {
    const isInReview = item.in_review === true;
    const isEnded = !isInReview && item.timeLeft === 'Ended';
    const hoursMatch = typeof item.timeLeft === 'string' ? item.timeLeft.match(/^(\d+)h/) : null;
    const isEndingSoon = !isInReview && !isEnded && hoursMatch !== null && parseInt(hoursMatch[1]) < 24;

    // Countdown color from auction_ends_at (same logic as SparkleItemCard)
    const getTimeColor = (): string => {
      if (isEnded) return '#aaa';
      if (!item.auction_ends_at) return isEndingSoon ? '#DD6B20' : '#38A169';
      const diffHours = (new Date(item.auction_ends_at).getTime() - Date.now()) / 3600000;
      if (diffHours <= 2) return '#E53E3E';
      if (diffHours <= 24) return '#DD6B20';
      return '#38A169';
    };
    const timeColor = getTimeColor();

    // Alternating tall / short cards for masonry feel
    const aspectRatio = index % 3 === 0 ? 0.7 : index % 3 === 1 ? 0.95 : 0.8;

    return (
      <TouchableOpacity
        style={styles.moodboardItem}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.9}
      >
        <View style={[styles.moodboardCard, { aspectRatio }]}>
          <RNImage
            source={{ uri: item.photo_url }}
            style={styles.moodboardImage}
            resizeMode="cover"
          />

          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.82)']}
            style={styles.moodboardGradient}
          >
            {/* Seller row */}
            {item.seller && (
              <View style={styles.moodboardSellerRow}>
                {item.seller.avatar_url ? (
                  <RNImage source={{ uri: item.seller.avatar_url }} style={styles.moodboardSellerAvatar} />
                ) : (
                  <View style={styles.moodboardSellerAvatarFallback}>
                    <Ionicons name="person" size={9} color="#FFF" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (item.seller?.id) router.push(`/seller/${item.seller.id}` as any);
                  }}
                >
                  <Text style={styles.moodboardSellerName} numberOfLines={1}>
                    {item.seller.username}
                  </Text>
                </TouchableOpacity>
                {(item.seller.avg_rating ?? 0) > 0 && (
                  <View style={styles.moodboardRatingRow}>
                    <Ionicons name="star" size={9} color="#FFD700" />
                    <Text style={styles.moodboardRatingText}>{item.seller.avg_rating?.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            )}

            {((item as any).discount_amount > 0 || (item as any).relist_count >= 2) && (
              <View style={styles.moodboardBadgeRow}>
                {(item as any).discount_amount > 0 && (
                  <View style={styles.discountBadgeOverlay}>
                    <Text style={[styles.discountBadgeText, { fontSize: 9 }]}>🔥 -{Math.round((item as any).discount_pct ?? 0)}%</Text>
                  </View>
                )}
                {(item as any).relist_count >= 2 && (
                  <View style={styles.relistBadgeOverlay}>
                    <Text style={[styles.relistBadgeText, { fontSize: 9 }]}>↩️ {(item as any).relist_count}×</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.moodboardPriceRow}>
              <View style={styles.moodboardPricePill}>
                <Text style={styles.moodboardPrice} numberOfLines={1}>
                  ${(item.buy_it_now ?? item.price)?.toLocaleString()}
                </Text>
              </View>
              {!!((item as any).bid_count) && (
                <View style={styles.moodboardBidBadge}>
                  <Text style={styles.moodboardBidBadgeText}>{(item as any).bid_count} BIDS</Text>
                </View>
              )}
            </View>
            <Text style={styles.moodboardTitle} numberOfLines={2}>
              {item.name}
            </Text>
            {isInReview ? (
              <View style={styles.moodboardTimeRow}>
                <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                <Text style={[styles.moodboardTime, { color: '#9CA3AF' }]}>
                  In review (~{getReviewMinutesLeft(item.review_ends_at)}m)
                </Text>
              </View>
            ) : item.timeLeft && (
              <View style={styles.moodboardTimeRow}>
                <Ionicons name="time-outline" size={11} color={timeColor} />
                <Text style={[styles.moodboardTime, { color: timeColor }]}>
                  {item.timeLeft}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Top badges */}
          {isEndingSoon && (
            <View style={styles.moodboardEndingSoonBadge}>
              <Ionicons name="flame" size={10} color="#FFF" />
            </View>
          )}
          {isEnded && (
            <View style={styles.moodboardEndedBadge}>
              <Text style={styles.moodboardEndedText}>ENDED</Text>
            </View>
          )}

          {/* Action buttons — top right */}
          <View style={styles.moodboardActions}>
            <GoatGenieAlertBadge
              isActive={!!(item as any).reminder_active}
              onPress={() => handleSetReminder(item)}
              size={28}
            />
            <TouchableOpacity
              style={[styles.moodboardActionBtn, styles.deleteActionButton]}
              onPress={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
            >
              <Ionicons name="trash" size={13} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOfferCard = ({ item }: { item: Offer }) => {
    const timeRemaining = getOfferTimeRemaining(item.expires_at);
    const statusColor = getOfferStatusColor(item.status);
    const isPending = item.status === 'pending';
    return (
      <TouchableOpacity
        style={[styles.offerCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
        onPress={() => router.push(`/item/${item.item_id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.offerCardHeader}>
          <RNImage source={{ uri: item.photo_url }} style={styles.offerItemImage} resizeMode="cover" />
          <View style={styles.offerItemInfo}>
            <Text style={[styles.offerItemName, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.item_name}
            </Text>
            <Text style={[styles.offerSellerName, { color: theme === 'dark' ? '#999' : '#666' }]}>
              Seller: {item.seller_username}
            </Text>
          </View>
        </View>

        <View style={[styles.offerAmountContainer, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
          <Text style={[styles.offerAmountLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Your Offer</Text>
          <Text style={styles.offerAmountValue}>${item.offer_amount.toFixed(2)}</Text>
        </View>

        {item.message ? (
          <View style={[styles.offerMessageContainer, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#EBF8FF' }]}>
            <Ionicons name="chatbubble-outline" size={16} color={theme === 'dark' ? '#999' : '#666'} />
            <Text style={[styles.offerMessageText, { color: theme === 'dark' ? '#CCC' : '#2C5282' }]}>{item.message}</Text>
          </View>
        ) : null}

        <View style={styles.offerStatusRow}>
          <View style={[styles.offerStatusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.offerStatusText}>{getOfferStatusLabel(item.status)}</Text>
          </View>
          {isPending && <Text style={styles.offerTimeRemaining}>{timeRemaining}</Text>}
        </View>

        {item.status === 'accepted' && (
          <View style={[styles.offerStatusMessage, { backgroundColor: '#E6F7ED' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={[styles.offerStatusMessageText, { color: '#2D7A4F' }]}>Offer accepted! Check your orders.</Text>
          </View>
        )}
        {item.status === 'declined' && (
          <View style={[styles.offerStatusMessage, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="close-circle" size={20} color="#F44336" />
            <Text style={[styles.offerStatusMessageText, { color: '#C62828' }]}>Seller declined this offer</Text>
          </View>
        )}
        {item.status === 'expired' && (
          <View style={[styles.offerStatusMessage, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' }]}>
            <Ionicons name="time-outline" size={20} color="#9E9E9E" />
            <Text style={[styles.offerStatusMessageText, { color: '#616161' }]}>Offer expired without response</Text>
          </View>
        )}

        <Text style={styles.offerCreatedDate}>
          Sent {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
  if (filteredAndSortedItems.length === 0) return null;

  return (
    <View style={styles.listFooter}>
      {loadingMore ? (
        <ActivityIndicator size="large" color="#6A0DAD" />
      ) : (
        <Text
          style={[
            styles.listFooterText,
            { color: theme === 'dark' ? '#666' : '#999' }
          ]}
        >
          You&apos;ve reached the end 🐐
        </Text>
      )}
    </View>
  );
};


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EnhancedHeader scrollY={scrollY} />

      <RNAnimated.ScrollView
  style={styles.scrollView}
  contentContainerStyle={styles.scrollContent}
  scrollEventThrottle={16}
  onScroll={RNAnimated.event(
  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
  {
    useNativeDriver: false,
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

      const isBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

      if (isBottom && !loadingMore) {
        setHasTriggeredEnd(true);
      }
    }
  }
)}

>
  {/* Page Title and Back Arrow */}
  <RNAnimated.View
    style={[
      styles.pageHeader,
      {
        backgroundColor: colors.background,
        opacity: headerOpacity,
        transform: [{ scale: headerScale }]
      }
    ]}
  >
    <TouchableOpacity
      onPress={() => router.back()}
      style={styles.backButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
    </TouchableOpacity>
    <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
      My Wishlist
    </Text>
  </RNAnimated.View>





      {/* Stats Bar */}
      <View
        style={[
          styles.statsBar,
          { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF6B35' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {wishlistItems.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>
            Items
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme === 'dark' ? '#333' : '#E5E5E5' }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#38A169' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {activeCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>
            Active
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme === 'dark' ? '#333' : '#E5E5E5' }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#6A0DAD' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            ${totalValue.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>
            Value
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme === 'dark' ? '#333' : '#E5E5E5' }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: totalDiscounts > 0 ? '#10B981' : (theme === 'dark' ? '#555' : '#CCC') }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {totalDiscounts > 0 ? `-$${totalDiscounts.toLocaleString()}` : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>
            Savings
          </Text>
        </View>
      </View>

      {/* Filter & Sort Bar */}
      <View
        style={[
          styles.controlBar,
          { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }
        ]}
      >
        <View style={styles.filterSection}>
          {([
            { key: 'act-now',    emoji: '⚡', label: 'Act Now',   accent: '#E53E3E' },
            { key: 'price-drop', emoji: '📉', label: 'Price Drop', accent: '#38A169' },
            { key: 'desperate',  emoji: '🐐', label: 'Desperate',  accent: '#6A0DAD' },
          ] as { key: FilterOption; emoji: string; label: string; accent: string }[]).map(({ key, emoji, label, accent }) => {
            const isActive = filterBy === key;
            const count = filterCounts[key as keyof typeof filterCounts];
            return (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? accent : (theme === 'dark' ? '#2C2C2E' : '#F5F5F5'),
                  borderColor: isActive ? accent : (theme === 'dark' ? '#3C3C3E' : '#E0E0E0'),
                },
              ]}
              onPress={() => setFilterBy(isActive ? 'all' : key)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterChipEmoji}>{emoji}</Text>
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? '#FFF' : (theme === 'dark' ? '#ECEDEE' : '#555') },
                ]}
              >
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCountBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : accent }]}>
                  <Text style={styles.filterCountText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )})}
        </View>

        <View style={styles.viewControls}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'grid' && styles.viewButtonActive
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons
              name="grid"
              size={20}
              color={viewMode === 'grid' ? '#FFF' : '#6A0DAD'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'list' && styles.viewButtonActive
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === 'list' ? '#FFF' : '#6A0DAD'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'moodboard' && styles.viewButtonActive
            ]}
            onPress={() => setViewMode('moodboard')}
          >
            <MaterialCommunityIcons
              name="view-dashboard"
              size={20}
              color={viewMode === 'moodboard' ? '#FFF' : '#6A0DAD'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'offers' && styles.viewButtonActive]}
            onPress={() => setViewMode('offers')}
          >
            <View>
              <Ionicons name="paper-plane" size={18} color={viewMode === 'offers' ? '#FFF' : '#6A0DAD'} />
              {sentOffers.filter(o => o.status === 'pending').length > 0 && (
                <View style={styles.offerCountBadge}>
                  <Text style={styles.offerCountText}>
                    {sentOffers.filter(o => o.status === 'pending').length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List */}
      {viewMode === 'offers' ? (
        offersLoading ? (
          <ActivityIndicator size="large" color="#6A0DAD" style={{ marginTop: 40 }} />
        ) : sentOffers.length === 0 ? (
          <View style={styles.offersEmptyState}>
            <Ionicons name="paper-plane-outline" size={64} color={theme === 'dark' ? '#666' : '#CCC'} />
            <Text style={[styles.offersEmptyText, { color: colors.textPrimary }]}>No offers sent yet</Text>
            <Text style={[styles.offersEmptySubtext, { color: theme === 'dark' ? '#999' : '#666' }]}>
              Make offers on expired items to negotiate with sellers
            </Text>
          </View>
        ) : (
          <FlatList
            key="offers-view"
            data={sentOffers}
            keyExtractor={(o) => o.id.toString()}
            renderItem={renderOfferCard}
            contentContainerStyle={styles.offersContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )
      ) : viewMode === 'grid' ? (
        <FlatList
          key={`grid-${NUM_COLUMNS}`}
          data={filteredAndSortedItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderGridItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : viewMode === 'moodboard' ? (
        <FlatList
          key={`moodboard-${MOOD_COLUMNS}`}
          data={filteredAndSortedItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMoodboardItem}
          numColumns={MOOD_COLUMNS}
          columnWrapperStyle={styles.moodboardRow}
          contentContainerStyle={styles.moodboardContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          key="list-view"
          data={filteredAndSortedItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      )}

      {/* REAL SPINNER FOOTER */}
      {renderFooter()}
      </RNAnimated.ScrollView>
  )

      {/* Goat Genie Reminder Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <ScrollView ref={modalScrollRef} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <RNImage source={require('../../assets/images/goat.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Goat Genie Alerts</Text>
                </View>
                <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                  <Ionicons name="close" size={28} color={theme === 'dark' ? '#999' : '#666'} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]} numberOfLines={2}>
                {selectedItem?.name}
              </Text>
              <Text style={[styles.modalHint, { color: theme === 'dark' ? '#666' : '#999' }]}>
                BidGoat watches every 10 minutes and pushes you when something changes.
              </Text>

              <View style={styles.reminderOptions}>
                {([
                  { key: 'must_sell', icon: '🔥', label: 'Converts to Must Sell', sub: 'Seller is forced to sell — jump on it' },
                  { key: 'discounted', icon: '💰', label: 'Price Gets Discounted', sub: 'Any drop from the original price' },
                  { key: 'relisted', icon: '🔄', label: 'Relisted 3+ Times', sub: "Seller is desperate — lowball 'em" },
                  { key: 'threshold', icon: '🎯', label: 'Hits My Target Price', sub: 'Set your budget below' },
                ] as { key: keyof WishlistEventSettings; icon: string; label: string; sub: string }[]).map(({ key, icon, label, sub }) => {
                  const active = selectedEvents[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.reminderOption,
                        { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                        active && styles.reminderOptionActive
                      ]}
                      onPress={() => toggleEvent(key)}
                    >
                      <Text style={{ fontSize: 22 }}>{icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reminderOptionText, { color: active ? '#FFF' : (theme === 'dark' ? '#ECEDEE' : '#333') }]}>
                          {label}
                        </Text>
                        <Text style={[styles.reminderOptionSub, { color: active ? 'rgba(255,255,255,0.7)' : (theme === 'dark' ? '#666' : '#999') }]}>
                          {sub}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={22} color="#FFF" />}
                    </TouchableOpacity>
                  );
                })}

                {selectedEvents.threshold && (
                  <View style={[styles.thresholdRow, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0E8FF', borderColor: theme === 'dark' ? '#6A0DAD' : '#B794F4' }]}>
                    <Text style={[styles.thresholdLabel, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>My target price: $</Text>
                    <TextInput
                      style={[styles.thresholdInput, { color: colors.textPrimary, borderBottomColor: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}
                      value={priceThreshold}
                      onChangeText={setPriceThreshold}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={theme === 'dark' ? '#555' : '#BBB'}
                      onFocus={() => setTimeout(() => modalScrollRef.current?.scrollToEnd({ animated: true }), 200)}
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveReminders}
              >
                <LinearGradient
                  colors={['#6A0DAD', '#8B5CF6']}
                  style={styles.saveButtonGradient}
                >
                  <RNImage source={require('../../assets/images/goat.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  <Text style={styles.saveButtonText}>Activate Goat Genie</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 30,
    paddingBottom: 60,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 60,
  },
  emptyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: '80%',
  },
  emptyFeatures: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  emptyFeature: {
    alignItems: 'center',
    gap: 8,
  },
  emptyFeatureText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 4,
  },
  statValueGreen: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
  },

  // Control Bar
  controlBar: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  filterChipEmoji: {
    fontSize: 13,
  },
  filterCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  viewControls: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewButtonActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },

  // Grid View
  gridContainer: {
    paddingHorizontal: 16,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
    alignItems: 'stretch',
  },
  gridItem: {
    flex: 1,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1 / 1.25,
    backgroundColor: '#F0F0F0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  endedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  endedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  endingSoonBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  endingSoonBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridActions: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  gridActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderActionButton: {
    backgroundColor: '#4A90E2',
  },
  deleteActionButton: {
    backgroundColor: '#FF4757',
  },
  gridContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 20,
    minHeight: 40,
  },
  gridBottom: {
    gap: 4,
  },
  gridPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  gridSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  gridSellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  gridSellerName: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    flex: 1,
  },
  gridRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gridRatingText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  listFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  listFooterText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  gridTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  gridTimeTextEnded: {
    color: '#999',
  },

  // List View
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listImage: {
    width: 100,
    height: 100,
    backgroundColor: '#F0F0F0',
  },
  listContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 20,
  },
  listPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 6,
  },
  listTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  listTimeTextEnded: {
    color: '#999',
  },
  listActions: {
    padding: 12,
    justifyContent: 'center',
    gap: 8,
  },
  listActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 20,
  },
  reminderOptions: {
    gap: 12,
    marginBottom: 24,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  reminderOptionActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  reminderOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  reminderOptionSub: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  reminderOptionTextActive: {
    color: '#FFF',
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
    marginTop: -4,
  },
  thresholdLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  thresholdInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    borderBottomWidth: 2,
    paddingBottom: 2,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
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
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  listPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  modalHint: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 17,
  },

  // Moodboard View
  moodboardContainer: {
    paddingHorizontal: 8,
  },
  moodboardRow: {
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  moodboardItem: {
    flex: 1,
  },
  moodboardCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  moodboardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  moodboardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 32,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  moodboardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  moodboardPricePill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  moodboardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6A0DAD',
    letterSpacing: 0.3,
  },
  moodboardBidBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  moodboardBidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  moodboardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: 15,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moodboardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  moodboardTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4ADE80',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moodboardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 6,
  },
  moodboardActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  moodboardEndingSoonBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodboardEndedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moodboardEndedText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moodboardSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  moodboardSellerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  moodboardSellerAvatarFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodboardSellerName: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    maxWidth: 80,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moodboardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moodboardRatingText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlayBadgeStack: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 4,
    alignItems: 'flex-end',
  },
  discountBadgeOverlay: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  relistBadgeOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relistBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  genieActiveButton: {
    backgroundColor: '#6A0DAD',
  },
  listBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
    marginTop: 2,
  },
  moodboardBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 4,
  },

  // Offer inline badge (on wishlist cards)
  offerInlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  offerInlineBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // View button offer count badge
  offerCountBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  offerCountText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },

  // Offers view
  offersContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  offersEmptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  offersEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  offersEmptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Offer cards
  offerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  offerCardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  offerItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  offerItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  offerItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  offerSellerName: {
    fontSize: 14,
  },
  offerAmountContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  offerAmountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  offerAmountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
  },
  offerMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  offerMessageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  offerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  offerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  offerTimeRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  offerStatusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  offerStatusMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  offerCreatedDate: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
  },
});
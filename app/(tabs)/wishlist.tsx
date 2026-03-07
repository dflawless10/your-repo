import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import {
  StyleSheet,
  FlatList,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  Image as RNImage,
  Animated as RNAnimated,
  Platform,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setWishlistItems, removeFromWishlist } from '@/utils/wishlistSlice';
import { AuctionItem } from '@/types/items';
import { persistWishlist, loadWishlist } from '@/utils/persistWishlist';
import { useWishlist } from '@/app/wishlistContext';
import { getAuctionReminders, setAuctionReminders } from '@/api/reminders';
import { registerAlert } from '@/api/alerts';
import { useTheme } from '@/app/theme/ThemeContext';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type SortOption = 'recent' | 'price-low' | 'price-high' | 'ending-soon';
type FilterOption = 'all' | 'active' | 'ended';
type ViewMode = 'grid' | 'list';

export default function WishlistScreen() {
  const { theme, colors } = useTheme();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('ending-soon');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [priceAlertModalVisible, setPriceAlertModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [selectedReminders, setSelectedReminders] = useState<number[]>([120, 60, 30, 10]);
  const [priceThreshold, setPriceThreshold] = useState('');
  const { removeFromWishlist: removeFromWishlistBackend } = useWishlist();
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

  // Calculate total wishlist value
  const totalValue = useMemo(() => {
    return wishlistItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [wishlistItems]);

  // Count active auctions
  const activeCount = useMemo(() => {
    return wishlistItems.filter(item => item.timeLeft && item.timeLeft !== 'Ended').length;
  }, [wishlistItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...wishlistItems];

    // Apply filters
    if (filterBy === 'active') {
      filtered = filtered.filter(item => item.timeLeft && item.timeLeft !== 'Ended');
    } else if (filterBy === 'ended') {
      filtered = filtered.filter(item => item.timeLeft === 'Ended');
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
        const allItems = [...(data.active || []), ...(data.expired || [])];

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
    const existingReminders = await getAuctionReminders(itemId);
    if (existingReminders.length > 0) {
      setSelectedReminders(existingReminders.map(r => r.minutes_before));
    } else {
      setSelectedReminders([120, 60, 30, 10]); // 2 hours, 1 hour, 30 min, 10 min
    }
    setReminderModalVisible(true);
  };

  const saveReminders = async () => {
    if (!selectedItem) return;

    try {
      const itemId = typeof selectedItem.id === 'string' ? parseInt(selectedItem.id) : selectedItem.id;
      const result = await setAuctionReminders(itemId, selectedReminders);

      if (result.success) {
        Alert.alert('✅ Reminders Set!', `You'll be notified before "${result.item_name || 'this item'}" ends`);
        setReminderModalVisible(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to set reminders');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set reminders');
    }
  };

  const handleSetPriceAlert = (item: AuctionItem) => {
    setSelectedItem(item);
    // Default to 10% below current price
    const suggestedPrice = Math.floor((item.price || 0) * 0.9);
    setPriceThreshold(suggestedPrice.toString());
    setPriceAlertModalVisible(true);
  };

  const savePriceAlert = async () => {
    if (!selectedItem || !priceThreshold) {
      Alert.alert('Error', 'Please enter a price threshold');
      return;
    }

    const threshold = parseFloat(priceThreshold);
    if (isNaN(threshold) || threshold <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (threshold >= (selectedItem.price || 0)) {
      Alert.alert('Error', 'Threshold must be below current price');
      return;
    }

    try {
      const itemId = typeof selectedItem.id === 'string' ? parseInt(selectedItem.id) : selectedItem.id;
      const result = await registerAlert(itemId, 'price_drop', threshold);

      if (result.success) {
        Alert.alert(
          '🔔 Price Alert Set!',
          `You'll be notified when "${selectedItem.name}" drops to $${threshold} or below`
        );
        setPriceAlertModalVisible(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to set price alert');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set price alert');
    }
  };

  const toggleReminder = (minutes: number) => {
    setSelectedReminders(prev =>
      prev.includes(minutes)
        ? prev.filter(m => m !== minutes)
        : [...prev, minutes].sort((a, b) => b - a)
    );
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

  const renderGridItem = ({ item }: { item: AuctionItem }) => {
    const isEnded = item.timeLeft === 'Ended';
    // Only show "ending soon" for items with less than 24 hours left
    const isEndingSoon = !isEnded && item.timeLeft && typeof item.timeLeft === 'string' &&
      (item.timeLeft.includes('m') ||
       (item.timeLeft.includes('h') && !item.timeLeft.includes('d') && parseInt(item.timeLeft) < 24));

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
            {isEnded && (
              <View style={styles.endedBadge}>
                <Text style={styles.endedBadgeText}>
                  {item.status === 'sold' ? 'Sold' : item.status === 'expired_unsold' ? 'Expired - Unsold' : 'Ended'}
                </Text>
              </View>
            )}
            {isEndingSoon && (
              <View style={styles.endingSoonBadge}>
                <Ionicons name="flame" size={12} color="#FFF" />
                <Text style={styles.endingSoonBadgeText}>ENDING SOON</Text>
              </View>
            )}

            {/* Alert Badges - Top Right */}
            {(item.reminder_active || item.price_alert_active) && (
              <TouchableOpacity
                style={styles.cardAlertBadge}
                onPress={async (e) => {
                  e.stopPropagation();
                  // Mark reminder as seen if active
                  if (item.reminder_active) {
                    try {
                      const token = await AsyncStorage.getItem('jwtToken');
                      await fetch(`${API_BASE_URL}/api/wishlist/${item.id}/reminder/mark-seen`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      // Refresh wishlist to update badge state
                      fetchWishlist();
                    } catch (error) {
                      console.error('Error marking reminder as seen:', error);
                    }
                  }
                  handleItemPress(item.id);
                }}
              >
                {item.reminder_active && item.price_alert_active ? (
                  // Split circle
                  <View style={styles.cardSplitBadge}>
                    <View style={[styles.cardSplitHalf, styles.cardSplitLeft]} />
                    <View style={[styles.cardSplitHalf, styles.cardSplitRight]} />
                  </View>
                ) : item.reminder_active ? (
                  <View style={[styles.cardSolidBadge, { backgroundColor: '#4A90E2' }]} />
                ) : (
                  <View style={[styles.cardSolidBadge, { backgroundColor: '#10B981' }]} />
                )}
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.gridActions}>
              {!isEnded && (
                <TouchableOpacity
                  style={[styles.gridActionButton, styles.reminderActionButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSetReminder(item);
                  }}
                >
                  <Ionicons name="notifications" size={16} color="#FFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.gridActionButton, styles.priceAlertActionButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleSetPriceAlert(item);
                }}
              >
                <MaterialCommunityIcons name="bell-badge" size={16} color="#FFF" />
              </TouchableOpacity>
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
            <Text style={styles.gridPrice}>${item.price?.toLocaleString()}</Text>
            {item.timeLeft && (
              <View style={styles.gridTimeContainer}>
                <Ionicons name="time-outline" size={14} color={isEnded ? '#999' : '#10B981'} />
                <Text style={[styles.gridTimeText, isEnded && styles.gridTimeTextEnded]}>
                  {item.timeLeft}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: AuctionItem }) => {
    const isEnded = item.timeLeft === 'Ended';

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
          <Text style={styles.listPrice}>${item.price?.toLocaleString()}</Text>
          {item.timeLeft && (
            <View style={styles.listTimeContainer}>
              <Ionicons name="time-outline" size={14} color={isEnded ? '#999' : '#10B981'} />
              <Text style={[styles.listTimeText, isEnded && styles.listTimeTextEnded]}>
                {item.timeLeft}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.listActions}>
          {!isEnded && (
            <TouchableOpacity
              style={[styles.listActionButton, styles.reminderActionButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleSetReminder(item);
              }}
            >
              <Ionicons name="notifications" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.listActionButton, styles.priceAlertActionButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleSetPriceAlert(item);
            }}
          >
            <MaterialCommunityIcons name="bell-badge" size={18} color="#FFF" />
          </TouchableOpacity>
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      );
    }

    if (wishlistItems.length === 0) {
      return renderEmptyState();
    }

    return (
      <>
        {/* Stats Bar */}
        <View style={[styles.statsBar, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{wishlistItems.length}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Items</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme === 'dark' ? '#333' : '#E5E5E5' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme === 'dark' ? '#333' : '#E5E5E5' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statValueGreen]}>
              ${totalValue.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Total Value</Text>
          </View>
        </View>

        {/* Filter & Sort Bar */}
        <View style={[styles.controlBar, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <View style={styles.filterSection}>
            <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>Filter:</Text>
            {(['all', 'active', 'ended'] as FilterOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                  filterBy === option && styles.filterChipActive
                ]}
                onPress={() => setFilterBy(option)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: theme === 'dark' && filterBy !== option ? '#ECEDEE' : '#666' },
                  filterBy === option && styles.filterChipTextActive
                ]}>
                  {option === 'all' ? 'All' : option === 'active' ? 'Active' : 'Ended'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.viewControls}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={20} color={viewMode === 'grid' ? '#FFF' : '#6A0DAD'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={20} color={viewMode === 'list' ? '#FFF' : '#6A0DAD'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List */}
        {viewMode === 'grid' ? (
          <FlatList
            key="grid-view"
            data={filteredAndSortedItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderGridItem}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
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
      </>
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
          { useNativeDriver: false }
        )}
      >
        {/* Page Title and Back Arrow */}
        <RNAnimated.View style={[
          styles.pageHeader,
          {
            backgroundColor: colors.background,
            borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5',
            opacity: headerOpacity,
            transform: [{ scale: headerScale }]
          }
        ]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
             <Ionicons name="arrow-back" size={28} color='#6A0DAD'  />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>My Wishlist</Text>
        </RNAnimated.View>

        {renderContent()}
      </RNAnimated.ScrollView>



      {/* Reminder Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="notifications" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Set Reminders</Text>
              </View>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={[styles.modalSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]} numberOfLines={2}>
                {selectedItem?.name}
              </Text>

              <View style={styles.reminderOptions}>
                {[
                  { minutes: 120, label: '2 Hours', icon: 'time' },
                  { minutes: 60, label: '1 Hour', icon: 'time-outline' },
                  { minutes: 30, label: '30 Minutes', icon: 'alarm' },
                  { minutes: 10, label: '10 Minutes', icon: 'flash' },
                ].map(({ minutes, label, icon }) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.reminderOption,
                      { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                      selectedReminders.includes(minutes) && styles.reminderOptionActive
                    ]}
                    onPress={() => toggleReminder(minutes)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={22}
                      color={selectedReminders.includes(minutes) ? '#FFF' : (theme === 'dark' ? '#B794F4' : '#6A0DAD')}
                    />
                    <Text style={[
                      styles.reminderOptionText,
                      { color: theme === 'dark' ? '#ECEDEE' : '#333' },
                      selectedReminders.includes(minutes) && styles.reminderOptionTextActive
                    ]}>
                      {label} Before
                    </Text>
                    {selectedReminders.includes(minutes) && (
                      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveReminders}
                disabled={selectedReminders.length === 0}
              >
                <LinearGradient
                  colors={selectedReminders.length > 0 ? ['#6A0DAD', '#8B5CF6'] : ['#CCC', '#DDD']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    Save {selectedReminders.length} Reminder{selectedReminders.length !== 1 ? 's' : ''}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Price Alert Modal */}
      <Modal
        visible={priceAlertModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPriceAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="bell-badge" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Set Price Alert</Text>
              </View>
              <TouchableOpacity onPress={() => setPriceAlertModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]} numberOfLines={2}>
              {selectedItem?.name}
            </Text>

            <View style={styles.priceAlertContent}>
              <Text style={[styles.currentPriceLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>
                Current Price: ${selectedItem?.price?.toLocaleString()}
              </Text>

              <Text style={[styles.priceInputLabel, { color: colors.textPrimary }]}>
                Notify me when price drops to:
              </Text>

              <View style={[styles.priceInputContainer, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' }]}>
                <Text style={[styles.dollarSign, { color: colors.textPrimary }]}>$</Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.textPrimary }]}
                  value={priceThreshold}
                  onChangeText={setPriceThreshold}
                  keyboardType="numeric"
                  placeholder="Enter price"
                  placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                />
              </View>

              <Text style={[styles.priceHint, { color: theme === 'dark' ? '#666' : '#999' }]}>
                💡 Tip: Set a price below the current price to get notified when it drops
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={savePriceAlert}
              disabled={!priceThreshold || parseFloat(priceThreshold) <= 0}
            >
              <LinearGradient
                colors={priceThreshold && parseFloat(priceThreshold) > 0 ? ['#6A0DAD', '#8B5CF6'] : ['#CCC', '#DDD']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  Set Price Alert
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingTop: HEADER_MAX_HEIGHT + 48,
    paddingBottom: 120,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 22,
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
    maxWidth: width * 0.8,
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
    paddingVertical: 6,
    paddingHorizontal: 14,
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
  },
  gridItem: {
    flex: 1,
  },
  gridCard: {
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
    height: CARD_WIDTH * 1.25,
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
  priceAlertActionButton: {
    backgroundColor: '#10B981',
  },
  deleteActionButton: {
    backgroundColor: '#FF4757',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 20,
  },
  gridPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 6,
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
    maxHeight: height * 0.75,
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
    padding: 16,
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
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  reminderOptionTextActive: {
    color: '#FFF',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  priceAlertContent: {
    paddingVertical: 24,
  },
  currentPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  priceInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  priceHint: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Alert Badge on Cards
  cardAlertBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardSolidBadge: {
    width: '100%',
    height: '100%',
  },
  cardSplitBadge: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  cardSplitHalf: {
    width: '50%',
    height: '100%',
  },
  cardSplitLeft: {
    backgroundColor: '#4A90E2', // Blue (reminder)
  },
  cardSplitRight: {
    backgroundColor: '#10B981', // Green (price alert)
  },
});

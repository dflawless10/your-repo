import React, { useCallback, useState, useMemo, useRef } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Alert, Modal, Image as RNImage, Animated as RNAnimated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ItemCard from '@/components/ItemCard';
import MascotOverlay from '@/app/components/MascotOverlay';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setWishlistItems, removeFromWishlist } from '@/utils/wishlistSlice';
import { AuctionItem } from '@/types/items';
import { ROUTES } from '@/types/routes';
import { persistWishlist, loadWishlist } from '@/utils/persistWishlist';
import { useWishlist } from '@/app/wishlistContext';
import { getAuctionReminders, setAuctionReminders, formatReminderTime, getCommonReminderOptions } from '@/api/reminders';

const { width } = Dimensions.get('window');

type SortOption = 'recent' | 'price-low' | 'price-high' | 'ending-soon';
type FilterOption = 'all' | 'active' | 'ending-soon' | 'ended';
type ViewMode = 'list' | 'grid' | 'moodboard';

export default function WishlistScreen() {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [selectedReminders, setSelectedReminders] = useState<number[]>([60, 30, 5]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<AuctionItem[]>([]);
  const [showViewModeHelp, setShowViewModeHelp] = useState(false);
  const [showSortHelp, setShowSortHelp] = useState(false);
  const [showFilterHelp, setShowFilterHelp] = useState(false);
  const { removeFromWishlist: removeFromWishlistBackend } = useWishlist();
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  // Calculate total wishlist value
  const totalValue = useMemo(() => {
    return wishlistItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [wishlistItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...wishlistItems];

    // Apply filters
    if (filterBy === 'active') {
      filtered = filtered.filter(item => {
        if (!item.timeLeft) return true;
        return item.timeLeft !== 'Ended';
      });
    } else if (filterBy === 'ending-soon') {
      filtered = filtered.filter(item => {
        if (!item.timeLeft || typeof item.timeLeft !== 'string') return false;
        const match = item.timeLeft.match(/(\d+)h/);
        if (match) {
          const hours = parseInt(match[1]);
          return hours <= 24;
        }
        return false;
      });
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

  // Load persisted wishlist on focus
  const hydrateWishlist = useCallback(async () => {
    const stored = await loadWishlist();
    if (stored.length > 0) {
      dispatch(setWishlistItems(stored));
    }
  }, [dispatch]);

  // Fetch from the backend and persist
  const fetchWishlist = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.log('🐐 Wishlist: No token found');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://10.0.0.170:5000/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐐 Wishlist API response:', data);

        // Handle new active/expired format
        const allItems = [...(data.active || []), ...(data.expired || [])];
        console.log('🐐 Wishlist items count:', allItems.length);

        // Only update if we have items OR if the current state is also empty
        // This prevents clearing items when navigation causes a race condition
        if (allItems.length > 0) {
          dispatch(setWishlistItems(allItems as AuctionItem[]));
          await persistWishlist(allItems);
        } else if (wishlistItems.length === 0) {
          // Only clear if we also have nothing in the state
          dispatch(setWishlistItems([]));
          await persistWishlist([]);
        } else {
          console.log('🐐 Keeping existing items, backend returned empty but we have items in state');
        }
      } else {
        console.log('🐐 Wishlist API error:', response.status);
      }
    } catch (error) {
      console.error('🐐 Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, wishlistItems.length]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      hydrateWishlist(); // load from storage first
      fetchWishlist();   // then refresh from the backend
    }, [hydrateWishlist, fetchWishlist])
  );

  const handleItemPress = (itemId: string | number) => {
    router.push({ pathname: '/item/[itemId]', params: { itemId: String(itemId) } });
  };

  const handleExplorePress = () => {
    router.push(ROUTES.HOME.pathname as any);
  };

  const handleDeleteItem = async (itemId: string | number) => {
    try {
      console.log('🐐 Removing item from wishlist:', itemId);
      // Remove from backend
      await removeFromWishlistBackend(itemId);
      // Remove from Redux state
      dispatch(removeFromWishlist(itemId));
      // Update persisted storage
      const updatedItems = wishlistItems.filter(item => item.id !== itemId);
      await persistWishlist(updatedItems);
      console.log('🐐 Item removed successfully');
    } catch (error) {
      console.error('🐐 Error removing item:', error);
    }
  };

  const handleSetReminder = async (item: AuctionItem) => {
    setSelectedItem(item);

    // Fetch existing reminders for this item
    const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
    const existingReminders = await getAuctionReminders(itemId);
    if (existingReminders.length > 0) {
      const reminderMinutes = existingReminders.map(r => r.minutes_before);
      setSelectedReminders(reminderMinutes);
      console.log('🐐 Loaded existing reminders:', reminderMinutes);
    } else {
      // Default reminders if none exist
      setSelectedReminders([60, 30, 5]);
    }

    setReminderModalVisible(true);
  };

  const saveReminders = async () => {
    if (!selectedItem) return;

    try {
      const itemId = typeof selectedItem.id === 'string' ? parseInt(selectedItem.id) : selectedItem.id;
      const result = await setAuctionReminders(itemId, selectedReminders);

      if (result.success) {
        Alert.alert(
          '✅ Reminders Set!',
          result.item_name
            ? `You'll be notified before "${result.item_name}" ends`
            : 'Your reminders have been saved'
        );
        setReminderModalVisible(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to set reminders');
      }
    } catch (error) {
      console.error('🐐 Error setting reminders:', error);
      Alert.alert('Error', 'Failed to set reminders');
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
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['#F0E6FF', '#F7FAFC', '#FFFFFF']}
        style={styles.emptyGradient}
      >
        {/* Goat Illustration */}
        <View style={styles.emptyIconContainer}>
          <Text style={styles.goatEmoji}>🐐</Text>
        </View>

        <Text style={styles.emptyTitle}>Start Your Collection</Text>
        <Text style={styles.emptySubtitle}>
          Tap the ✨ on any item to save it here.{'\n'}
          We&#39;ll notify you when auctions are ending soon!
        </Text>

        {/* Feature Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="notifications" size={24} color="#6A0DAD" />
            </View>
            <Text style={styles.benefitText}>Get ending soon alerts</Text>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="stats-chart" size={24} color="#6A0DAD" />
            </View>
            <Text style={styles.benefitText}>Track price changes</Text>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="heart" size={24} color="#6A0DAD" />
            </View>
            <Text style={styles.benefitText}>Save your favorites</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exploreButton} onPress={handleExplorePress}>
          <LinearGradient
            colors={['#6A0DAD', '#8B5CF6']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.exploreButtonText}>Explore Auctions</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#6A0DAD', '#8B5CF6']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="star" size={28} color="#FFD700" />
            <Text style={styles.headerTitle}>My Wishlist</Text>
          </View>
          {wishlistItems.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{wishlistItems.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Total Value Banner - Above Filters */}
      {wishlistItems.length > 0 && (
        <View style={styles.valueBannerAboveFilters}>
          <MaterialCommunityIcons name="treasure-chest" size={20} color="#6A0DAD" />
          <Text style={styles.valueTextAboveFilters}>
            Total Value: ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      )}

      {/* Floating Filter/Sort Button */}
      {wishlistItems.length > 0 && (
        <>
          {!showControlPanel ? (
            <TouchableOpacity
              style={styles.floatingControlButton}
              onPress={() => setShowControlPanel(true)}
            >
              <MaterialCommunityIcons name="tune" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.expandedControlPanel}>
              <View style={styles.controlPanelHeader}>
                <Text style={styles.controlPanelTitle}>Filters & View</Text>
                <TouchableOpacity onPress={() => setShowControlPanel(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Filter:</Text>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Text style={styles.controlButtonText}>
                    {filterBy === 'all' ? 'All' : filterBy === 'active' ? 'Active' : filterBy === 'ending-soon' ? 'Soon' : 'Ended'}
                  </Text>
                  <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} color="#6A0DAD" />
                </TouchableOpacity>
              </View>

              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Sort:</Text>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => {
                    const options: SortOption[] = ['recent', 'price-low', 'price-high', 'ending-soon'];
                    const currentIndex = options.indexOf(sortBy);
                    const nextIndex = (currentIndex + 1) % options.length;
                    setSortBy(options[nextIndex]);
                  }}
                >
                  <Text style={styles.controlButtonText}>
                    {sortBy === 'recent' ? 'Recent' : sortBy === 'price-low' ? 'Low' : sortBy === 'price-high' ? 'High' : 'Soon'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6A0DAD" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* View Mode Switcher - Hidden when a control panel is closed */}
          {showControlPanel && (
            <View style={styles.viewModeContainer}>
            <View style={styles.viewModeSwitcher}>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={20} color={viewMode === 'list' ? '#FFF' : '#6A0DAD'} />
                <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>List</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons name="grid" size={20} color={viewMode === 'grid' ? '#FFF' : '#6A0DAD'} />
                <Text style={[styles.viewModeText, viewMode === 'grid' && styles.viewModeTextActive]}>Grid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'moodboard' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('moodboard')}
              >
                <MaterialCommunityIcons name="view-dashboard" size={20} color={viewMode === 'moodboard' ? '#FFF' : '#6A0DAD'} />
                <Text style={[styles.viewModeText, viewMode === 'moodboard' && styles.viewModeTextActive]}>Board</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewModeButton, comparisonMode && styles.viewModeButtonActive]}
                onPress={() => setComparisonMode(!comparisonMode)}
              >
                <MaterialCommunityIcons name="compare" size={20} color={comparisonMode ? '#FFF' : '#6A0DAD'} />
                <Text style={[styles.viewModeText, comparisonMode && styles.viewModeTextActive]}>Compare</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowViewModeHelp(true)} style={styles.viewModeHelpButton}>
              <Ionicons name="help-circle" size={20} color="#6A0DAD" />
            </TouchableOpacity>
          </View>
          )}
        </>
      )}
      
      {/* Expandable Filter Options */}
      {showFilters && (
        <View style={styles.filterOptions}>
          {(['all', 'active', 'ending-soon', 'ended'] as FilterOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.filterChip, filterBy === option && styles.filterChipActive]}
              onPress={() => {
                setFilterBy(option);
                setShowFilters(false);
              }}
            >
              <Text style={[styles.filterChipText, filterBy === option && styles.filterChipTextActive]}>
                {option === 'all' ? 'All Items' : option === 'active' ? 'Active Auctions' : option === 'ending-soon' ? 'Ending Soon (24h)' : 'Ended Auctions'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderGridItem = ({ item }: { item: AuctionItem }) => {
    const isEnded = item.timeLeft === 'Ended';

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.95}
      >
        <View style={styles.gridCard}>
          <View style={styles.gridImageContainer}>
            <RNImage
              source={{ uri: item.photo_url }}
              style={styles.gridImage}
              resizeMode="cover"
            />

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.gridGradient}
            />

            {/* Action Buttons */}
            <View style={styles.gridActions}>
              <TouchableOpacity
                style={styles.gridActionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#FF4757" />
              </TouchableOpacity>

              {item.timeLeft && item.timeLeft !== 'Ended' && (
                <TouchableOpacity
                  style={styles.gridActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSetReminder(item);
                  }}
                >
                  <Ionicons name="notifications-outline" size={18} color="#4A90E2" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.gridContent}>
            <Text style={styles.gridTitle} numberOfLines={2}>{item.name}</Text>

            <View style={styles.gridPriceRow}>
              <Text style={styles.gridPrice}>${item.price?.toLocaleString()}</Text>
            </View>

            {item.timeLeft && (
              <View style={[styles.gridTimeRow, isEnded && styles.gridTimeRowEnded]}>
                <Ionicons name="time-outline" size={12} color={isEnded ? '#999' : '#6A0DAD'} />
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

  const renderMoodboardItem = ({ item }: { item: AuctionItem }) => {
    const isEnded = item.timeLeft === 'Ended';
    const randomHeight = Math.floor(Math.random() * 100) + 200; // Random height between 200-300

    return (
      <TouchableOpacity
        style={[styles.moodboardItem, { height: randomHeight }]}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.95}
      >
        <RNImage
          source={{ uri: item.photo_url }}
          style={styles.moodboardImage}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.moodboardGradient}
        />

        {/* Content Overlay */}
        <View style={styles.moodboardOverlay}>
          <Text style={styles.moodboardTitle} numberOfLines={2}>{item.name}</Text>
          <View style={styles.moodboardBottom}>
            <Text style={styles.moodboardPrice}>${item.price?.toLocaleString()}</Text>
            {item.timeLeft && (
              <View style={styles.moodboardTimeTag}>
                <Ionicons name="time-outline" size={10} color="#FFF" />
                <Text style={styles.moodboardTimeText}>{item.timeLeft}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.moodboardActions}>
          <TouchableOpacity
            style={styles.moodboardActionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteItem(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#FFF" />
          </TouchableOpacity>

          {item.timeLeft && item.timeLeft !== 'Ended' && (
            <TouchableOpacity
              style={styles.moodboardActionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSetReminder(item);
              }}
            >
              <Ionicons name="notifications-outline" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
      {renderHeader()}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          key="grid-view"
          data={filteredAndSortedItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderGridItem}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridColumnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState()}
        />
      ) : viewMode === 'moodboard' ? (
        <FlatList
          key="moodboard-view"
          data={filteredAndSortedItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMoodboardItem}
          numColumns={2}
          contentContainerStyle={styles.moodboardContent}
          columnWrapperStyle={styles.moodboardColumnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState()}
        />
      ) : (
        <FlatList
          key="list-view"
          data={filteredAndSortedItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <TouchableOpacity 
                style={styles.cardContainer}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.95}
              >
                <ItemCard item={item} onPress={() => handleItemPress(item.id)} />
                
                {/* Reminder Button - Only show for active auctions */}
                {item.timeLeft && item.timeLeft !== 'Ended' && (
                  <TouchableOpacity 
                    style={styles.reminderButton}
                    onPress={() => handleSetReminder(item)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#4A90E2', '#5BA3F5']}
                      style={styles.reminderGradient}
                    >
                      <Ionicons name="notifications-outline" size={20} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#FF4757', '#6A0DAD']}
                    style={styles.deleteGradient}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={renderEmptyState()}
          contentContainerStyle={[
            styles.listContent,
            wishlistItems.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      
      {/* Reminder Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="notifications" size={28} color="#4A90E2" />
              <Text style={styles.modalTitle}>Set Auction Reminders</Text>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              {selectedItem?.name}
            </Text>

            <Text style={styles.modalDescription}>
              {selectedReminders.length > 0
                ? `${selectedReminders.length} reminder${selectedReminders.length !== 1 ? 's' : ''} selected`
                : 'Get notified before this auction ends'}
            </Text>

            <View style={styles.reminderOptions}>
              {[
                { minutes: 60, label: '1 Hour Before', icon: 'time-outline' },
                { minutes: 30, label: '30 Minutes Before', icon: 'alarm-outline' },
                { minutes: 15, label: '15 Minutes Before', icon: 'flash-outline' },
                { minutes: 5, label: '5 Minutes Before', icon: 'warning-outline' },
              ].map(({ minutes, label, icon }) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.reminderOption,
                    selectedReminders.includes(minutes) && styles.reminderOptionActive
                  ]}
                  onPress={() => toggleReminder(minutes)}
                >
                  <Ionicons 
                    name={icon as any} 
                    size={24} 
                    color={selectedReminders.includes(minutes) ? '#FFF' : '#4A90E2'} 
                  />
                  <Text style={[
                    styles.reminderOptionText,
                    selectedReminders.includes(minutes) && styles.reminderOptionTextActive
                  ]}>
                    {label}
                  </Text>
                  {selectedReminders.includes(minutes) && (
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
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
                colors={selectedReminders.length > 0 ? ['#4A90E2', '#5BA3F5'] : ['#CCC', '#DDD']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  Set {selectedReminders.length} Reminder{selectedReminders.length !== 1 ? 's' : ''}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Mode Help Modal */}
      <Modal
        visible={showViewModeHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModeHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👁️ View Modes</Text>
              <TouchableOpacity onPress={() => setShowViewModeHelp(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>List View</Text>
                <Text style={styles.modalDescription}>
                  See all details at a glance - perfect for reviewing prices, bids, and time remaining in a detailed format.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Grid View</Text>
                <Text style={styles.modalDescription}>
                  Browse visually with beautiful card layouts - great for seeing more items at once.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Board View</Text>
                <Text style={styles.modalDescription}>
                  Moodboard-style masonry layout - perfect for visual browsing and getting inspired by your collection.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Compare Mode</Text>
                <Text style={styles.modalDescription}>
                  Select multiple items to compare them side by side - useful for deciding between similar pieces.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort Help Modal */}
      <Modal
        visible={showSortHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔄 Sort Options</Text>
              <TouchableOpacity onPress={() => setShowSortHelp(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Recent</Text>
                <Text style={styles.modalDescription}>
                  Shows items in the order you added them, with most recent first.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Price: Low to High</Text>
                <Text style={styles.modalDescription}>
                  Find the best deals! Shows lowest-priced items at the top.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Price: High to Low</Text>
                <Text style={styles.modalDescription}>
                  Browse premium items first - highest prices shown at the top.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Ending Soon</Text>
                <Text style={styles.modalDescription}>
                  Don&#39;t miss out! Items ending soonest appear first so you can bid before it&#39;s too late.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Filter Help Modal */}
      <Modal
        visible={showFilterHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Filter Options</Text>
              <TouchableOpacity onPress={() => setShowFilterHelp(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>All Items</Text>
                <Text style={styles.modalDescription}>
                  Shows everything in your wishlist, including active and ended auctions.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Active Auctions</Text>
                <Text style={styles.modalDescription}>
                  Only shows items that are still accepting bids - great for focusing on current opportunities.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Ending Soon (24h)</Text>
                <Text style={styles.modalDescription}>
                  Items ending within the next 24 hours - perfect for last-minute bidding.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Ended Auctions</Text>
                <Text style={styles.modalDescription}>
                  Shows completed auctions so you can see what you missed or track past items.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: HEADER_MAX_HEIGHT,
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  countText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  listContent: { 
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  cardContainer: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 12,
  },
  emptyState: { 
    flex: 1,
    width: '100%',
  },
  emptyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(106, 13, 173, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  goatEmoji: {
    fontSize: 80,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  exploreButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  valueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  valueText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  valueBannerAboveFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  valueTextAboveFilters: {
    color: '#6A0DAD',
    fontSize: 16,
    fontWeight: '700',
  },
  floatingControlButton: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6A0DAD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  expandedControlPanel: {
    position: 'absolute',
    top: 80,
    right: 16,
    left: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  controlPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6A0DAD',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterBar: {
    flexDirection: 'column',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#6A0DAD',
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#6A0DAD',
    overflow: 'visible',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterOptions: {
    backgroundColor: '#FFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
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
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  reminderButton: {
    position: 'absolute',
    bottom: 8,
    right: 58,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  reminderGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
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
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  reminderOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reminderOptionTextActive: {
    color: '#FFF',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
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
    fontSize: 18,
    fontWeight: '700',
  },
  viewModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    justifyContent: 'space-between',
  },
  viewModeSwitcher: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6A0DAD',
  },
  viewModeButtonActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A0DAD',
    flexShrink: 0,
  },
  viewModeTextActive: {
    color: '#FFF',
  },
  gridContent: {
    padding: 12,
    paddingBottom: 100,
  },
  gridColumnWrapper: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
    marginBottom: 12,
  },
  gridCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    height: (width - 48) / 2 * 1.25,
    backgroundColor: '#F0F0F0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  gridActions: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  gridActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  gridTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
    lineHeight: 20,
  },
  gridPriceRow: {
    marginBottom: 6,
  },
  gridPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  gridTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridTimeRowEnded: {
    opacity: 0.6,
  },
  gridTimeText: {
    fontSize: 11,
    color: '#6A0DAD',
    fontWeight: '500',
  },
  gridTimeTextEnded: {
    color: '#999',
  },
  moodboardContent: {
    padding: 8,
    paddingBottom: 100,
  },
  moodboardColumnWrapper: {
    gap: 8,
  },
  moodboardItem: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  moodboardImage: {
    width: '100%',
    height: '100%',
  },
  moodboardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  moodboardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  moodboardTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moodboardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodboardPrice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moodboardTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(106, 13, 173, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moodboardTimeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  moodboardActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  moodboardActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeHelpButton: {
    padding: 8,
  },
  modalScrollView: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
});



import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
  Text,
  View,
  Image,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Link, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { useAuth } from '@/hooks/AuthContext';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { convertToBuyNow, canConvertToBuyNow } from '@/api/convert';
import GlobalFooter from "../components/GlobalFooter";
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

interface Auction {
  id: string;
  title: string;
  description: string;
  image: string;
  photo_url: string;
  price: number | null;
  startingPrice: number;
  currentPrice: number;
  hasBids: boolean;
  bidCount: number;
  endDate: string;
  endTimeDisplay?: string;
  status: 'active' | 'ended' | 'draft' | 'review';
  selling_strategy?: string;
  is_sold?: boolean;
  review_ends_at: string | null;
  reserve_price?: number;
  relist_count?: number;
  original_item_id?: number;
  buy_it_now?: number;
}



export const unstable_settings = {
  name: 'myAuctions',
};

const API_URL = API_BASE_URL;

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 48 - COLUMN_GAP) / NUM_COLUMNS;

export default function MyAuctionsScreen() {
  const { token, username } = useAuth();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRelistModal, setShowRelistModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'>('all');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDurationHours, setCustomDurationHours] = useState('');
  const [relistPrice, setRelistPrice] = useState('');
  const [showMustSellModal, setShowMustSellModal] = useState(false);
  const [mustSellDuration, setMustSellDuration] = useState<number>(24);
  const [selectedRelistDuration, setSelectedRelistDuration] = useState<number | null>(null);

  const fetchAuctions = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/myauctionscreen`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/login');
        Toast.show({
          type: 'error',
          text1: 'Your goat wandered off!',
          text2: 'Please log in again.',
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🐐 Backend error:', errorData.error || errorData.message);
        Toast.show({
          type: 'error',
          text1: 'Your goat wandered off!',
          text2: 'Please log in again.',
        });
        return;
      }

      const data = await response.json();
      setAuctions(data.auctions || data);
    } catch (error) {
      console.error('🐐 Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, router]);

  useEffect(() => {
    void fetchAuctions();

    // Fade in header title and arrow
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  }, []);

  // Refresh auctions when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      void fetchAuctions();
    }, [fetchAuctions])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchAuctions();
  };

  const handleAuctionPress = async (auction: Auction) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Route to review screen if item is in review status
    if (auction.status === 'review') {
      router.push(`/seller/review-item/${auction.id}`);
    } else {
      router.push(`/item/${auction.id}`);
    }
  };

  // Get duration options based on selling strategy
  const getDurationOptions = (item: Auction | null) => {
    if (!item) return [];

    const strategy = item.selling_strategy;

    if (strategy === 'must_sell') {
      return [
        { label: '1 Day (24 Hours)', hours: 24 },
        { label: '2 Days (48 Hours)', hours: 48 },
        { label: '3 Days (72 Hours)', hours: 72 },
      ];
    }

    // Check if it's a Buy It Now item (either by strategy or by having buy_it_now price)
    if (strategy === 'buy_it_now' || item.buy_it_now) {
      return [
        { label: '7 Days', hours: 7 * 24 },
        { label: '14 Days', hours: 14 * 24 },
        { label: '30 Days', hours: 30 * 24 },
      ];
    }

    // Auction strategy (default) - matches CreateAuctionScreen
    return [
      { label: '24h', hours: 24 },
      { label: '48h', hours: 48 },
      { label: '7 days', hours: 7 * 24 },
      { label: '14 days', hours: 14 * 24 },
      { label: '30 days', hours: 30 * 24 },
    ];
  };

  const handleRelist = async (item: Auction) => {
    setSelectedAuction(item);
    setShowCustomDuration(false);
    setCustomDurationHours('');
    setSelectedRelistDuration(null); // Reset selected duration
    // Pre-fill the relist price with current price for Buy It Now items
    if (item.buy_it_now) {
      setRelistPrice(item.buy_it_now.toString());
    } else {
      setRelistPrice('');
    }
    setShowRelistModal(true);
  };

  const relistItem = async (itemId: string, durationHours: number, durationLabel: string, price?: string) => {
    try {
      const body: any = { duration_hours: durationHours };

      // If price is provided (for Buy It Now items), include it
      if (price) {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
          Toast.show({
            type: 'error',
            text1: 'Invalid Price',
            text2: 'Please enter a valid price',
          });
          return;
        }
        body.price = priceNum;
      }

      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}/relist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: '🐐 Relisted!',
          text2: `Your item is live for ${durationLabel}. Good luck!`,
        });
        await fetchAuctions();
        setShowRelistModal(false);
        setShowCustomDuration(false);
        setCustomDurationHours('');
      } else {
        const error = await response.json();
        Toast.show({
          type: 'error',
          text1: 'Failed to relist',
          text2: error.error || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Relist error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not relist item',
      });
    }
  };

  const handleCustomDurationRelist = () => {
    if (!selectedAuction) return;

    const hours = parseInt(customDurationHours);
    if (isNaN(hours) || hours < 24 || hours > 720) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Duration',
        text2: 'Please enter a duration between 24 and 720 hours',
      });
      return;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    let label = '';
    if (days > 0 && remainingHours > 0) {
      label = `${days} day${days > 1 ? 's' : ''} and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    } else if (days > 0) {
      label = `${days} day${days > 1 ? 's' : ''}`;
    } else {
      label = `${hours} hour${hours > 1 ? 's' : ''}`;
    }

    relistItem(selectedAuction.id, hours, label);
  };

  const handleRemove = (item: Auction) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this ended auction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => { void removeItem(item.id); },
        },
      ]
    );
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: '🗑️ Removed!',
          text2: 'Item has been deleted',
        });
        await fetchAuctions();
      } else {
        let errorMessage = 'Please try again';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Non-JSON error response:', text);
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        Toast.show({
          type: 'error',
          text1: 'Failed to remove',
          text2: errorMessage,
        });
      }
    } catch (error) {
      console.error('Remove error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not remove item',
      });
    }
  };

  const handleConvertToBuyNow = (item: Auction) => {
    setSelectedAuction(item);
    // Pre-fill with current price (which may have been adjusted)
    setBuyNowPrice(item.price?.toString() || '');
    setShowConvertModal(true);
  };

  const handleConvertToMustSell = (item: Auction) => {
    setSelectedAuction(item);
    setMustSellDuration(24); // Default to 24 hours
    setShowMustSellModal(true);
  };

  const convertToMustSell = async () => {
    if (!selectedAuction) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${selectedAuction.id}/convert-must-sell`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration_hours: mustSellDuration }),
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: '🔥 Converted to Must Sell!',
          text2: `Your item is now a ${mustSellDuration}-hour Must Sell auction`,
        });
        setShowMustSellModal(false);
        await fetchAuctions();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Conversion Failed',
          text2: 'Unable to convert to Must Sell. Please try again.',
        });
      }
    } catch (error) {
      console.error('Must Sell conversion error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not convert to Must Sell',
      });
    }
  };

  const convertAuctionToBuyNow = async () => {
    console.log('🔄 Convert to Buy It Now clicked');
    console.log('📊 Selected auction:', selectedAuction);
    console.log('💰 Buy Now Price entered:', buyNowPrice);

    if (!selectedAuction) {
      console.log('❌ No auction selected');
      return;
    }

    const price = parseFloat(buyNowPrice);
    console.log('📊 Parsed price:', price);

    if (isNaN(price) || price <= 0) {
      console.log('❌ Invalid price');
      Toast.show({
        type: 'error',
        text1: 'Invalid Price',
        text2: 'Please enter a valid price greater than 0',
      });
      return;
    }

    console.log('✅ Calling convertToBuyNow API with:', { id: selectedAuction.id, price });
    const result = await convertToBuyNow(selectedAuction.id, price);
    console.log('📊 API result:', result);
    if (result) {
      Toast.show({
        type: 'success',
        text1: '✅ Converted!',
        text2: `Your item is now listed as Buy It Now at $${price.toFixed(2)}`,
      });
      setShowConvertModal(false);
      await fetchAuctions();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Conversion Failed',
        text2: 'Unable to convert auction. Please try again.',
      });
    }
  };

  const getFilteredAuctions = () => {
    return auctions; // Show all auctions
  };

  const getStatusIndicator = (item: Auction, isSold: boolean, hasEnded: boolean) => {
    if (item.status === 'review') {
      return { emoji: '🔍', badge: styles.reviewBadge, label: 'REVIEW' };
    }
    if (isSold) {
      return { emoji: '💰', badge: styles.soldBadge, label: 'SOLD' };
    }
    if (hasEnded) {
      return { emoji: '⏸️', badge: styles.endedBadge, label: 'ENDED' };
    }
    return { emoji: '🟢', badge: styles.activeBadge, label: 'ACTIVE' };
  };

  const getReviewTimeRemaining = (item: Auction) => {
    if (item.status !== 'review' || !item.review_ends_at) return null;
    const now = new Date();
    const reviewEnds = new Date(item.review_ends_at);
    const diffMs = reviewEnds.getTime() - now.getTime();
    const diffMin = Math.ceil(diffMs / 60000);
    return Math.max(diffMin, 0);
  };

  const getTimeDisplayText = (isSold: boolean, hasEnded: boolean, endDate: string) => {
    if (isSold) return 'Sold';
    if (hasEnded) return 'Ended';
    return `Auction ends ${new Date(endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })}`;
  };

  const getBidInfoContent = (item: Auction) => {
    if (item.selling_strategy === 'buy_it_now' || item.buy_it_now) {
      return {
        icon: 'cart-outline' as const,
        color: '#10B981',
        text: 'Buy It Now',
        style: { color: '#10B981', fontWeight: '600' as const }
      };
    }

    if (item.selling_strategy === 'must_sell') {
      return {
        icon: 'flash-outline' as const,
        color: '#EF4444',
        text: 'Must Sell',
        style: { color: '#333', fontWeight: '600' as const }
      };
    }

    const bidText = `${item.original_item_id ? 'First Listing ' : ''}${item.bidCount || 0} bid${item.bidCount !== 1 ? 's' : ''}${item.reserve_price && item.bidCount > 0 && item.currentPrice < item.reserve_price ? ' - Reserve Not Met' : ''}`;

    return {
      icon: 'hammer-outline' as const,
      color: '#666',
      text: bidText,
      style: {}
    };
  };

  const renderAuctionCard = ({ item }: { item: Auction }) => {
    const hasEnded = new Date(item.endDate) <= new Date();
    const hasBids = (item.bidCount || 0) > 0;
    const isSold = item.is_sold || (hasEnded && hasBids);
    const imageUrl = item.photo_url || item.image || 'https://via.placeholder.com/100';

    const statusInfo = getStatusIndicator(item, isSold, hasEnded);
    const reviewMinutesLeft = getReviewTimeRemaining(item);
    const timeDisplayText = getTimeDisplayText(isSold, hasEnded, item.endDate);
    const bidInfo = getBidInfoContent(item);

    console.log("🔍 Review item data:", item.review_ends_at);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleAuctionPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          <View style={[styles.statusBadge, statusInfo.badge]}>
            <Text style={styles.statusText}>
              {statusInfo.emoji}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

          {item.status === 'review' && reviewMinutesLeft !== null && (
            <View style={styles.reviewIndicator}>
              <Ionicons name="hourglass-outline" size={12} color="#FF9800" />
              <Text style={styles.reviewText}>
                Under Review - Goes live in {reviewMinutesLeft}min
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.priceText}>${(item.currentPrice ?? item.startingPrice ?? 0).toFixed(2)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name={bidInfo.icon} size={14} color={bidInfo.color} />
            <Text style={[styles.bidText, bidInfo.style]}>{bidInfo.text}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.timeText} numberOfLines={1}>
              {timeDisplayText}
            </Text>
          </View>

          {hasEnded && !hasBids && !isSold && (
            <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.relistButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRelist(item);
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#fff" />
                  </TouchableOpacity>
                  {/* Show "Convert to Must Sell" for Buy It Now items, "Convert to Buy It Now" for Auctions */}
                  {item.buy_it_now || item.selling_strategy === 'buy_it_now' ? (
                    <TouchableOpacity
                      style={styles.mustSellButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleConvertToMustSell(item);
                      }}
                    >
                      <Ionicons name="flame" size={16} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.convertButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleConvertToBuyNow(item);
                      }}
                    >
                      <Ionicons name="cart" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemove(item);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const filteredAuctions = getFilteredAuctions();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />

      {/* Title with Back Arrow */}
      <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
        </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Listings</Text>
        </Animated.View>



      <Animated.FlatList
        style={{ backgroundColor: colors.background }}
        data={filteredAuctions}
        keyExtractor={(item) => item.id}
        renderItem={renderAuctionCard}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Auctions 🐐</Text>
            <Text style={styles.emptyText}>
              Your goat is waiting to list something fabulous.
            </Text>
          </View>
        }
      />

      <Modal
        visible={showRelistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelistModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedAuction && (selectedAuction.selling_strategy === 'buy_it_now' || selectedAuction.buy_it_now)
                  ? 'Relist Buy It Now'
                  : 'Relist Auction'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]}>
                How long would you like to relist this item?
              </Text>

              {/* Buy It Now Price Input */}
              {selectedAuction && (selectedAuction.selling_strategy === 'buy_it_now' || selectedAuction.buy_it_now) && (
                <View style={styles.priceInputContainer}>
                  <Text style={[styles.priceInputLabel, { color: colors.textPrimary }]}>Buy It Now Price</Text>
                  <View style={[styles.priceInputWrapper, {
                    backgroundColor: theme === 'dark' ? '#2C2C2E' : '#f7fafc',
                    borderColor: theme === 'dark' ? '#3C3C3E' : '#e2e8f0'
                  }]}>
                    <Text style={[styles.dollarSign, { color: colors.textPrimary }]}>$</Text>
                    <TextInput
                      style={[styles.priceInput, {
                        backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF',
                        borderColor: theme === 'dark' ? '#3C3C3E' : '#d1d5db',
                        color: colors.textPrimary
                      }]}
                      value={relistPrice}
                      onChangeText={setRelistPrice}
                      placeholder="0.00"
                      placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Text style={[styles.priceHint, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]}>
                    💡 Tip: You can adjust the price before relisting
                  </Text>
                </View>
              )}

              {selectedAuction && getDurationOptions(selectedAuction).map((option) => {
                const isMustSell = selectedAuction.selling_strategy === 'must_sell';
                const isSelected = isMustSell && selectedRelistDuration === option.hours;

                return (
                  <TouchableOpacity
                    key={option.hours}
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: isMustSell
                          ? (isSelected ? (theme === 'dark' ? '#8B5CF6' : '#FF6B35') : (theme === 'dark' ? '#B794F4' : '#FFA500'))
                          : (theme === 'dark' ? '#B794F4' : '#FF6B35')
                      }
                    ]}
                    onPress={() => {
                      if (selectedAuction) {
                        if (isMustSell) {
                          setSelectedRelistDuration(option.hours);
                        } else {
                          setShowCustomDuration(false);
                          const priceToUse = (selectedAuction.buy_it_now || selectedAuction.selling_strategy === 'buy_it_now') ? relistPrice : undefined;
                          relistItem(selectedAuction.id, option.hours, option.label, priceToUse);
                        }
                      }
                    }}
                  >
                    <Text style={styles.modalButtonText}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}

            {selectedAuction && selectedAuction.selling_strategy === 'auction' && !selectedAuction.buy_it_now && (
              <>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: showCustomDuration ? (theme === 'dark' ? '#8B5CF6' : '#6A0DAD') : (theme === 'dark' ? '#B794F4' : '#FF6B35') }
                  ]}
                  onPress={() => setShowCustomDuration(true)}
                >
                  <Text style={styles.modalButtonText}>
                    Custom
                  </Text>
                </TouchableOpacity>

                {showCustomDuration && (
                  <View style={styles.customDurationContainer}>
                    <TextInput
                      placeholder="Custom duration (hours)"
                      placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                      value={customDurationHours}
                      onChangeText={setCustomDurationHours}
                      keyboardType="numeric"
                      style={[styles.customDurationInput, {
                        backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF',
                        color: colors.textPrimary,
                        borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD'
                      }]}
                    />
                    <Text style={[styles.customDurationHint, { color: theme === 'dark' ? '#999' : '#666' }]}>
                      💡 Choose a preset or enter custom duration (24-720 hours)
                    </Text>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]}
                      onPress={handleCustomDurationRelist}
                    >
                      <Text style={styles.modalButtonText}>Relist with Custom Duration</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Confirm Relist button for Must Sell items */}
            {selectedAuction && selectedAuction.selling_strategy === 'must_sell' && selectedRelistDuration && (
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme === 'dark' ? '#FF6B35' : '#FF4500' }]}
                onPress={() => {
                  if (selectedAuction && selectedRelistDuration) {
                    const option = getDurationOptions(selectedAuction).find(opt => opt.hours === selectedRelistDuration);
                    if (option) {
                      relistItem(selectedAuction.id, option.hours, option.label);
                    }
                  }
                }}
              >
                <Text style={styles.modalButtonText}>🔥 Confirm Relist</Text>
              </TouchableOpacity>
            )}

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#f0f0f0' }]}
                onPress={() => {
                  setShowRelistModal(false);
                  setShowCustomDuration(false);
                  setCustomDurationHours('');
                  setSelectedRelistDuration(null);
                }}
              >
                <Text style={[styles.modalCancelButtonText, { color: theme === 'dark' ? '#999' : '#666' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showConvertModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConvertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Convert to Buy It Now</Text>
            <Text style={styles.modalSubtitle}>
              Set a Buy It Now price for &#34;{selectedAuction?.title}&#34;
            </Text>

            <View style={styles.priceInputContainer}>
              <Text style={styles.priceInputLabel}>Buy It Now Price</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={buyNowPrice}
                  onChangeText={setBuyNowPrice}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              <Text style={styles.priceHint}>
                💡 Tip: Price competitively to attract buyers
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={convertAuctionToBuyNow}
            >
              <Text style={styles.modalButtonText}>Convert to Buy It Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowConvertModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Must Sell Modal */}
      <Modal
        visible={showMustSellModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMustSellModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🔥 Convert to Must Sell</Text>
            <Text style={[styles.modalSubtitle, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]}>
              Choose a Must Sell duration for urgent sale
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: mustSellDuration === 24 ? (theme === 'dark' ? '#8B5CF6' : '#FF6B35') : (theme === 'dark' ? '#B794F4' : '#FFA500') }]}
              onPress={() => setMustSellDuration(24)}
            >
              <Text style={styles.modalButtonText}>24 Hours (Fast Sale)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: mustSellDuration === 48 ? (theme === 'dark' ? '#8B5CF6' : '#FF6B35') : (theme === 'dark' ? '#B794F4' : '#FFA500') }]}
              onPress={() => setMustSellDuration(48)}
            >
              <Text style={styles.modalButtonText}>48 Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: mustSellDuration === 72 ? (theme === 'dark' ? '#8B5CF6' : '#FF6B35') : (theme === 'dark' ? '#B794F4' : '#FFA500') }]}
              onPress={() => setMustSellDuration(72)}
            >
              <Text style={styles.modalButtonText}>72 Hours (3 Days)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme === 'dark' ? '#FF6B35' : '#FF4500' }]}
              onPress={convertToMustSell}
            >
              <Text style={styles.modalButtonText}>🔥 Convert to Must Sell</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#f0f0f0' }]}
              onPress={() => setShowMustSellModal(false)}
            >
              <Text style={[styles.modalCancelButtonText, { color: theme === 'dark' ? '#999' : '#666' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: HEADER_MAX_HEIGHT + 110,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: COLUMN_GAP,
    marginBottom: 12,
  },
  card: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: 'rgba(230, 247, 237, 0.95)', // Light green
  },
  endedBadge: {
    backgroundColor: 'rgba(255, 243, 224, 0.95)', // Light orange/amber
  },
  soldBadge: {
    backgroundColor: 'rgba(200, 250, 205, 0.95)', // Success green
  },
  reviewBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.95)', // Orange
  },
  statusText: {
    fontSize: 14,
  },
  reviewIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
    gap: 4,
  },
  reviewText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
  },
  cardBody: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a202c',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d3436',
  },
  bidText: {
    fontSize: 12,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  relistButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convertButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mustSellButton: {
    flex: 1,
    backgroundColor: '#FF4500',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a202c',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSelected: {
    backgroundColor: '#6A0DAD',
  },
  modalButtonTextSelected: {
    color: '#fff',
  },
  customDurationContainer: {
    width: '100%',
    marginBottom: 12,
  },
  customDurationInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  customDurationHint: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  customDurationSubmitButton: {
    backgroundColor: '#6A0DAD',
  },
  priceInputContainer: {
    marginBottom: 20,
  },
  priceInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  priceHint: {
    fontSize: 12,
    color: '#718096',
    marginTop: 6,
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 34,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 100,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});

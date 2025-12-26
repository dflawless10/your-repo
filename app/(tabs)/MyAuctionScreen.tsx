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

interface Auction {
  id: string;
  title: string;
  description: string;
  image: string;
  photo_url: string;
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

}

export const unstable_settings = {
  name: 'myAuctions',
};

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 48 - COLUMN_GAP) / NUM_COLUMNS;

export default function MyAuctionsScreen() {
  const { token, username } = useAuth();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRelistModal, setShowRelistModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ended' | 'sold'>('all');

  const fetchAuctions = async () => {
    try {
      const response = await fetch('http://10.0.0.170:5000/api/myauctionscreen', {
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
  };

  useEffect(() => {
    void fetchAuctions();
  }, []);

  // Refresh auctions when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      void fetchAuctions();
    }, [])
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

  const handleRelist = async (item: Auction) => {
    setSelectedAuction(item);
    setShowRelistModal(true);
  };

  const relistItem = async (itemId: string, duration: number) => {
    try {
      const response = await fetch(`http://10.0.0.170:5000/api/items/${itemId}/relist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration }),
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: '🐐 Relisted!',
          text2: `Your item is live for ${duration} days. Good luck!`,
        });
        await fetchAuctions();
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

  const handleRemove = async (item: Auction) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this ended auction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(item.id),
        },
      ]
    );
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`http://10.0.0.170:5000/item/${itemId}`, {
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
    setBuyNowPrice('');
    setShowConvertModal(true);
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
    return auctions.filter((auction) => {
      const hasEnded = new Date(auction.endDate) <= new Date();
      const hasBids = (auction.bidCount || 0) > 0;
      const isSold = hasEnded && hasBids;

      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return !hasEnded;
      if (filterStatus === 'ended') return hasEnded && !isSold;
      if (filterStatus === 'sold') return isSold;
      return true;
    });
  };

  const renderAuctionCard = ({ item }: { item: Auction }) => {
    const hasEnded = new Date(item.endDate) <= new Date();
    const hasBids = (item.bidCount || 0) > 0;
    const isSold = hasEnded && hasBids; // Ended with bids = SOLD
    const imageUrl = item.photo_url || item.image || 'https://via.placeholder.com/100';

    // Determine status indicator
    const getStatusIndicator = () => {
      if (item.status === 'review') {
        return { emoji: '🔍', badge: styles.reviewBadge, label: 'REVIEW' };
      } else if (isSold) {
        return { emoji: '💰', badge: styles.soldBadge, label: 'SOLD' };
      } else if (hasEnded) {
        return { emoji: '⏸️', badge: styles.endedBadge, label: 'ENDED' };
      } else {
        return { emoji: '🟢', badge: styles.activeBadge, label: 'ACTIVE' };
      }
    };

    const statusInfo = getStatusIndicator();

    // Calculate review time remaining
    const getReviewTimeRemaining = () => {
      if (item.status !== 'review' || !item.review_ends_at) return null;
      const now = new Date();
      const reviewEnds = new Date(item.review_ends_at);
      const diffMs = reviewEnds.getTime() - now.getTime();
      const diffMin = Math.ceil(diffMs / 60000);
      return Math.max(diffMin, 0);
    };
console.log("🔍 Review item data:", item.review_ends_at);

    const reviewMinutesLeft = getReviewTimeRemaining();

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
            <Ionicons name="hammer-outline" size={14} color="#666" />
            <Text style={styles.bidText}>{item.bidCount || 0} bids</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.timeText} numberOfLines={1}>
              {hasEnded ? 'Ended' : `Auction ends ${new Date(item.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}`}
            </Text>
          </View>

          {hasEnded && !hasBids && (
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
              <TouchableOpacity
                style={styles.convertButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleConvertToBuyNow(item);
                }}
              >
                <Ionicons name="cart" size={16} color="#fff" />
              </TouchableOpacity>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />

      {/* Title with Back Arrow */}
      <View style={styles.headerTitleContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Auctions</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'ended', 'sold'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.FlatList
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
            <Text style={styles.emptyTitle}>No {filterStatus !== 'all' ? filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1) : ''} Auctions 🐐</Text>
            <Text style={styles.emptyText}>
              {filterStatus === 'all'
                ? 'Your goat is waiting to list something fabulous.'
                : `No ${filterStatus} auctions found.`}
            </Text>
          </View>
        }
      />
      <Link href="/CreateAuctionScreen" asChild>
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Create New Auction</Text>
        </TouchableOpacity>
      </Link>

      <Modal
        visible={showRelistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Relist Auction</Text>
            <Text style={styles.modalSubtitle}>How long would you like to relist this item?</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedAuction) {
                  relistItem(selectedAuction.id, 7);
                  setShowRelistModal(false);
                }
              }}
            >
              <Text style={styles.modalButtonText}>7 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedAuction) {
                  relistItem(selectedAuction.id, 14);
                  setShowRelistModal(false);
                }
              }}
            >
              <Text style={styles.modalButtonText}>14 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedAuction) {
                  relistItem(selectedAuction.id, 30);
                  setShowRelistModal(false);
                }
              }}
            >
              <Text style={styles.modalButtonText}>30 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowRelistModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
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
  priceInputContainer: {
    marginBottom: 20,
  },
  priceInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  priceHint: {
    fontSize: 12,
    color: '#718096',
    marginTop: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: HEADER_MAX_HEIGHT,
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Auction {
  item_id: number;
  name: string;
  current_bid: number;
  bid_count: number;
  end_time: string;
  seller_name: string;
  seller_id: number;
  seller_listing_count: number; // Track if this is one of first 5
  status: 'active' | 'ending_soon' | 'ended';
  photo_url?: string;
  images?: string[]; // All listing images
  created_at?: string;
}

interface ViolationRecord {
  item_id: number;
  item_name: string;
  violation_type: string;
  images: string[];
  notes: string;
  timestamp: string;
}

export default function AuctionManagementScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const scrollY = new Animated.Value(0);

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ending_soon' | 'ended' | 'new_users'>('all');

  // Image Review Modal
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Community Guidelines Enforcement Modal
  const [violationModalVisible, setViolationModalVisible] = useState(false);
  const [violationType, setViolationType] = useState('');
  const [violationNotes, setViolationNotes] = useState('');
  const [violationHistory, setViolationHistory] = useState<ViolationRecord[]>([]);

  useEffect(() => {
    loadAuctions();
    loadViolationHistory();
  }, []);

  const loadAuctions = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/auctions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions || []);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadViolationHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/violations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setViolationHistory(data.violations || []);
      }
    } catch (error) {
      console.error('Error loading violations:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAuctions();
    loadViolationHistory();
  };

  // 🖼️ Open Image Review Modal
  const handleReviewImages = (auction: Auction) => {
    setSelectedAuction(auction);
    setSelectedImageIndex(0);
    setImageModalVisible(true);
  };

  // 🗑️ Delete Image
  const handleDeleteImage = async (imageUrl: string) => {
    Alert.alert(
      '⚠️ Delete Image',
      'Are you sure you want to permanently delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const response = await fetch(`${API_BASE_URL}/api/admin/images/delete`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  item_id: selectedAuction?.item_id,
                  image_url: imageUrl,
                }),
              });

              if (response.ok) {
                Alert.alert('✅ Success', 'Image deleted successfully');
                // Refresh auction to get updated image list
                await loadAuctions();
                setImageModalVisible(false);
              } else {
                Alert.alert('Error', 'Failed to delete image');
              }
            } catch (error) {
              console.error('Error deleting image:', error);
              Alert.alert('Error', 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  // 🚨 Flag for Community Guidelines Violation
  const handleFlagViolation = (auction: Auction) => {
    setSelectedAuction(auction);
    setViolationType('');
    setViolationNotes('');
    setViolationModalVisible(true);
  };

  // 💾 Save Entire Listing to Violations (like Add to Wishlist)
  const handleSaveViolation = async () => {
    if (!violationType) {
      Alert.alert('Missing Info', 'Please select a guideline violation');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');

      // Fetch full listing details (like wishlist does)
      const itemResponse = await fetch(`${API_BASE_URL}/api/items/${selectedAuction?.item_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!itemResponse.ok) {
        Alert.alert('Error', 'Could not fetch item details');
        return;
      }

      const itemData = await itemResponse.json();

      // Save to violations table with full snapshot
      const response = await fetch(`${API_BASE_URL}/api/admin/violations/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedAuction?.seller_id,
          item_id: selectedAuction?.item_id,
          guideline_violation: violationType,
          listing_snapshot: JSON.stringify(itemData), // Full listing data as JSON
        }),
      });

      if (response.ok) {
        Alert.alert('✅ Saved to Violations', 'Full listing saved as evidence');
        setViolationModalVisible(false);
        await loadViolationHistory();
      } else {
        Alert.alert('Error', 'Failed to save violation');
      }
    } catch (error) {
      console.error('Error saving violation:', error);
      Alert.alert('Error', 'Failed to save violation');
    }
  };

  const handleEndAuction = (itemId: number) => {
    Alert.alert(
      'End Auction Early',
      'Are you sure you want to end this auction early?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Auction',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const response = await fetch(`${API_BASE_URL}/api/admin/auctions/${itemId}/end`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                Alert.alert('Success', 'Auction ended');
                await loadAuctions();
              }
            } catch (error) {
              console.error('Failed to end auction:', error);
              Alert.alert('Error', 'Failed to end auction');
            }
          },
        },
      ]
    );
  };

  const renderAuction = (auction: Auction) => {
    const timeLeft = Math.max(0, new Date(auction.end_time).getTime() - Date.now());
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    const isEndingSoon = timeLeft < 24 * 60 * 60 * 1000 && timeLeft > 0;
    const hasEnded = timeLeft === 0;
    const isNewUser = auction.seller_listing_count <= 5;

    const getTimeLeftText = () => {
      if (hasEnded) return 'Ended';
      if (daysLeft > 0) return `${daysLeft}d ${hoursLeft}h left`;
      if (hoursLeft > 0) return `${hoursLeft}h ${minutesLeft}m left`;
      return `${minutesLeft}m left`;
    };

    return (
      <View key={auction.item_id} style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
        {/* NEW USER BADGE */}
        {isNewUser && (
          <View style={styles.newUserBanner}>
            <MaterialCommunityIcons name="account-alert" size={16} color="#FFF" />
            <Text style={styles.newUserText}>
              NEW USER - Listing #{auction.seller_listing_count}/5
            </Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{auction.name}</Text>
            {isEndingSoon && (
              <View style={styles.urgentBadge}>
                <Ionicons name="flame" size={12} color="#FFF" />
                <Text style={styles.urgentBadgeText}>ENDING SOON</Text>
              </View>
            )}
            {hasEnded && (
              <View style={[styles.urgentBadge, { backgroundColor: '#666' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                <Text style={styles.urgentBadgeText}>ENDED</Text>
              </View>
            )}
          </View>

          {/* Thumbnail Preview */}
          {auction.photo_url && (
            <Image
              source={{ uri: auction.photo_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          )}

          <Text style={styles.currentBid}>${auction.current_bid.toFixed(2)}</Text>
          <Text style={[styles.bidCount, { color: colors.textSecondary }]}>{auction.bid_count} bids</Text>
          <Text style={[styles.seller, { color: colors.textSecondary }]}>
            Seller: {auction.seller_name} {isNewUser && '⭐ NEW'}
          </Text>
          <View style={styles.endTime}>
            <Ionicons name="time-outline" size={14} color={isDark ? '#999' : '#666'} />
            <Text style={[styles.endTimeText, { color: colors.textSecondary }]}>
              {' '}Ends {new Date(auction.end_time).toLocaleString()}
              {' '}({getTimeLeftText()})
            </Text>
          </View>
        </View>

        {/* ADMIN ACTION BUTTONS */}
        <View style={styles.cardActions}>
          {/* Review Images */}
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => handleReviewImages(auction)}
          >
            <Ionicons name="images" size={16} color="#9C27B0" />
            <Text style={[styles.actionButtonText, { color: '#9C27B0' }]}>Review</Text>
          </TouchableOpacity>

          {/* Flag Violation */}
          <TouchableOpacity
            style={[styles.actionButton, styles.flagButton]}
            onPress={() => handleFlagViolation(auction)}
          >
            <MaterialCommunityIcons name="flag" size={16} color="#FF6B35" />
            <Text style={[styles.actionButtonText, { color: '#FF6B35' }]}>Flag</Text>
          </TouchableOpacity>

          {/* View Listing */}
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => router.push(`/item/${auction.item_id}` as any)}
          >
            <Ionicons name="eye" size={16} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View</Text>
          </TouchableOpacity>

          {/* End Early */}
          {!hasEnded && (
            <TouchableOpacity
              style={[styles.actionButton, styles.endButton]}
              onPress={() => handleEndAuction(auction.item_id)}
            >
              <Ionicons name="stop-circle" size={16} color="#F44336" />
              <Text style={[styles.actionButtonText, { color: '#F44336' }]}>End</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const filteredAuctions = auctions.filter(a => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'new_users') return a.seller_listing_count <= 5;
    if (filterStatus === 'ending_soon') {
      const timeLeft = new Date(a.end_time).getTime() - Date.now();
      return timeLeft < 24 * 60 * 60 * 1000 && timeLeft > 0;
    }
    if (filterStatus === 'ended') return new Date(a.end_time).getTime() <= Date.now();
    if (filterStatus === 'active') return new Date(a.end_time).getTime() > Date.now();
    return a.status === filterStatus;
  });

  const newUserCount = auctions.filter(a => a.seller_listing_count <= 5).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Page Header */}
        <View style={[styles.pageHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={isDark ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Community🐐Guidelines Enforcement </Text>
        </View>

        {/* Filter Chips */}
        <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All' },
              { key: 'new_users', label: `New Users (${newUserCount})` },
              { key: 'active', label: 'Active' },
              { key: 'ending_soon', label: 'Ending Soon' },
              { key: 'ended', label: 'Ended' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  { backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5' },
                  filterStatus === key && styles.filterChipActive,
                ]}
                onPress={() => setFilterStatus(key as any)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isDark ? '#999' : '#666' },
                    filterStatus === key && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Banner */}
        <LinearGradient colors={['#9C27B0', '#6A0DAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statsBanner}>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{auctions.length}</Text>
            <Text style={styles.statsLabel}>Total Auctions</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{newUserCount}</Text>
            <Text style={styles.statsLabel}>New Users (≤5)</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{violationHistory.length}</Text>
            <Text style={styles.statsLabel}>Violations</Text>
          </View>
        </LinearGradient>

        {/* Auction List */}
        {filteredAuctions.length > 0 ? (
          filteredAuctions.map(renderAuction)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="hammer" size={64} color={isDark ? '#444' : '#D1D5DB'} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Auctions</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>No auctions match your filter</Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* 🖼️ IMAGE REVIEW MODAL */}
      <Modal visible={imageModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.imageModal, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>📸 Image Review</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Ionicons name="close" size={28} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedAuction?.name}</Text>


          </View>
        </View>
      </Modal>

      {/* 🚨 COMMUNITY GUIDELINES VIOLATION MODAL */}
      <Modal visible={violationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.violationModal, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🚨 Flag Violation</Text>
                <TouchableOpacity onPress={() => setViolationModalVisible(false)}>
                  <Ionicons name="close" size={28} color={isDark ? '#999' : '#666'} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedAuction?.name}</Text>

              {/* Community Guideline Violation */}
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Community Guideline Violation</Text>
              <View style={styles.violationTypes}>
                {[
                  { key: 'profanity', label: 'Use profanity or offensive language', severity: 'high' },
                  { key: 'contact_info', label: 'Share contact information or external links (email, phone, social media)', severity: 'high' },
                  { key: 'misleading', label: 'Post misleading photos or descriptions', severity: 'high' },
                  { key: 'counterfeit', label: 'List counterfeit, replica, or fake items', severity: 'high' },
                  { key: 'stock_photos', label: 'Use stock photos or images from other websites', severity: 'medium' },
                  { key: 'harassment', label: 'Harass, threaten, or intimidate other users', severity: 'high' },
                  { key: 'price_manipulation', label: 'Manipulate prices or solicit off-platform payments', severity: 'high' },
                  { key: 'pressure_tactics', label: 'Use high-pressure sales tactics', severity: 'medium' },
                ].map(({ key, label, severity }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.violationTypeButton,
                      {
                        backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5',
                        borderColor: severity === 'high' ? '#F44336' : '#FF9800',
                        borderWidth: 2,
                      },
                      violationType === key && styles.violationTypeActive,
                    ]}
                    onPress={() => setViolationType(key)}
                  >
                    <View style={styles.violationLabelRow}>
                      <Text
                        style={[
                          styles.violationTypeText,
                          { color: isDark ? '#ECEDEE' : '#333' },
                          violationType === key && styles.violationTypeTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                      {severity === 'high' && (
                        <View style={styles.severityBadge}>
                          <Text style={styles.severityText}>HIGH</Text>
                        </View>
                      )}
                    </View>
                    {violationType === key && (
                      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save to Violations Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSaveViolation}
                disabled={!violationType}
              >
                <LinearGradient
                  colors={violationType ? ['#F44336', '#E53935'] : ['#CCC', '#DDD']}
                  style={styles.submitButtonGradient}
                >
                  <Ionicons name="save" size={20} color="#FFF" />
                  <Text style={styles.submitButtonText}>Save to Violations</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  backButton: {marginTop: 20, marginRight: 12, padding: 4 },
  pageTitle: { marginTop: 20,fontSize: 16, fontWeight: '700', color: '#1A202C' },
  filterContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#6A0DAD' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#FFF' },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsItem: { alignItems: 'center' },
  statsValue: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  statsLabel: { fontSize: 12, color: '#FFF', marginTop: 4, opacity: 0.9 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  newUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  newUserText: { fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  urgentBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#F5F5F5',
  },
  currentBid: { fontSize: 20, fontWeight: '700', color: '#4CAF50', marginBottom: 4 },
  bidCount: { fontSize: 14, color: '#666', marginBottom: 4 },
  seller: { fontSize: 13, color: '#999', marginBottom: 4 },
  endTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  endTimeText: { fontSize: 13, color: '#666' },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  reviewButton: { backgroundColor: '#F3E5F5' },
  flagButton: { backgroundColor: '#FFF3E0' },
  viewButton: { backgroundColor: '#E3F2FD' },
  endButton: { backgroundColor: '#FFEBEE' },
  actionButtonText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },

  // Image Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModal: {
    width: width * 0.95,
    maxHeight: height * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  violationModal: {
    width: width * 0.95,
    maxHeight: height * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  modalSubtitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 16 },
  imageGallery: { alignItems: 'center' },
  fullImage: {
    width: width * 0.85,
    height: 400,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  imageCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageCounterText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  imageNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  navButtonDisabled: { backgroundColor: '#CCC' },
  deleteImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  deleteImageText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  noImages: { alignItems: 'center', paddingVertical: 60 },
  noImagesText: { fontSize: 16, color: '#999', marginTop: 16 },

  // Violation Modal
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  violationTypes: { gap: 10, marginBottom: 16 },
  violationTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  violationTypeActive: { backgroundColor: '#6A0DAD', borderColor: '#6A0DAD' },
  violationLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  violationTypeText: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },
  violationTypeTextActive: { color: '#FFF' },
  severityBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});

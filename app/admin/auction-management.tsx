import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalFooter from "@/app/components/GlobalFooter";

interface Auction {
  item_id: number;
  name: string;
  current_bid: number;
  bid_count: number;
  end_time: string;
  seller_name: string;
  status: 'active' | 'ending_soon' | 'ended';
}

export default function AuctionManagementScreen() {
  const router = useRouter();
  const scrollY = new Animated.Value(0);

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ending_soon' | 'ended'>('all');

  useEffect(() => {
    loadAuctions();
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadAuctions();
  };

  const handleEndAuction = async (itemId: number) => {
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
                loadAuctions();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to end auction');
            }
          },
        },
      ]
    );
  };

  const renderAuction = (auction: Auction) => {
    const hoursLeft = Math.max(0, Math.floor((new Date(auction.end_time).getTime() - Date.now()) / (1000 * 60 * 60)));
    const isEndingSoon = hoursLeft < 24 && hoursLeft > 0;

    return (
      <View key={auction.item_id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.itemName}>{auction.name}</Text>
            {isEndingSoon && (
              <View style={styles.urgentBadge}>
                <Ionicons name="time" size={12} color="#FFF" />
                <Text style={styles.urgentBadgeText}>ENDING SOON</Text>
              </View>
            )}
          </View>

          <Text style={styles.currentBid}>${auction.current_bid.toFixed(2)}</Text>
          <Text style={styles.bidCount}>{auction.bid_count} bids</Text>
          <Text style={styles.seller}>Seller: {auction.seller_name}</Text>
          <Text style={styles.endTime}>
            <Ionicons name="time-outline" size={14} color="#666" />
            {' '}Ends {new Date(auction.end_time).toLocaleString()}
            {' '}({hoursLeft}h left)
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => router.push(`/item/${auction.item_id}` as any)}
          >
            <Ionicons name="eye" size={16} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.endButton]}
            onPress={() => handleEndAuction(auction.item_id)}
          >
            <Ionicons name="stop-circle" size={16} color="#F44336" />
            <Text style={[styles.actionButtonText, { color: '#F44336' }]}>End Early</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredAuctions = auctions.filter(a => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'ending_soon') {
      const hoursLeft = Math.floor((new Date(a.end_time).getTime() - Date.now()) / (1000 * 60 * 60));
      return hoursLeft < 24 && hoursLeft > 0;
    }
    return a.status === filterStatus;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Page Header with Back Arrow */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Auction Management</Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'ending_soon', 'ended'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

        <LinearGradient
          colors={['#FF9800', '#F57C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBanner}
        >
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{auctions.length}</Text>
            <Text style={styles.statsLabel}>Total Auctions</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>
              {auctions.filter(a => {
                const hours = Math.floor((new Date(a.end_time).getTime() - Date.now()) / (1000 * 60 * 60));
                return hours < 24 && hours > 0;
              }).length}
            </Text>
            <Text style={styles.statsLabel}>Ending Soon</Text>
          </View>
        </LinearGradient>

        {filteredAuctions.length > 0 ? (
          filteredAuctions.map(renderAuction)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="hammer" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Auctions</Text>
            <Text style={styles.emptySubtitle}>No auctions match your filter</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
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
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  backButton: { marginRight: 12, padding: 4 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1A202C' },
  filterContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
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
    padding: 20,
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
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
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  urgentBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  currentBid: { fontSize: 20, fontWeight: '700', color: '#4CAF50', marginBottom: 4 },
  bidCount: { fontSize: 14, color: '#666', marginBottom: 4 },
  seller: { fontSize: 13, color: '#999', marginBottom: 4 },
  endTime: { fontSize: 13, color: '#666' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: { backgroundColor: '#E3F2FD' },
  endButton: { backgroundColor: '#FFEBEE' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
});

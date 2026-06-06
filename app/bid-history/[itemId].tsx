import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';

interface Bid {
  bid_id: number;
  user_id: number;
  username: string;
  amount: number;
  timestamp: string;
  is_auto_bid: boolean;
  is_highest: boolean;
}

export default function BidHistoryScreen() {
  const { theme, colors } = useTheme();
  const params = useLocalSearchParams();
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const [bids, setBids] = useState<Bid[]>([]);
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [otherBids, setOtherBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  console.log('BidHistoryScreen mounted with params:', params);
  console.log('Extracted itemId:', itemId);

  // Fade in header title and arrow
  useEffect(() => {
    console.log('Starting header animation...');
    const timer = setTimeout(() => {
      console.log('Animating header opacity to 1');
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        console.log('Header fade-in complete, starting pulsate loop');
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

    return () => clearTimeout(timer);
  }, [headerOpacity, headerScale]);

  const fetchBidHistory = async () => {
    try {
      // Check if itemId exists
      if (!itemId) {
        console.error('No itemId provided!');
        setLoading(false);
        return;
      }

      // Get current user ID
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);

      // Fetch all bids
      const url = `${API_BASE_URL}/item/${itemId}/bid-history`;
      console.log('Fetching bid history from:', url);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('itemId:', itemId);

      const response = await fetch(url);
      console.log('Bid history response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Bid history data:', data);
        const allBids = data.bid_history || [];
        console.log('Total bids:', allBids.length);
        setBids(allBids);

        // Split into user's bids and others
        if (userId) {
          const myBids = allBids.filter((bid: Bid) => bid.user_id === userId);
          const others = allBids.filter((bid: Bid) => bid.user_id !== userId);
          console.log('User bids:', myBids.length, 'Other bids:', others.length);
          setUserBids(myBids);
          setOtherBids(others);
        } else {
          console.log('No user logged in, showing all bids');
          setUserBids([]);
          setOtherBids(allBids);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch bid history. Status:', response.status, 'Error:', errorText);
        console.error('URL that failed:', url);
      }
    } catch (error) {
      console.error('Error fetching bid history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCurrentUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        return userData.id;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  };

  useEffect(() => {
    fetchBidHistory();
  }, [itemId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBidHistory();
  };

  const renderBid = (bid: Bid, showUsername = true) => (
    <View
      key={bid.bid_id}
      style={[
        styles.bidRow,
        { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#2C2C2E' : '#E5E5E5' },
        bid.is_highest && [styles.highestBidRow, { backgroundColor: theme === 'dark' ? '#2C2C1E' : '#FFFEF8' }],
      ]}
    >
      <View style={styles.bidInfo}>
        <View style={styles.bidHeader}>
          <Text style={[styles.bidAmount, {color: "#6A0DAD" }]}>${bid.amount.toLocaleString()}</Text>
          {bid.is_highest && (
            <View style={styles.winningBadge}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.winningText}>Winning</Text>
            </View>
          )}
        </View>
        {showUsername && (
          <Text style={[styles.bidUsername, { color: "#007AFF" }]}>{bid.username || `User #${bid.user_id}`}</Text>
        )}
        <Text style={[styles.bidTime, { color: "#FF6B35" }]}>
          {formatDistanceToNow(new Date(bid.timestamp), { addSuffix: true })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Page Header with Title and Back Arrow */}
          <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
               <Ionicons name="arrow-back" size={24} color="#6A0DAD"  />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Bid History</Text>
          </Animated.View>

          {userBids.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Bids ({userBids.length})</Text>
              {userBids.map((bid) => renderBid(bid, false))}
            </View>
          )}

          {otherBids.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {userBids.length > 0 ? `Other Bids (${otherBids.length})` : `All Bids (${otherBids.length})`}
              </Text>
              {otherBids.map((bid) => renderBid(bid, true))}
            </View>
          )}

          {bids.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="information-circle-outline" size={48} color="#999" />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No bids yet</Text>
            </View>
          )}
        </Animated.ScrollView>

        <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: HEADER_MAX_HEIGHT,
    paddingBottom: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  bidRow: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  highestBidRow: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  bidInfo: {
    gap: 4,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  winningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  autoBidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  autoBidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  bidUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  bidTime: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});

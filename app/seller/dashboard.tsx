import { API_BASE_URL } from '@/config';

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Animated, RefreshControl, Alert
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from 'expo-router';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { Ionicons } from '@expo/vector-icons';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

type SellerStats = {
  total_revenue: number;
  total_items: number;
  active_auctions: number;
  completed_sales: number;
  total_bids: number;
  total_watchers: number;
  avg_sale_price: number;
  pending_shipments: number;
  items_ending_soon: number;
};

type TrendingItem = {
  id: number;
  name: string;
  photo_url: string;
  bid_count: number;
  watching_count: number;
  current_price: number;
};

const API_URL = API_BASE_URL;

function SellerDashboardScreen() {
  const { theme, colors } = useTheme();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const scrollY = new Animated.Value(0);
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const params = useLocalSearchParams();

  // Fade in header title and arrow
  useEffect(() => {
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
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

useEffect(() => {
  fetchDashboardData();
  loadUsername();
  checkStripeStatus();

  // Check for Stripe onboarding completion from deep link
  if (params.onboarding === 'complete') {
    setTimeout(() => {
      Alert.alert(
        '🎉 Setup Complete!',
        'Your Stripe account has been successfully connected. You can now receive payments from your sales!',
        [{ text: 'Great!', onPress: () => checkStripeStatus() }]
      );
    }, 500);
  }
}, []);

const checkStripeStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    const response = await fetch(`${API_URL}/api/stripe-connect/onboarding/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    console.log('🔵 Stripe status:', data);
    setStripeStatus(data);
  } catch (error) {
    console.error('Error checking Stripe status:', error);
  }
};

const loadUsername = async () => {
  const email = await AsyncStorage.getItem('userEmail');
  const avatar = await AsyncStorage.getItem('avatar_url');
  setUsername(email);
  setAvatarUrl(avatar || null);
};

const fetchDashboardData = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      router.push('/sign-in');
      return;
    }

    // Fetch real dashboard stats from backend
    const response = await fetch(`${API_URL}/api/seller/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      setStats(data);
      console.log('📊 Dashboard stats loaded:', data);
    } else {
      console.error('Failed to fetch dashboard stats:', response.status);
      // Fallback to empty stats on error
      setStats({
        total_revenue: 0,
        total_items: 0,
        active_auctions: 0,
        completed_sales: 0,
        total_bids: 0,
        total_watchers: 0,
        avg_sale_price: 0,
        pending_shipments: 0,
        items_ending_soon: 0,
      });
    }

    setTrending([]);

    // Fetch unread message count
    try {
      const msgRes = await fetch(`${API_URL}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setUnreadMessages(msgData.unread_count ?? 0);
      }
    } catch {
      // non-critical, leave at 0
    }
  } catch (err) {
    console.error('Error loading dashboard:', err);
    // Fallback to empty stats on error
    setStats({
      total_revenue: 0,
      total_items: 0,
      active_auctions: 0,
      completed_sales: 0,
      total_bids: 0,
      total_watchers: 0,
      avg_sale_price: 0,
      pending_shipments: 0,
      items_ending_soon: 0,
    });
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

const onRefresh = () => {
  setRefreshing(true);
  fetchDashboardData();
};

if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EnhancedHeader
        scrollY={scrollY}
        username={username}
        avatarUrl={avatarUrl ?? undefined}
        onSearch={q => console.log('search', q)}
      />

      <ScrollView
        style={{ backgroundColor: colors.background }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 110, paddingBottom: 100, backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Page Title with Back Button */}
        <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Seller Dashboard</Text>
        </Animated.View>

        {/* Stripe Connect Banner */}
        {stripeStatus && !stripeStatus.payouts_enabled && (
          <TouchableOpacity
            style={{
              backgroundColor: '#FFA500',
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => router.push('/seller/stripe-connect-onboarding' as any)}
          >
            <Ionicons name="card" size={28} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16, marginBottom: 4 }}>
                ⚠️ Enable Payments
              </Text>
              <Text style={{ color: '#FFF', fontSize: 14, lineHeight: 18 }}>
                Complete Stripe setup to receive payments from your sales
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Success Banner */}
        {stripeStatus?.payouts_enabled && (
          <View
            style={{
              backgroundColor: '#48BB78',
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Ionicons name="checkmark-circle" size={28} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                ✅ Payments Enabled
              </Text>
              <Text style={{ color: '#FFF', fontSize: 14 }}>
                You're all set to receive payouts
              </Text>
            </View>
          </View>
        )}

        {/* Revenue Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="cash" size={24} color="#10B981" />
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Revenue Overview</Text>
          </View>
          <Text style={[styles.revenueAmount, { color: theme === 'dark' ? '#10B981' : '#10B981' }]}>${stats?.total_revenue.toFixed(2) || '0.00'}</Text>
          <Text style={[styles.revenueSubtext, { color: theme === 'dark' ? '#999' : '#718096' }]}>Total Earnings</Text>
          <View style={[styles.revenueDivider, { backgroundColor: theme === 'dark' ? '#3C3C3E' : '#E5E5EA' }]} />
          <View style={styles.revenueStats}>
            <View style={styles.revenueStatItem}>
              <Text style={[styles.revenueStatValue, { color: colors.textPrimary }]}>{stats?.completed_sales || 0}</Text>
              <Text style={[styles.revenueStatLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Sales</Text>
            </View>
            <View style={styles.revenueStatItem}>
              <Text style={[styles.revenueStatValue, { color: colors.textPrimary }]}>${stats?.avg_sale_price.toFixed(2) || '0.00'}</Text>
              <Text style={[styles.revenueStatLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Avg Price</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsColumns}>
            {/* Left column: Orders to Ship, My Listings, My Messages */}
            <View style={styles.quickActionsLeft}>
              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: theme === 'dark' ? '#C94318' : '#FF6B35' }]}
                onPress={() => router.push('/seller/orders' as any)}
              >
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{stats?.pending_shipments || 0}</Text>
                </View>
                <Ionicons name="cube-outline" size={28} color="#FFF" />
                <Text style={styles.quickActionTitle}>Orders to Ship</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: theme === 'dark' ? '#4A2873' : '#6A0DAD' }]}
                onPress={() => router.push('/MyAuctionScreen' as any)}
              >
                <Ionicons name="list-outline" size={28} color="#FFF" />
                <Text style={styles.quickActionTitle}>My Listings</Text>
                <Text style={styles.quickActionSubtext}>{stats?.total_items || 0} items</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: theme === 'dark' ? '#1A4A6B' : '#2196F3' }]}
                onPress={() => router.push('/messages' as any)}
              >
                {unreadMessages > 0 && (
                  <View style={styles.quickActionBadge}>
                    <Text style={[styles.quickActionBadgeText, { color: '#1565C0' }]}>
                      {unreadMessages}
                    </Text>
                  </View>
                )}
                <Ionicons name="chatbubbles-outline" size={28} color="#FFF" />
                <Text style={styles.quickActionTitle}>My Messages</Text>
              </TouchableOpacity>
            </View>

            {/* Right column: Analytics (tall) */}
            <TouchableOpacity
              style={[styles.quickActionCardTall, { backgroundColor: theme === 'dark' ? '#2C5F4F' : '#10B981' }]}
              onPress={() => router.push('/seller/analytics' as any)}
            >
              <Ionicons name="stats-chart-outline" size={36} color="#FFF" />
              <Text style={styles.quickActionTitle}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Performance Metrics</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
              onPress={() => router.push('/MyAuctionScreen' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={24} color="#EF4444" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.active_auctions || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Active Auctions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
              onPress={() => router.push('/seller/analytics' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="eye" size={24} color="#8B5CF6" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.total_watchers || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Total Watchers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
              onPress={() => router.push('/seller/analytics' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="flash" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.total_bids || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Total Bids</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
              onPress={() => router.push('/MyAuctionScreen' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="time" size={24} color="#EF4444" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.items_ending_soon || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Ending Soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerts Section */}
        {(stats?.items_ending_soon || 0) > 0 || (stats?.pending_shipments || 0) > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Alerts & Notifications</Text>
            {(stats?.items_ending_soon || 0) > 0 ? (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: theme === 'dark' ? '#2C2C1E' : '#FFF5E6', borderColor: theme === 'dark' ? '#8B6914' : '#FEEBC8' }]}
                onPress={() => router.push('/MyAuctionScreen' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Items Ending Soon</Text>
                  <Text style={[styles.alertText, { color: theme === 'dark' ? '#D4A574' : '#92400E' }]}>
                    {stats?.items_ending_soon} {stats?.items_ending_soon === 1 ? 'item' : 'items'} ending in the next 24 hours
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
            {(stats?.pending_shipments || 0) > 0 ? (
              <View style={[styles.alertCard, { backgroundColor: theme === 'dark' ? '#2C1C1E' : '#FEE2E2', borderColor: theme === 'dark' ? '#8B1E1E' : '#FEE2E2' }]}>
                <Ionicons name="cube" size={24} color="#EF4444" />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Pending Shipments</Text>
                  <Text style={[styles.alertText, { color: theme === 'dark' ? '#D4A5A5' : '#92400E' }]}>
                    {stats?.pending_shipments} {stats?.pending_shipments === 1 ? 'order needs' : 'orders need'} to be shipped
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/seller/orders' as any)}>
                  <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Seller Tips</Text>
          <TouchableOpacity
            style={[styles.tipCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
            onPress={() => {
              Alert.alert(
                '💡 Boost Your Sales',
                '✅ Add 3-5 high-quality photos\n' +
                '✅ Write detailed descriptions (200+ words)\n' +
                '✅ Include measurements and materials\n' +
                '✅ Highlight unique features\n' +
                '✅ Mention condition honestly\n\n' +
                'Example: "Vintage Rolex Submariner, 40mm case, stainless steel, automatic movement. Excellent condition with minor wear on clasp. Includes original box and papers. Serviced in 2024."\n\n' +
                'Listings with these elements get 3x more bids!',
                [{ text: 'Got it!' }]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Boost Your Sales</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                Items with detailed descriptions and multiple photos get 3x more bids!
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
            onPress={() => {
              Alert.alert(
                '📸 Quality Photos Matter',
                '✅ Use natural lighting (near a window)\n' +
                '✅ Show multiple angles (front, back, sides)\n' +
                '✅ Include close-ups of details\n' +
                '✅ Capture any flaws or wear\n' +
                '✅ Use a neutral background\n' +
                '✅ Keep photos in focus\n\n' +
                'Photography Tips:\n' +
                '• Avoid flash (causes harsh shadows)\n' +
                '• Clean the item before photographing\n' +
                '• Include size reference (like a coin)\n' +
                '• Take photos during daylight hours\n\n' +
                'Great photos = More bids = Higher prices!',
                [{ text: 'Thanks!' }]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={24} color="#8B5CF6" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Quality Photos Matter</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                Use natural lighting and show multiple angles to attract more buyers.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <GlobalFooter scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: HEADER_MAX_HEIGHT + 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  pageHeader: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,

    paddingBottom: 40,
    backgroundColor: '#F7FAFC',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',

  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginLeft: 8,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 14,
    color: '#718096',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  revenueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  revenueStatItem: {
    alignItems: 'center',
  },
  revenueStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  revenueStatLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionsColumns: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  quickActionsLeft: {
    flex: 1,
    gap: 12,
  },
  quickActionCard: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  quickActionCardTall: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  quickActionBadgeText: {
    color: '#C94318',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: '#718096',
  },
  tipCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
  },
});

export default SellerDashboardScreen;
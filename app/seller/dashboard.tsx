import { API_BASE_URL } from '@/config';

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Animated, RefreshControl
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
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
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;
  const router = useRouter();

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
}, []);

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
            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Seller Dashboard</Text>
        </Animated.View>

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
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme === 'dark' ? '#5C3A29' : '#FF6B35' }]}
              onPress={() => router.push('/seller/orders' as any)}
            >
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{stats?.pending_shipments || 0}</Text>
              </View>
              <Ionicons name="cube-outline" size={32} color="#FFF" />
              <Text style={styles.quickActionTitle}>Orders to Ship</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme === 'dark' ? '#4A2873' : '#6A0DAD' }]}
              onPress={() => router.push('/MyAuctionScreen' as any)}
            >
              <Ionicons name="list-outline" size={32} color="#FFF" />
              <Text style={styles.quickActionTitle}>My Listings</Text>
              <Text style={styles.quickActionSubtext}>{stats?.total_items || 0} items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme === 'dark' ? '#2C5F4F' : '#10B981' }]}
              onPress={() => router.push('/seller/analytics' as any)}
            >
              <Ionicons name="stats-chart-outline" size={32} color="#FFF" />
              <Text style={styles.quickActionTitle}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Performance Metrics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
              <Ionicons name="flame" size={24} color="#EF4444" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.active_auctions || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Active Auctions</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
              <Ionicons name="eye" size={24} color="#8B5CF6" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.total_watchers || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Total Watchers</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
              <Ionicons name="flash" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.total_bids || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Total Bids</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
              <Ionicons name="time" size={24} color="#EF4444" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.items_ending_soon || 0}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Ending Soon</Text>
            </View>
          </View>
        </View>

        {/* Alerts Section */}
        {(stats?.items_ending_soon || 0) > 0 || (stats?.pending_shipments || 0) > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Alerts & Notifications</Text>
            {(stats?.items_ending_soon || 0) > 0 ? (
              <View style={[styles.alertCard, { backgroundColor: theme === 'dark' ? '#2C2C1E' : '#FFF5E6', borderColor: theme === 'dark' ? '#8B6914' : '#FEEBC8' }]}>
                <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Items Ending Soon</Text>
                  <Text style={[styles.alertText, { color: theme === 'dark' ? '#D4A574' : '#92400E' }]}>
                    {stats?.items_ending_soon} {stats?.items_ending_soon === 1 ? 'item' : 'items'} ending in the next 24 hours
                  </Text>
                </View>
              </View>
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
          <View style={[styles.tipCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Boost Your Sales</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                Items with detailed descriptions and multiple photos get 3x more bids!
              </Text>
            </View>
          </View>
          <View style={[styles.tipCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <Ionicons name="camera" size={24} color="#8B5CF6" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Quality Photos Matter</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                Use natural lighting and show multiple angles to attract more buyers.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <GlobalFooter />
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
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  quickActionBadgeText: {
    color: '#FFF',
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
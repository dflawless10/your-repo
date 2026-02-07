import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

const { width } = Dimensions.get('window');

interface Analytics {
  users: { total: number; new_today: number; new_this_week: number; new_this_month: number };
  items: { total: number; active: number; sold: number; avg_price: number };
  transactions: { total_sales: number; total_revenue: number; avg_sale_price: number; today_sales: number };
  engagement: { total_bids: number; total_favorites: number; total_messages: number };
  platform_earnings?: {
    total_commission: number;
    commission_today: number;
    commission_this_week: number;
    commission_this_month: number;
    payment_processing_fees: number;
    premium_subscriptions: number;
    featured_listing_fees: number;
  };
}

export default function ReportsAnalyticsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [analytics, setAnalytics] = useState<Analytics>({
    users: { total: 0, new_today: 0, new_this_week: 0, new_this_month: 0 },
    items: { total: 0, active: 0, sold: 0, avg_price: 0 },
    transactions: { total_sales: 0, total_revenue: 0, avg_sale_price: 0, today_sales: 0 },
    engagement: { total_bids: 0, total_favorites: 0, total_messages: 0 },
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    // Fade in header title and arrow
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

  const loadAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, colors }: any) => (
    <View style={styles.metricCard}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.metricGradient}>
        <Ionicons name={icon} size={32} color="#FFF" />
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Page Header with Back Arrow */}
        <Animated.View style={[styles.pageHeader, { backgroundColor: colors.surface, opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Reports & Analytics</Text>
        </Animated.View>

        {/* User Metrics */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>User Growth</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Users"
            value={analytics.users.total}
            icon="people"
            colors={['#2196F3', '#1976D2']}
          />
          <MetricCard
            title="New Today"
            value={analytics.users.new_today}
            icon="person-add"
            colors={['#4CAF50', '#388E3C']}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            title="This Week"
            value={analytics.users.new_this_week}
            subtitle="New Users"
            icon="trending-up"
            colors={['#FF9800', '#F57C00']}
          />
          <MetricCard
            title="This Month"
            value={analytics.users.new_this_month}
            subtitle="New Users"
            icon="calendar"
            colors={['#9C27B0', '#7B1FA2']}
          />
        </View>

        {/* Item Metrics */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Inventory</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Items"
            value={analytics.items.total}
            icon="cube"
            colors={['#6A0DAD', '#8B5CF6']}
          />
          <MetricCard
            title="Active Listings"
            value={analytics.items.active}
            icon="pricetag"
            colors={['#00BCD4', '#0097A7']}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Sold Items"
            value={analytics.items.sold}
            icon="checkmark-circle"
            colors={['#4CAF50', '#388E3C']}
          />
          <MetricCard
            title="Avg Price"
            value={`$${analytics.items.avg_price.toFixed(2)}`}
            icon="cash"
            colors={['#FF9800', '#F57C00']}
          />
        </View>

        {/* Transaction Metrics */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Revenue</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Revenue"
            value={`$${analytics.transactions.total_revenue.toFixed(2)}`}
            icon="wallet"
            colors={['#4CAF50', '#388E3C']}
          />
          <MetricCard
            title="Total Sales"
            value={analytics.transactions.total_sales}
            icon="cart"
            colors={['#2196F3', '#1976D2']}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Avg Sale"
            value={`$${analytics.transactions.avg_sale_price.toFixed(2)}`}
            icon="trending-up"
            colors={['#FF9800', '#F57C00']}
          />
          <MetricCard
            title="Today's Sales"
            value={`$${analytics.transactions.today_sales.toFixed(2)}`}
            icon="today"
            colors={['#9C27B0', '#7B1FA2']}
          />
        </View>

        {/* Platform Earnings */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💰 BidGoat Platform Earnings</Text>
        {analytics.platform_earnings ? (
          <>
            <View style={styles.metricsRow}>
              <MetricCard
                title="Total Commission"
                value={`$${analytics.platform_earnings.total_commission.toFixed(2)}`}
                subtitle="All Time"
                icon="cash-outline"
                colors={['#10B981', '#059669']}
              />
              <MetricCard
                title="Today"
                value={`$${analytics.platform_earnings.commission_today.toFixed(2)}`}
                subtitle="Commission"
                icon="today-outline"
                colors={['#8B5CF6', '#7C3AED']}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                title="This Week"
                value={`$${analytics.platform_earnings.commission_this_week.toFixed(2)}`}
                subtitle="Commission"
                icon="calendar-outline"
                colors={['#F59E0B', '#D97706']}
              />
              <MetricCard
                title="This Month"
                value={`$${analytics.platform_earnings.commission_this_month.toFixed(2)}`}
                subtitle="Commission"
                icon="trending-up-outline"
                colors={['#EF4444', '#DC2626']}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                title="Payment Processing"
                value={`$${analytics.platform_earnings.payment_processing_fees.toFixed(2)}`}
                subtitle="Fees Collected"
                icon="card-outline"
                colors={['#06B6D4', '#0891B2']}
              />
              <MetricCard
                title="Premium Subs"
                value={`$${analytics.platform_earnings.premium_subscriptions.toFixed(2)}`}
                subtitle="$19.99/mo"
                icon="star-outline"
                colors={['#6366F1', '#4F46E5']}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                title="Featured Listings"
                value={`$${analytics.platform_earnings.featured_listing_fees.toFixed(2)}`}
                subtitle="$10 per listing"
                icon="flash-outline"
                colors={['#EC4899', '#DB2777']}
              />
              <MetricCard
                title="Total Profit"
                value={`$${(
                  analytics.platform_earnings.total_commission +
                  analytics.platform_earnings.payment_processing_fees +
                  analytics.platform_earnings.premium_subscriptions +
                  analytics.platform_earnings.featured_listing_fees
                ).toFixed(2)}`}
                subtitle="All Revenue Streams"
                icon="trophy-outline"
                colors={['#14B8A6', '#0D9488']}
              />
            </View>
          </>
        ) : (
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: 14 }]}>
            Platform earnings data not available
          </Text>
        )}

        {/* Engagement Metrics */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Engagement</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Bids"
            value={analytics.engagement.total_bids}
            icon="hammer"
            colors={['#F44336', '#D32F2F']}
          />
          <MetricCard
            title="Favorites"
            value={analytics.engagement.total_favorites}
            icon="heart"
            colors={['#E91E63', '#C2185B']}
          />
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  backButton: { marginRight: 12, padding: 4 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  scrollView: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricGradient: {
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#FFF',
    opacity: 0.8,
    marginTop: 2,
  },
});

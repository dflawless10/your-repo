import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader from '../components/EnhancedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalFooter from "@/app/components/GlobalFooter";

const { width } = Dimensions.get('window');

interface Analytics {
  users: { total: number; new_today: number; new_this_week: number; new_this_month: number };
  items: { total: number; active: number; sold: number; avg_price: number };
  transactions: { total_sales: number; total_revenue: number; avg_sale_price: number; today_sales: number };
  engagement: { total_bids: number; total_favorites: number; total_messages: number };
}

export default function ReportsAnalyticsScreen() {
  const router = useRouter();
  const scrollY = new Animated.Value(0);

  const [analytics, setAnalytics] = useState<Analytics>({
    users: { total: 0, new_today: 0, new_this_week: 0, new_this_month: 0 },
    items: { total: 0, active: 0, sold: 0, avg_price: 0 },
    transactions: { total_sales: 0, total_revenue: 0, avg_sale_price: 0, today_sales: 0 },
    engagement: { total_bids: 0, total_favorites: 0, total_messages: 0 },
  });

  useEffect(() => {
    loadAnalytics();
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
    <View style={styles.container}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* User Metrics */}
        <Text style={styles.sectionTitle}>User Growth</Text>
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
        <Text style={styles.sectionTitle}>Inventory</Text>
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
        <Text style={styles.sectionTitle}>Revenue</Text>
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

        {/* Engagement Metrics */}
        <Text style={styles.sectionTitle}>Engagement</Text>
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
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 180 : 180,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
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

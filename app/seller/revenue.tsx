import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { API_BASE_URL } from '@/config';

const API_URL = API_BASE_URL;

type Transaction = {
  id: number;
  item_id: number;
  item_name: string;
  sale_price: number;
  commission_fee: number;
  payment_processing_fee: number;
  total_fee: number;
  your_payout: number;
  premium_seller: boolean;
  date: string;
  status: string;
};

type RevenueSummary = {
  total_sales: number;
  total_commission_fees: number;
  total_processing_fees: number;
  total_bidgoat_fees: number;
  net_payout: number;
  transaction_count: number;
};

type RevenueData = {
  summary: RevenueSummary;
  transactions: Transaction[];
};

export default function RevenueScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`${API_URL}/api/seller/analytics/revenue`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const revenueData = await response.json();
        setData(revenueData);
      } else {
        console.error('Failed to fetch revenue:', response.status);
      }
    } catch (error) {
      console.error('Revenue fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRevenue();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.headerTitleContainer}>
          <View style={styles.titleWithArrow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
              <Ionicons name="arrow-back" size={28} color="#6A0DAD" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitleText}>Revenue</Text>
              <Text style={styles.headerSubtitle}>Track your earnings</Text>
            </View>
          </View>
        </View>
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 200 }} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.headerTitleContainer}>
          <View style={styles.titleWithArrow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
              <Ionicons name="arrow-back" size={28} color="#6A0DAD" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitleText}>Revenue</Text>
              <Text style={styles.headerSubtitle}>Track your earnings</Text>
            </View>
          </View>
        </View>
        <Text style={styles.errorText}>Failed to load revenue data</Text>
        <TouchableOpacity onPress={fetchRevenue} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { summary, transactions } = data;

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={28} color="#6A0DAD" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitleText}>Revenue</Text>
            <Text style={styles.headerSubtitle}>Track your earnings</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.container}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.mainCard}>
          <Text style={styles.cardLabel}>Total Sales</Text>
          <Text style={styles.mainValue}>${summary.total_sales.toFixed(2)}</Text>
          <Text style={styles.cardSubtext}>{summary.transaction_count} transaction{summary.transaction_count === 1 ? '' : 's'}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.smallCard}>
            <Text style={styles.smallCardLabel}>Your Payout</Text>
            <Text style={styles.smallCardValue}>${summary.net_payout.toFixed(2)}</Text>
          </View>
          <View style={styles.smallCard}>
            <Text style={styles.smallCardLabel}>Total Fees</Text>
            <Text style={[styles.smallCardValue, styles.feeText]}>
              -${summary.total_bidgoat_fees.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Fee Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Fee Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Commission Fees (8%)</Text>
          <Text style={styles.breakdownValue}>
            ${summary.total_commission_fees.toFixed(2)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Payment Processing (3%)</Text>
          <Text style={styles.breakdownValue}>
            ${summary.total_processing_fees.toFixed(2)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownTotal}>Total BidGoat Fees</Text>
          <Text style={styles.breakdownTotalValue}>
            ${summary.total_bidgoat_fees.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Premium CTA */}
      <TouchableOpacity
        style={styles.premiumBanner}
        onPress={() => router.push('/seller/premium' as any)}
      >
        <View style={styles.premiumIcon}>
          <Ionicons name="star" size={24} color="#FFD700" />
        </View>
        <View style={styles.premiumContent}>
          <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
          <Text style={styles.premiumSubtext}>
            Reduce fees to 8% total (5% commission + 3% processing)
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      {/* Transaction History */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {tx.item_name}
                </Text>
                {tx.premium_seller && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                )}
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sale Price</Text>
                  <Text style={styles.detailValue}>${tx.sale_price.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Commission</Text>
                  <Text style={[styles.detailValue, styles.feeText]}>
                    -${tx.commission_fee.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Processing</Text>
                  <Text style={[styles.detailValue, styles.feeText]}>
                    -${tx.payment_processing_fee.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.payoutLabel}>Your Payout</Text>
                  <Text style={styles.payoutValue}>${tx.your_payout.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.transactionFooter}>
                <Text style={styles.dateText}>{formatDate(tx.date)}</Text>
                <View style={[styles.statusBadge, tx.status === 'pending' && styles.statusPending]}>
                  <Text style={styles.statusText}>
                    {tx.status === 'pending' ? '⏳ Pending' : '✅ Paid'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
      </Animated.ScrollView>
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
    backgroundColor: '#F7FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E53E3E',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 48,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  titleWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  scrollContent: {
    paddingTop: 240,
    paddingBottom: 20,
  },
  summaryContainer: {
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#FF6B35',
    padding: 24,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  mainValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallCardLabel: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 6,
  },
  smallCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#48BB78',
  },
  feeText: {
    color: '#E53E3E',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#4A5568',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  breakdownTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53E3E',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD580',
  },
  premiumIcon: {
    marginRight: 12,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
  },
  premiumSubtext: {
    fontSize: 13,
    color: '#718096',
  },
  transactionsSection: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#A0AEC0',
    paddingVertical: 32,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginRight: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B7791F',
  },
  transactionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  payoutLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#48BB78',
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 13,
    color: '#A0AEC0',
  },
  statusBadge: {
    backgroundColor: '#C6F6D5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FED7D7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22543D',
  },
});

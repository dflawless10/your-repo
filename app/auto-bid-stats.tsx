 import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';

interface AutoBidStats {
  active_auto_bids: number;
  auto_bid_wins: number;
  amount_saved: number;
}

export default function AutoBidStatsScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AutoBidStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch('http://10.0.0.170:5000/api/auto-bid/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch auto-bid stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1 }}>
          <EnhancedHeader scrollY={scrollY} />
          <View style={styles.container}>
            <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
          </View>
        </View>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1 }}>
          <EnhancedHeader scrollY={scrollY} />
          <View style={styles.container}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load stats</Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1 }}>
        <EnhancedHeader scrollY={scrollY} />
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Title with Back Button */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>⚡ Auto-Bid Statistics</Text>
        </View>

        {/* Active Auto-Bids Card */}
        <View style={styles.statCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={32} color="#FF9800" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Active Auto-Bids</Text>
            <Text style={styles.statValue}>{stats.active_auto_bids}</Text>
            <Text style={styles.statDescription}>
              Currently monitoring {stats.active_auto_bids} auction{stats.active_auto_bids !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Wins Card */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, styles.successIcon]}>
            <Ionicons name="trophy" size={32} color="#4CAF50" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Auto-Bid Wins</Text>
            <Text style={[styles.statValue, styles.successValue]}>{stats.auto_bid_wins}</Text>
            <Text style={styles.statDescription}>
              Won {stats.auto_bid_wins} auction{stats.auto_bid_wins !== 1 ? 's' : ''} using auto-bid
            </Text>
          </View>
        </View>

        {/* Amount Saved Card */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, styles.savingsIcon]}>
            <Ionicons name="cash" size={32} color="#2196F3" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Total Saved</Text>
            <Text style={[styles.statValue, styles.savingsValue]}>
              ${stats.amount_saved.toFixed(2)}
            </Text>
            <Text style={styles.statDescription}>
              Amount saved by not reaching max bid
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#6A0DAD" />
            <Text style={styles.infoTitle}>How Auto-Bid Works</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              💡 <Text style={styles.infoBold}>Active Auto-Bids:</Text> Number of auctions where you have auto-bidding enabled
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              🏆 <Text style={styles.infoBold}>Auto-Bid Wins:</Text> Total auctions won using auto-bid instead of manual bidding
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              💰 <Text style={styles.infoBold}>Total Saved:</Text> The difference between your max bid and the actual winning amount. This shows how much you saved by not over-bidding!
            </Text>
          </View>
        </View>

        {/* Strategy Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Strategy Tips</Text>

          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="flash" size={20} color="#FF6B6B" />
              <Text style={styles.tipStrategy}>Aggressive</Text>
            </View>
            <Text style={styles.tipText}>
              Best for high-demand items. Waits until the last 2 minutes and bids every 30 seconds.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="pulse" size={20} color="#6A0DAD" />
              <Text style={styles.tipStrategy}>Moderate</Text>
            </View>
            <Text style={styles.tipText}>
              Balanced approach. Bids every 5 minutes when outbid. Good for most auctions.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="moon" size={20} color="#4CAF50" />
              <Text style={styles.tipStrategy}>Passive</Text>
            </View>
            <Text style={styles.tipText}>
              Low-key strategy. Only bids in the final 30 minutes every 10 minutes.
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F7FAFC',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  successIcon: {
    backgroundColor: '#E8F5E9',
  },
  savingsIcon: {
    backgroundColor: '#E3F2FD',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 4,
  },
  successValue: {
    color: '#4CAF50',
  },
  savingsValue: {
    color: '#2196F3',
  },
  statDescription: {
    fontSize: 13,
    color: '#A0AEC0',
  },
  infoSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6A0DAD',
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
    color: '#1A202C',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipStrategy: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  tipText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
});

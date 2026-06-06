import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';
import { orders } from '@/types/orders';

const API_URL = `${API_BASE_URL}`;

export default function PastPurchasesScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [pastPurchases, setPastPurchases] = useState<orders[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    fetchPastPurchases();
  }, []);

  const fetchPastPurchases = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.replace('/sign-in');
        return;
      }

      const response = await fetch(`${API_URL}/api/buyer/past-purchases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPastPurchases(data.past_purchases || []);
      }
    } catch (error) {
      console.error('Error fetching past purchases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPastPurchases(prev => prev.filter(o => o.id !== orderId));
        Alert.alert('✓ Deleted', 'Order removed from Past Purchases');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      Alert.alert('Error', 'Failed to delete order');
    }
  };

  const handleDeleteOrder = (orderId: number) => {
    Alert.alert(
      'Delete Order',
      'Are you sure you want to permanently delete this order from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteOrder(orderId),
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
   void fetchPastPurchases();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

      {/* Page Header */}
      <View style={[styles.pageHeader, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Past Purchases</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6A0DAD" />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {pastPurchases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={64} color={theme === 'dark' ? '#666' : '#CCC'} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Past Purchases</Text>
            <Text style={[styles.emptySubtitle, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]}>
              Orders you archive will appear here
            </Text>
          </View>
        ) : (
          pastPurchases.map((order) => (
            <View
              key={order.id}
              style={[
                styles.orderCard,
                { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }
              ]}
            >
              <TouchableOpacity
                onPress={() => router.push(`/item/${order.item_id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <Image source={{ uri: order.photo_url }} style={styles.productImage} />
                  <View style={styles.orderInfo}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {order.item_name}
                    </Text>
                    <Text style={[styles.orderDate, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]}>
                      Purchased {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.orderPrice, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
                      ${order.total_amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.orderActions}>
                {!order.review_submitted && !order.review_submitted_at && (
                  <TouchableOpacity
                    style={[styles.reviewButton, { backgroundColor: theme === 'dark' ? '#3730A3' : '#6A0DAD' }]}
                    onPress={() => {
                      if (!order.seller?.id || order.seller.id === null || order.seller.id === undefined) {
                        Alert.alert('Error', 'Seller information is unavailable for this order.');
                        return;
                      }
                      router.push(`/seller/${order.seller.id}?itemId=${order.item_id}&orderId=${order.id}`);
                    }}
                  >
                    <Ionicons name="star-outline" size={16} color="#FFF" />
                    <Text style={styles.reviewButtonText}>Leave Review</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteOrder(order.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    marginRight: 12,
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingTop: 50,
  },
  content: {
    flex: 1,
    marginTop: HEADER_MAX_HEIGHT + 48,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  reviewButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});

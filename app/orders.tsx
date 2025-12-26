import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";

const API_URL = 'http://10.0.0.170:5000';

type Order = {
  id: number;
  item_id: number;
  item_name: string;
  photo_url: string;
  sale_price: number;
  shipping_cost: number;
  insurance_cost: number;
  total_amount: number;
  seller: {
    id: number;
    name: string;
    email: string;
  };
  tracking_number?: string;
  carrier?: string;
  status: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
};

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    fetchOrders();
    loadUsername();
  }, []);

  const loadUsername = async () => {
    const name = await AsyncStorage.getItem('userEmail');
    setUsername(name);
  };

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`http://10.0.0.170:5000/api/buyer/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const carriers: Record<string, string> = {
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };
    return carriers[carrier] || `https://www.google.com/search?q=${carrier}+${trackingNumber}`;
  };

  const handleTrackPackage = (carrier: string, trackingNumber: string) => {
    const url = getTrackingUrl(carrier, trackingNumber);
    Linking.openURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return '#F6AD55';
      case 'shipped':
        return '#4299E1';
      case 'delivered':
        return '#48BB78';
      default:
        return '#A0AEC0';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return 'time-outline';
      case 'shipped':
        return 'rocket-outline';
      case 'delivered':
        return 'checkmark-circle';
      default:
        return 'cube-outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return 'Awaiting Shipment';
      case 'shipped':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Page Title with Back Button */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>My Orders</Text>
        </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-handle-outline" size={64} color="#CBD5E0" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>
            Start shopping and your orders will appear here
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/discover')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ordersContainer}>
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <Image source={{ uri: order.photo_url }} style={styles.itemImage} />
                <View style={styles.orderInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {order.item_name}
                  </Text>
                  <Text style={styles.sellerText}>
                    Sold by {order.seller.name}
                  </Text>
                  <Text style={styles.orderDate}>
                    Ordered {formatDate(order.created_at)}
                  </Text>
                </View>
              </View>

              {/* Status */}
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Ionicons name={getStatusIcon(order.status)} size={16} color="#fff" />
                  <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                </View>
              </View>

              {/* Tracking */}
              {order.tracking_number && (
                <TouchableOpacity
                  style={styles.trackingCard}
                  onPress={() => handleTrackPackage(order.carrier || 'USPS', order.tracking_number!)}
                >
                  <View style={styles.trackingInfo}>
                    <Ionicons name="location" size={20} color="#4299E1" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackingLabel}>Tracking Number</Text>
                      <Text style={styles.trackingNumber}>
                        {order.carrier}: {order.tracking_number}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#4299E1" />
                </TouchableOpacity>
              )}

              {/* Price Breakdown */}
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Item Price</Text>
                  <Text style={styles.priceValue}>${order.sale_price.toFixed(2)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Shipping</Text>
                  <Text style={styles.priceValue}>${order.shipping_cost.toFixed(2)}</Text>
                </View>
                {order.insurance_cost > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Insurance</Text>
                    <Text style={styles.priceValue}>${order.insurance_cost.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
                </View>
              </View>

              {/* Order Actions */}
              {order.status === 'delivered' && (
                <TouchableOpacity 
                  style={styles.reviewButton}
                  onPress={() => {
                    console.log('🐐 Review button pressed:', {
                      sellerId: order.seller.id,
                      itemId: order.item_id,
                      orderId: order.id,
                      sellerData: order.seller
                    });
                    if (!order.seller.id) {
                      Alert.alert('Error', 'Seller ID is missing. Please try refreshing the orders.');
                      return;
                    }
                    router.push(`/seller/${order.seller.id}?itemId=${order.item_id}&orderId=${order.id}`);
                  }}
                >
                  <Ionicons name="star-outline" size={18} color="#FF6B35" />
                  <Text style={styles.reviewButtonText}>Leave a Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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
  ordersContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
  },
  sellerText: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: '#A0AEC0',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  trackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  trackingLabel: {
    fontSize: 12,
    color: '#2C5282',
    marginBottom: 2,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C5282',
  },
  priceBreakdown: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#718096',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#48BB78',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B35',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

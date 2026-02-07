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
import { Audio } from 'expo-av';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { ReturnRequestModal } from '@/app/components/ReturnRequestModal';
import { useTheme } from '@/app/theme/ThemeContext';

const API_URL = 'http://10.0.0.170:5000';

// Goat bleat sound function
const playGoatBleat = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/animals/sounds/goat-bleating-3.mp3' },
      { shouldPlay: true, volume: 0.5 }
    );
    await sound.playAsync();
    // Unload sound after playing
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('🐐 Bleat sound error:', error);
  }
};

type Order = {
  id: number;
  item_id: number;
  item_name: string;
seller_username: string;
  photo_url: string;
  sale_price: number;
  shipping_cost: number;
  insurance_cost: number;
  total_amount: number;
  bidgoat_commission?: number;
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
  review_submitted?: boolean;
  review_submitted_at?: string;
  urgency_level?: string;
  urgency_score?: number;
  premium_shipping?: boolean;
  premium_shipping_hours?: number;
  premium_shipping_cost?: number;
  time_remaining?: string;
  is_late?: boolean;
};

export default function BuyerOrdersScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const scrollY = new Animated.Value(0);
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in header title and arrow - wait for screen to fully render first
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000, // 2 seconds - slow and dramatic
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
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
    }, 500); // 500ms delay - let screen render fully first

    fetchOrders();
    loadUsername();
  }, []);

  // Play goat bleat when a review is submitted
  useEffect(() => {
    const reviewedOrder = orders.find(
      order => order.status === 'delivered' && order.review_submitted
    );
    if (reviewedOrder) {
      playGoatBleat();
    }
  }, [orders]);

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
        console.log('🐐 Buyer orders fetched:', data.orders?.length, 'orders');
        console.log('🐐 First order:', data.orders?.[0]);
        console.log('🐐 First order commission:', data.orders?.[0]?.bidgoat_commission);
        setOrders(data.orders);
      } else {
        console.error('🐐 Orders fetch failed:', response.status);
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

  const handleConfirmDelivery = async (orderId: number) => {
    Alert.alert(
      'Confirm Delivery',
      'Have you received this order in good condition?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I Received It',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              console.log('🐐 Confirming delivery for order:', orderId);
              console.log('🐐 API URL:', `${API_URL}/api/orders/${orderId}/confirm-delivery`);

              const response = await fetch(`${API_URL}/api/orders/${orderId}/confirm-delivery`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              console.log('🐐 Response status:', response.status);
              const responseText = await response.text();
              console.log('🐐 Response text:', responseText);

              if (response.ok) {
                Alert.alert('Success!', 'Thank you for confirming delivery. The seller has been notified.');
                fetchOrders(); // Refresh list
              } else {
                try {
                  const error = JSON.parse(responseText);
                  Alert.alert('Error', error.error || 'Failed to confirm delivery');
                } catch (error) {
                  console.error('Confirm server response error:', error);
                  Alert.alert('Error', `Server error: ${responseText}`);
                }
              }
            } catch (error) {
              console.error('Confirm delivery error:', error);
              Alert.alert('Error', `Failed to confirm delivery: ${error}`);
            }
          },
        },
      ]
    );
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string | undefined) => {
    const carriers: Record<string, string> = {
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };
    return carriers[carrier] || `https://www.google.com/search?q=${carrier}+${trackingNumber}`;
  };

  const handleTrackPackage = (carrier: string, trackingNumber: string | undefined) => {
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

  const getUrgencyBadge = (urgencyLevel?: string, premiumHours?: number) => {
    if (premiumHours) {
      return { emoji: '🚀', label: String(premiumHours) + 'H RUSH', color: '#805AD5', bgColor: '#E9D8FD' };
    }
    switch (urgencyLevel) {
      case 'urgent':
        return { emoji: '🔥', label: 'URGENT', color: '#E53E3E', bgColor: '#FED7D7' };
      case 'high':
        return { emoji: '⚡', label: 'HIGH PRIORITY', color: '#DD6B20', bgColor: '#FEEBC8' };
      case 'normal':
        return { emoji: '📦', label: 'STANDARD', color: '#3182CE', bgColor: '#BEE3F8' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading your orders...</Text>
      </View>
    );
  }

  // @ts-ignore
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, backgroundColor: colors.background }}
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
        <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>My Orders</Text>
        </Animated.View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-handle-outline" size={64} color={theme === 'dark' ? '#666' : '#CBD5E0'} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No orders yet</Text>
          <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#718096' }]}>
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
          {orders.map((order) => {
            const urgencyBadge = getUrgencyBadge(order.urgency_level, order.premium_shipping_hours);
            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
                {/* Urgency Badge */}
                {urgencyBadge && (
                  <View style={[styles.urgencyBadge, { backgroundColor: urgencyBadge.bgColor }]}>
                    <Text style={styles.urgencyEmoji}>{urgencyBadge.emoji}</Text>
                    <Text style={[styles.urgencyLabel, { color: urgencyBadge.color }]}>
                      {urgencyBadge.label}
                    </Text>
                  </View>
                )}

                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <Image source={{ uri: order.photo_url }} style={styles.itemImage} />
                  <View style={styles.orderInfo}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {order.item_name}
                    </Text>
                    <Text style={[styles.sellerText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                      {`Sold by ${order.seller.name}`}
                    </Text>
                    <Text style={[styles.orderDate, { color: theme === 'dark' ? '#666' : '#A0AEC0' }]}>
                      {`Ordered ${formatDate(order.created_at)}`}
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
              {!!(order.tracking_number) && (
                <TouchableOpacity
                  style={[styles.trackingCard, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#EBF8FF' }]}
                  onPress={() => handleTrackPackage(order.carrier || 'USPS', order.tracking_number)}
                >
                  <View style={styles.trackingInfo}>
                    <Ionicons name="location" size={20} color="#4299E1" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.trackingLabel, { color: theme === 'dark' ? '#64B5F6' : '#2C5282' }]}>Tracking Number</Text>
                      <Text style={[styles.trackingNumber, { color: theme === 'dark' ? '#64B5F6' : '#2C5282' }]}>
                        {`${order.carrier}: ${order.tracking_number}`}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#4299E1" />
                </TouchableOpacity>
              )}

              {/* Price Breakdown */}
              <View style={[styles.priceBreakdown, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Item Price</Text>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>${order.sale_price.toFixed(2)}</Text>
                </View>
                {order.bidgoat_commission != null && order.bidgoat_commission > 0 && (
                  <View style={{ marginTop: -4, marginBottom: 8 }}>
                    <Text style={[styles.feeInfoLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                      (incl. BidGoat fee 8%: ${order.bidgoat_commission.toFixed(2)})
                    </Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Shipping</Text>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>${order.shipping_cost.toFixed(2)}</Text>
                </View>
                {order.insurance_cost > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Insurance</Text>
                    <Text style={[styles.priceValue, { color: colors.textPrimary }]}>${order.insurance_cost.toFixed(2)}</Text>
                  </View>
                )}
                {!!(order.premium_shipping_cost) && order.premium_shipping_cost > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                      {order.premium_shipping_hours ? `🚀 Premium Rush (${order.premium_shipping_hours}h)` : '🚀 Premium Rush'}
                    </Text>
                    <Text style={[styles.priceValue, { color: colors.textPrimary }]}>${order.premium_shipping_cost.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]} />
                <View style={styles.priceRow}>
                  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Paid</Text>
                  <Text style={styles.totalValue}>
                    ${(order.total_amount || (order.sale_price + order.shipping_cost + order.insurance_cost)).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Order Actions */}
              {order.status === 'shipped' && (
                <TouchableOpacity
                  style={styles.confirmDeliveryButton}
                  onPress={() => handleConfirmDelivery(order.id)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#48BB78" />
                  <Text style={styles.confirmDeliveryButtonText}>Confirm Delivery</Text>
                </TouchableOpacity>
              )}

              {order.status === 'delivered' && !order.review_submitted && (
                <View>
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => {
                      Alert.alert(
                        'Leave a Review',
                        `How was your experience with ${order.seller.name}?`,
                        [
                          {
                            text: 'Maybe Later',
                            style: 'cancel',
                            onPress: () => console.log('Review postponed')
                          },
                          {
                            text: 'Leave Review',
                            onPress: () => {
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
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="star-outline" size={18} color="#FF6B35" />
                    <Text style={styles.reviewButtonText}>Leave a Review</Text>
                  </TouchableOpacity>
                </View>
              )}

              {order.status === 'delivered' && (
                <TouchableOpacity
                  style={styles.returnButton}
                  onPress={() => {
                    setSelectedOrder(order);
                    setReturnModalVisible(true);
                  }}
                >
                  <Ionicons name="return-up-back" size={18} color="#6A0DAD" />
                  <Text style={styles.returnButtonText}>Request Return</Text>
                </TouchableOpacity>
              )}

              {order.status === 'delivered' && order.review_submitted && (
                <View style={[styles.goatThankYouBanner, { backgroundColor: theme === 'dark' ? '#2C2C1E' : '#FFF5E6', borderColor: theme === 'dark' ? '#8B6914' : '#FFD580' }]}>
                  <Text style={styles.goatEmoji}>🐐</Text>
                  <View style={styles.goatThankYouContent}>
                    <Text style={[styles.goatThankYouTitle, { color: theme === 'dark' ? '#FFD580' : '#B8860B' }]}>Thanks from the Goat!</Text>
                    <Text style={[styles.goatThankYouText, { color: theme === 'dark' ? '#D4A574' : '#8B6914' }]}>
                      Your review helps our community make better decisions. Baaa-rilliant! 🎉
                    </Text>
                  </View>
                </View>
              )}
              </View>
            );
          })}
        </View>
      )}
      </Animated.ScrollView>

      {/* Return Request Modal */}
      {selectedOrder && (
        <ReturnRequestModal
          visible={returnModalVisible}
          onClose={() => {
            setReturnModalVisible(false);
            setSelectedOrder(null);
          }}
          order={{
            id: selectedOrder.id,
            item_id: selectedOrder.item_id,
            item_name: selectedOrder.item_name,
            photo_url: selectedOrder.photo_url,
            sale_price: selectedOrder.sale_price,
            delivered_at: selectedOrder.delivered_at || '',
            seller_username: selectedOrder.seller_username || '',
          }}
          returnPolicy={{
            return_policy: 'returns_accepted',
            return_window_days: 30,
            buyer_pays_return_shipping: false,
            restocking_fee_percent: 0,
          }}
          onSuccess={() => {
            setReturnModalVisible(false);
            setSelectedOrder(null);
            fetchOrders(); // Refresh orders list
          }}
        />
      )}

       <GlobalFooter />
    </View>
  );
}

const createStyles = (isDark: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ordersContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: isDark ? '#1C1C1E' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  urgencyEmoji: {
    fontSize: 16,
  },
  urgencyLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  premiumCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#805AD5',
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
  feeInfoLabel: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
    marginTop: -4,
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
  confirmDeliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#48BB78',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  confirmDeliveryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
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
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6A0DAD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  returnButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  reviewSubmittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9AE6B4',
    gap: 10,
  },
  reviewSubmittedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2F855A',
  },
  goatThankYouBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5E6',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD580',
    gap: 12,
  },
  goatEmoji: {
    fontSize: 32,
    marginTop: 4,
  },
  goatThankYouContent: {
    flex: 1,
  },
  goatThankYouTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B8860B',
    marginBottom: 4,
  },
  goatThankYouText: {
    fontSize: 14,
    color: '#8B6914',
    lineHeight: 20,
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

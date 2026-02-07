import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, {HEADER_MAX_HEIGHT} from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import SalesCelebrationModal from '@/app/components/SalesCelebrationModal';
import { API_BASE_URL } from '@/config';
import { formatShippingTimeRemaining } from '@/utils/time';
import { useTheme } from '@/app/theme/ThemeContext';

const API_URL = API_BASE_URL;

type Order = {
  id: number;
  item_id: number;
  item_name: string;
  photo_url: string;
  sale_price: number;
  shipping_cost: number;
  insurance_cost?: number;
  total_amount: number;
  bidgoat_commission?: number;
  seller_payout?: number;
  seller_username: string;
  buyer: {
    name: string;
    email: string;
  };
  shipping_address: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  tracking_number?: string;
  carrier?: string;
  status: string;
  created_at: string;
  shipped_at?: string;
  shipping_deadline?: string;
  urgency_level?: string;
  urgency_score?: number;
  listing_type?: string;
  premium_shipping?: boolean;
  premium_shipping_hours?: number;
  premium_shipping_cost?: number;
  time_remaining?: string;
  hours_remaining?: number;
  is_late?: boolean;
};

export default function SellerOrdersScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('USPS');
  const [shipping, setShipping] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationOrder, setCelebrationOrder] = useState<Order | null>(null);

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

      const response = await fetch(`${API_URL}/api/seller/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐐 Seller orders fetched:', data.orders?.length, 'orders');
        console.log('🐐 First order data:', data.orders?.[0]);
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

  const openShipModal = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber('');
    setCarrier('USPS');
    setShipModalVisible(true);
  };

  const handleMarkShipped = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    setShipping(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder?.id}/ship`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          carrier: carrier,
        }),
      });

      if (response.ok) {
        setShipModalVisible(false);
        // Show celebration modal
        setCelebrationOrder(selectedOrder);
        setCelebrationVisible(true);
        fetchOrders(); // Refresh list
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Ship order error:', error);
      Alert.alert('Error', 'Failed to update order');
    } finally {
      setShipping(false);
    }
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return '⏳ Awaiting Shipment';
      case 'shipped':
        return '📦 Shipped';
      case 'delivered':
        return '✅ Delivered';
      default:
        return status;
    }
  };

  const getUrgencyBadge = (urgencyLevel?: string, isLate?: boolean) => {
    if (isLate) {
      return { emoji: '⚠️', label: 'OVERDUE', color: '#E53E3E', bgColor: '#FED7D7' };
    }
    switch (urgencyLevel) {
      case 'urgent':
        return { emoji: '🔥', label: 'URGENT', color: '#E53E3E', bgColor: '#FED7D7' };
      case 'high':
        return { emoji: '⚡', label: 'HIGH', color: '#DD6B20', bgColor: '#FEEBC8' };
      case 'normal':
        return { emoji: '📦', label: 'NORMAL', color: '#3182CE', bgColor: '#BEE3F8' };
      default:
        return null;
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending_shipment');
  const shippedOrders = orders.filter(o => o.status !== 'pending_shipment');

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={[styles.headerTitleContainer, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
          <View style={styles.titleWithArrow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
              <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Selling Orders</Text>
          </View>
        </View>
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 200 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />

      {/* Title with Back Arrow */}
      <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Selling Orders</Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
    paddingTop: 240,
    paddingBottom: 40,
    backgroundColor: colors.background,
  }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <Text style={styles.statNumber}>{pendingOrders.length}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <Text style={styles.statNumber}>{shippedOrders.length}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Shipped</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <Text style={styles.statNumber}>{orders.length}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Total</Text>
          </View>
        </View>

        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🚨 Action Required</Text>
            {pendingOrders.map((order) => {
              const urgencyBadge = getUrgencyBadge(order.urgency_level, order.is_late);
              return (
                <View key={order.id} style={[styles.orderCard, styles.orderPending, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
                  {/* Urgency Badge */}
                  {urgencyBadge && (
                    <View style={[styles.urgencyBadge, { backgroundColor: urgencyBadge.bgColor }]}>
                      <Text style={styles.urgencyEmoji}>{urgencyBadge.emoji}</Text>
                      <Text style={[styles.urgencyLabel, { color: urgencyBadge.color }]}>
                        {urgencyBadge.label}
                      </Text>
                      {order.premium_shipping && (
                        <View style={styles.premiumShippingTag}>
                          <Ionicons name="flash" size={14} color="#FFF" />
                          <Text style={styles.premiumShippingText}>RUSH</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Time Remaining */}
                  {order.shipping_deadline && (
                    <View style={[styles.timeRemainingBanner, order.is_late && styles.timeRemainingLate]}>
                      <Ionicons
                        name={order.is_late ? "warning" : "time-outline"}
                        size={18}
                        color={order.is_late ? "#E53E3E" : "#2D3748"}
                      />
                      <Text style={[styles.timeRemainingText, order.is_late && styles.timeRemainingTextLate]}>
                        {formatShippingTimeRemaining(order.shipping_deadline)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.orderHeader}>
                    <Image source={{ uri: order.photo_url }} style={styles.itemImage} />
                    <View style={styles.orderInfo}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                        {order.item_name}
                      </Text>
                      <Text style={[styles.orderDate, { color: theme === 'dark' ? '#999' : '#718096' }]}>{formatDate(order.created_at)}</Text>
                      <Text style={styles.orderPrice}>${order.sale_price.toFixed(2)}</Text>
                    </View>
                  </View>

                  {/* Price Breakdown */}
                  <View style={[styles.priceBreakdown, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Sale Price</Text>
                      <Text style={[styles.priceValue, { color: colors.textPrimary }]}>${order.sale_price.toFixed(2)}</Text>
                    </View>
                    {order.bidgoat_commission != null && (
                      <View style={styles.priceRow}>
                        <Text style={styles.feeLabel}>BidGoat Fee (8%)</Text>
                        <Text style={styles.feeValue}>-${order.bidgoat_commission.toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]} />
                    {order.seller_payout != null && (
                      <View style={styles.priceRow}>
                        <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Your Payout</Text>
                        <Text style={styles.totalValue}>${order.seller_payout.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Shipping Address */}
                  <View style={[styles.addressSection, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
                    <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>📍 Ship To:</Text>
                    <Text style={[styles.addressText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>{order.buyer.name}</Text>
                    <Text style={[styles.addressText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>{order.shipping_address.address}</Text>
                    <Text style={[styles.addressText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                    </Text>
                    <Text style={[styles.addressText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>{order.shipping_address.country}</Text>
                  </View>

                  {/* Ship Button */}
                  <TouchableOpacity
                    style={styles.shipButton}
                    onPress={() => openShipModal(order)}
                  >
                    <Ionicons name="rocket" size={20} color="#fff" />
                    <Text style={styles.shipButtonText}>Mark as Shipped</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Shipped Orders Section */}
        {shippedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📦 Shipped Orders</Text>
            {shippedOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
                <View style={styles.orderHeader}>
                  <Image source={{ uri: order.photo_url }} style={styles.itemImage} />
                  <View style={styles.orderInfo}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {order.item_name}
                    </Text>
                    <Text style={[styles.orderDate, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                      Shipped {order.shipped_at ? formatDate(order.shipped_at) : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                  </View>
                </View>

                {order.tracking_number && (
                  <View style={styles.trackingSection}>
                    <Ionicons name="location" size={16} color="#4299E1" />
                    <Text style={styles.trackingText}>
                      {order.carrier}: {order.tracking_number}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={theme === 'dark' ? '#555' : '#CBD5E0'} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No orders yet</Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#718096' }]}>Orders will appear here when buyers purchase your items</Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Ship Modal */}
      <Modal
        visible={shipModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Mark as Shipped</Text>
              <TouchableOpacity onPress={() => setShipModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme === 'dark' ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Item Image */}
              {selectedOrder?.photo_url && (
                <Image
                  source={{ uri: selectedOrder.photo_url }}
                  style={styles.modalItemImage}
                />
              )}

              <Text style={[styles.modalItemName, { color: theme === 'dark' ? '#999' : '#4A5568' }]}>{selectedOrder?.item_name}</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Carrier</Text>
                <View style={styles.carrierButtons}>
                  {['USPS', 'UPS', 'FedEx', 'DHL'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.carrierButton, carrier === c && styles.carrierButtonActive]}
                      onPress={() => setCarrier(c)}
                    >
                      <Text style={[styles.carrierButtonText, carrier === c && styles.carrierButtonTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Tracking Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  placeholder="Enter tracking number"
                  placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={[styles.confirmButton, shipping && styles.confirmButtonDisabled]}
                onPress={handleMarkShipped}
                disabled={shipping}
              >
                {shipping ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Shipment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Celebration Modal */}
      {celebrationOrder && (
        <SalesCelebrationModal
          visible={celebrationVisible}
          onClose={() => setCelebrationVisible(false)}
          itemName={celebrationOrder.item_name}
          salePrice={celebrationOrder.sale_price}
          buyerUsername={celebrationOrder.buyer.name}
          sellerPayout={celebrationOrder.seller_payout || celebrationOrder.sale_price * 0.92}
          bidgoatFee={celebrationOrder.bidgoat_commission || celebrationOrder.sale_price * 0.08}
          orderId={celebrationOrder.id}
          itemId={celebrationOrder.item_id}
          premiumShipping={
            celebrationOrder.premium_shipping_hours
              ? {
                  hours: celebrationOrder.premium_shipping_hours,
                  emoji: celebrationOrder.premium_shipping_hours === 6 ? '🚀' :
                         celebrationOrder.premium_shipping_hours === 12 ? '⚡' :
                         celebrationOrder.premium_shipping_hours === 24 ? '💨' : '📦',
                  name: celebrationOrder.premium_shipping_hours === 6 ? '6-Hour Rush' :
                        celebrationOrder.premium_shipping_hours === 12 ? '12-Hour Rush' :
                        celebrationOrder.premium_shipping_hours === 24 ? '24-Hour Express' : '48-Hour Priority',
                }
              : undefined
          }
        />
      )}

      <GlobalFooter/>
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
    backgroundColor: '#F7FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 48,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor:'#F7FAFC',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#718096',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#F6AD55',
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 60,
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
  orderDate: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#48BB78',
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
  feeLabel: {
    fontSize: 14,
    color: '#E53E3E',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53E3E',
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
  addressSection: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  shipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  shipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  trackingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  trackingText: {
    fontSize: 14,
    color: '#2C5282',
    fontWeight: '600',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalItemImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  carrierButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  carrierButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  carrierButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F0',
  },
  carrierButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  carrierButtonTextActive: {
    color: '#FF6B35',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  urgencyEmoji: {
    fontSize: 18,
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  premiumShippingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#805AD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
    gap: 4,
  },
  premiumShippingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  timeRemainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  timeRemainingLate: {
    backgroundColor: '#FED7D7',
  },
  timeRemainingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  timeRemainingTextLate: {
    color: '#E53E3E',
  },
});
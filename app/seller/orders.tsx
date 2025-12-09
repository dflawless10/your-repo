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

const API_URL = 'http://10.0.0.170:5000';

type Order = {
  id: number;
  item_id: number;
  item_name: string;
  photo_url: string;
  sale_price: number;
  shipping_cost: number;
  total_amount: number;
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
};

export default function SellerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);
  const [refreshing, setRefreshing] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('USPS');
  const [shipping, setShipping] = useState(false);

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
        Alert.alert('Success!', 'Order marked as shipped. Buyer has been notified.');
        setShipModalVisible(false);
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

  const pendingOrders = orders.filter(o => o.status === 'pending_shipment');
  const shippedOrders = orders.filter(o => o.status !== 'pending_shipment');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{
    paddingTop: HEADER_MAX_HEIGHT + 20, // 👈 this is the fix
    paddingBottom: 40,
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
        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Orders to Ship</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingOrders.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{shippedOrders.length}</Text>
            <Text style={styles.statLabel}>Shipped</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Action Required</Text>
            {pendingOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, styles.orderPending]}>
                <View style={styles.orderHeader}>
                  <Image source={{ uri: order.photo_url }} style={styles.itemImage} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {order.item_name}
                    </Text>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    <Text style={styles.orderPrice}>${order.sale_price.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Shipping Address */}
                <View style={styles.addressSection}>
                  <Text style={styles.addressTitle}>📍 Ship To:</Text>
                  <Text style={styles.addressText}>{order.buyer.name}</Text>
                  <Text style={styles.addressText}>{order.shipping_address.address}</Text>
                  <Text style={styles.addressText}>
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                  </Text>
                  <Text style={styles.addressText}>{order.shipping_address.country}</Text>
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
            ))}
          </View>
        )}

        {/* Shipped Orders Section */}
        {shippedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Shipped Orders</Text>
            {shippedOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={{ height: HEADER_MAX_HEIGHT, backgroundColor: 'red' }} />

                  <Image source={{ uri: order.photo_url }} style={styles.itemImage} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {order.item_name}
                    </Text>
                    <Text style={styles.orderDate}>
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
            <Ionicons name="cube-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Orders will appear here when buyers purchase your items</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark as Shipped</Text>
              <TouchableOpacity onPress={() => setShipModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
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

              <Text style={styles.modalItemName}>{selectedOrder?.item_name}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Carrier</Text>
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
                <Text style={styles.inputLabel}>Tracking Number</Text>
                <TextInput
                  style={styles.input}
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  placeholder="Enter tracking number"
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
    </>
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
    padding: 16,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#F7FAFC',
    position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: HEADER_MAX_HEIGHT,
  zIndex: 10,
},
  pageTitle: {
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
});
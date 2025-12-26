import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setCartItems, removeItem } from '@/utils/cartSlice';
import { calculateBuyerTotal, type BuyerTotalBreakdown } from '@/api/revenue';

function getUrgencyColor(hoursLeft: number): string {
  if (hoursLeft > 48) return 'green';
  if (hoursLeft > 12) return 'orange';
  return 'red';
}

export default function CartScreen() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const [loading, setLoading] = useState(false);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [costBreakdowns, setCostBreakdowns] = useState<Record<number, BuyerTotalBreakdown>>({});
  const [calculatingCosts, setCalculatingCosts] = useState(false);

  // Fetch cart from backend API
  const fetchCart = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setCartItems(data.items || []));
      }
    } catch (error) {
      console.error('🐐 Cart fetch error:', error);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  // Remove item from backend and refresh
  const handleRemoveItem = async (itemId: string | number) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/remove-from-cart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (response.ok) {
        console.log('🐐 Item removed from cart:', itemId);
        // Remove from Redux state immediately for instant UI update
        dispatch(removeItem(itemId));
        // Fetch fresh cart from backend to stay in sync
        await fetchCart();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('🐐 Remove cart item error:', error);
      Alert.alert('Error', 'Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  };

  // Calculate costs for all items when cart changes
  useEffect(() => {
    const fetchCostBreakdowns = async () => {
      if (cartItems.length === 0) {
        setCostBreakdowns({});
        return;
      }

      setCalculatingCosts(true);
      const breakdowns: Record<number, BuyerTotalBreakdown> = {};

      try {
        await Promise.all(
          cartItems.map(async (item) => {
            try {
              const itemId = Number(item.id);
              const response = await calculateBuyerTotal(itemId, includeInsurance);
              breakdowns[itemId] = response.breakdown;
            } catch (error) {
              console.error(`Failed to calculate costs for item ${item.id}:`, error);
            }
          })
        );

        setCostBreakdowns(breakdowns);
      } catch (error) {
        console.error('Error calculating cost breakdowns:', error);
      } finally {
        setCalculatingCosts(false);
      }
    };

    fetchCostBreakdowns();
  }, [cartItems, includeInsurance]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const totalShipping = useMemo(() => {
    return Object.values(costBreakdowns).reduce((sum, breakdown) => sum + breakdown.shipping_cost, 0);
  }, [costBreakdowns]);

  const totalInsurance = useMemo(() => {
    return Object.values(costBreakdowns).reduce((sum, breakdown) => sum + breakdown.insurance_cost, 0);
  }, [costBreakdowns]);

  const grandTotal = useMemo(() => {
    return Object.values(costBreakdowns).reduce((sum, breakdown) => sum + breakdown.total, 0);
  }, [costBreakdowns]);

  const renderRecommendations = (recs: any[]) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recoScroll}>
      {recs.map((rec) => (
        <TouchableOpacity
          key={rec.id}
          onPress={() => router.push(`/item/${rec.id}`)}
          style={styles.recoItem}
        >
          <Image source={{ uri: rec.photo_url }} style={styles.recoImage} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderItem = ({ item }: { item: any }) => {
    const hoursLeft = parseInt(item.timeLeft?.split('h')[0] ?? '0', 10);
    const urgencyColor = getUrgencyColor(hoursLeft);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => router.push(`/item/${item.id}`)}
          style={styles.itemContent}
        >
          <Image source={{ uri: item.photo_url }} style={styles.image} />
          <View style={styles.details}>
            <Text style={{ color: urgencyColor }}>⏳ Ends in: {item.timeLeft}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.price}</Text>
            {item.startingPrice && (
              <Text style={styles.meta}>🎯 Starting bid: ${item.startingPrice}</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleRemoveItem(item.id)}
          style={styles.iconButton}
          disabled={loading}
        >
          <Ionicons name="trash-outline" size={24} color={loading ? "#ccc" : "#e53e3e"} />
        </TouchableOpacity>

        {item.recommendations?.length > 0 && (
          <View style={styles.recommendation}>
            <Text style={styles.recoHeader}>🧿 You might also like:</Text>
            {renderRecommendations(item.recommendations)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <View style={styles.container}>
        <Text style={styles.header}>🛒 Your Shopping Cart</Text>
        {cartItems.length > 0 ? (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
            <View style={styles.summary}>
              <View style={styles.costBreakdown}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Subtotal:</Text>
                  <Text style={styles.costValue}>${subtotal.toFixed(2)}</Text>
                </View>

                {calculatingCosts ? (
                  <ActivityIndicator size="small" color="#6A0DAD" />
                ) : (
                  <>
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>Shipping:</Text>
                      <Text style={styles.costValue}>${totalShipping.toFixed(2)}</Text>
                    </View>

                    <View style={styles.insuranceRow}>
                      <View style={styles.insuranceToggle}>
                        <Text style={styles.costLabel}>Insurance:</Text>
                        <Switch
                          value={includeInsurance}
                          onValueChange={setIncludeInsurance}
                          trackColor={{ false: '#ccc', true: '#6A0DAD' }}
                          thumbColor={includeInsurance ? '#fff' : '#f4f3f4'}
                        />
                      </View>
                      <Text style={styles.costValue}>
                        {includeInsurance ? `$${totalInsurance.toFixed(2)}` : 'Not included'}
                      </Text>
                    </View>

                    <View style={[styles.costRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
                    </View>
                  </>
                )}
              </View>

              <Button
                title="Proceed to Checkout"
                onPress={() => router.push('/checkout')}
                color="#6A0DAD"
                disabled={calculatingCosts}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <Image
              source={require('@/assets/images/goat-cart.png')}
              style={styles.emptyCartImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              The goat awaits your next treasure
            </Text>
            <Button title="Explore Auctions" onPress={() => router.push('/explore')} />
          </View>
        )}
      </View>

      {/* Floating cart */}
      <View style={styles.floatingCart}>
        <TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={28} color="#6A0DAD" />
          <Text style={styles.cartBadge}>{cartItems.length}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  emptyWrap: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyCartImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  empty: { fontSize: 18, textAlign: 'center', marginBottom: 12 },
  card: { backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8, marginBottom: 16 },
  itemContent: { flexDirection: 'row' },
  image: { width: 80, height: 80, borderRadius: 6 },
  details: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 14, color: '#333', marginBottom: 4 },
  meta: { fontSize: 12, color: '#666' },
  iconButton: { padding: 8, alignSelf: 'flex-start' },
  recommendation: { marginTop: 8 },
  recoHeader: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  recoScroll: { flexDirection: 'row' },
  recoItem: { marginRight: 8 },
  recoImage: { width: 60, height: 60, borderRadius: 6 },
  summary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  costBreakdown: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  insuranceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  insuranceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: { marginLeft: 6, fontSize: 14, fontWeight: 'bold', color: '#6A0DAD' },
  subtotal: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
});

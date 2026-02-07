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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setCartItems, removeItem } from '@/utils/cartSlice';
import { calculateBuyerTotal, type BuyerTotalBreakdown } from '@/api/revenue';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { useTheme } from '@/app/theme/ThemeContext';

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
  const scrollY = new Animated.Value(0);
  const { theme, colors } = useTheme();

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
        setCalculatingCosts(false);
        return;
      }

      setCalculatingCosts(true);
      const breakdowns: Record<number, BuyerTotalBreakdown> = {};

      try {
        // Add timeout to prevent infinite loading
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Cost calculation timeout')), 5000)
        );

        await Promise.race([
          Promise.all(
            cartItems.map(async (item) => {
              const itemId = Number(item.id);
              try {
                const response = await calculateBuyerTotal(itemId, includeInsurance);
                breakdowns[itemId] = response.breakdown;
              } catch (error) {
                console.error(`Failed to calculate costs for item ${item.id}:`, error);
                // Use fallback costs if API fails
                breakdowns[itemId] = {
                  item_price: item.price,
                  shipping_cost: 15,
                  insurance_cost: includeInsurance ? item.price * 0.02 : 0,
                  total: item.price + 15 + (includeInsurance ? item.price * 0.02 : 0),
                  weight_lbs: 1,
                  insurance_included: includeInsurance,
                };
              }
            })
          ),
          timeout
        ]);

        setCostBreakdowns(breakdowns);
      } catch (error) {
        console.error('Error calculating cost breakdowns:', error);
        // Use fallback costs for all items
        cartItems.forEach(item => {
          const itemId = Number(item.id);
          breakdowns[itemId] = {
            item_price: item.price,
            shipping_cost: 15,
            insurance_cost: includeInsurance ? item.price * 0.02 : 0,
            total: item.price + 15 + (includeInsurance ? item.price * 0.02 : 0),
            weight_lbs: 1,
            insurance_included: includeInsurance,
          };
        });
        setCostBreakdowns(breakdowns);
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
    const hoursLeft = Number.parseInt(item.timeLeft?.split('h')[0] ?? '0', 10);
    const urgencyColor = getUrgencyColor(hoursLeft);

    return (
      <View style={[styles.card, { marginHorizontal: 16, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => router.push(`/item/${item.id}`)}
          style={styles.itemContent}
        >
          <Image source={{ uri: item.photo_url }} style={styles.image} />
          <View style={styles.details}>
            <Text style={{ color: urgencyColor }}>⏳ Ends in: {item.timeLeft}</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.price, { color: colors.textPrimary }]}>${item.price}</Text>
            {item.startingPrice && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>🎯 Starting bid: ${item.startingPrice}</Text>
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
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={{ flex: 1, padding: 20 }}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 40 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {cartItems.length > 0 ? (
          <>
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Your Cart</Text>
              </View>
            </View>

            {cartItems.map((item) => (
              <React.Fragment key={String(item.id)}>
                {renderItem({ item })}
              </React.Fragment>
            ))}
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <View style={[styles.retroGoatContainer, {
              backgroundColor: theme === 'dark' ? '#2A1A40' : '#FFF5F7',
              borderColor: theme === 'dark' ? '#8B5CF6' : '#FF69B4',
            }]}>
              <Image
                source={require('@/assets/images/goat-cart.png')}
                defaultSource={require('@/assets/images/goat-cart.png')}
                style={{ width: 180, height: 180, resizeMode: 'contain' }}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your Cart is Empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              The goat awaits your next treasure 🐐💎
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore Auctions</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>

      {/* Fixed summary at bottom */}
      {cartItems.length > 0 && (
        <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: theme === 'dark' ? '#333' : '#ccc' }]}>
          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.textPrimary }]}>Subtotal:</Text>
              <Text style={[styles.costValue, { color: colors.textPrimary }]}>${subtotal.toFixed(2)}</Text>
            </View>

            {calculatingCosts ? (
              <ActivityIndicator size="small" color="#6A0DAD" />
            ) : (
              <>
                <View style={styles.costRow}>
                  <Text style={[styles.costLabel, { color: colors.textPrimary }]}>Shipping:</Text>
                  <Text style={[styles.costValue, { color: colors.textPrimary }]}>${totalShipping.toFixed(2)}</Text>
                </View>

                <View style={styles.insuranceRow}>
                  <View style={styles.insuranceToggle}>
                    <Text style={[styles.costLabel, { color: colors.textPrimary }]}>Insurance:</Text>
                    <Switch
                      value={includeInsurance}
                      onValueChange={setIncludeInsurance}
                      trackColor={{ false: '#ccc', true: '#6A0DAD' }}
                      thumbColor={includeInsurance ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                  <Text style={[styles.costValue, { color: colors.textPrimary }]}>
                    {includeInsurance ? `$${totalInsurance.toFixed(2)}` : 'Not included'}
                  </Text>
                </View>

                <View style={[styles.costRow, styles.totalRow]}>
                  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total:</Text>
                  <Text style={[styles.totalValue, { color: colors.textPrimary }]}>${grandTotal.toFixed(2)}</Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              { backgroundColor: calculatingCosts ? (theme === 'dark' ? '#444' : '#ccc') : (theme === 'dark' ? '#8B5CF6' : '#6A0DAD') }
            ]}
            onPress={() => router.push('/checkout')}
            disabled={calculatingCosts}
          >
            <Text style={styles.checkoutButtonText}>
              {calculatingCosts ? 'Calculating...' : 'Proceed to Checkout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, padding: 16 },
  pageTitle: { fontSize: 28, fontWeight: '700' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  emptyWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  retroGoatContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyCartImage: {
    width: 180,
    height: 180,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  exploreButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
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
  subtotal: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  checkoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  Animated, TouchableOpacity,
} from 'react-native';
import { useCartBackend } from 'hooks/usecartBackend';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import ConfettiCannon from 'react-native-confetti-cannon';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from './components/EnhancedHeader';
import GlobalFooter from './components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';
import { parseISO, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { calculateBuyerTotal, type BuyerTotalBreakdown } from '@/api/revenue';

// -------------------------------
// Safe date formatting
// -------------------------------
function safeFormat(dateString?: string, formatStr = 'PPP') {
  if (!dateString) return '—';
  try {
    const iso = dateString.includes('T')
      ? dateString
      : dateString.replace(' ', 'T') + 'Z';
    return format(parseISO(iso), formatStr);
  } catch {
    return '—';
  }
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { cartItems } = useCartBackend();

  // -------------------------------
  // State
  // -------------------------------
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [costBreakdowns, setCostBreakdowns] = useState<Record<number, BuyerTotalBreakdown>>({});
  const [calculatingCosts, setCalculatingCosts] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const cardNumberRef = useRef<TextInput>(null);
  const expRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  const reduxUser = useAppSelector((s) => s.user.profile);
  const { email, username, address: paramAddress } = useLocalSearchParams();

  // -------------------------------
  // Derived values
  // -------------------------------
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

  const formattedTotal = useMemo(() => grandTotal.toFixed(2), [grandTotal]);

  const fallbackUser =
    email && username
      ? {
          id: null, // null instead of 0 to avoid backend confusion
          email,
          username,
          address: typeof paramAddress === 'string' ? paramAddress : '',
        }
      : null;

  const effectiveUser = userProfile ?? fallbackUser;

  // -------------------------------
  // Load user profile
  // -------------------------------

    const loadUser = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    const res = await fetch(`${API_BASE_URL}/api/user-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setUserProfile(data);
    }
  } catch (err) {
    console.error('Error loading user profile:', err);
  } finally {
    setLoading(false);
  }
};


    useEffect(() => {
  if (reduxUser) {
    setUserProfile(reduxUser);
    setLoading(false);
  } else {
    loadUser();
  }
}, [reduxUser]);

  // Calculate cost breakdowns for all cart items
  useEffect(() => {
    if (cartItems.length === 0) return;

    const fetchCostBreakdowns = async () => {
      setCalculatingCosts(true);
      const breakdowns: Record<number, BuyerTotalBreakdown> = {};

      try {
        await Promise.all(
          cartItems.map(async (item) => {
            const itemId = Number(item.id);
            try {
              const response = await calculateBuyerTotal(itemId, includeInsurance);
              breakdowns[itemId] = response.breakdown;
            } catch (error) {
              console.error(`Error calculating cost for item ${itemId}:`, error);
              // Fallback breakdown
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
        );
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


  // -------------------------------
  // Initialize address ONCE from params
  // -------------------------------
  useEffect(() => {
    if (paramAddress && typeof paramAddress === 'string') {
      setAddress(paramAddress);
    }
  }, [paramAddress]);

  // -------------------------------
  // Guest detection
  // -------------------------------
  useEffect(() => {
    setIsGuest(!userProfile && !!email && !!username);
  }, [userProfile, email, username]);

  // -------------------------------
  // Checkout handler
  // -------------------------------
  const handlePlaceOrder = async () => {
    if (!address || !cardNumber || !exp || !cvv) {
      Alert.alert('Missing Info', 'Please fill out all fields before placing your order.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      if (!token) {
        Alert.alert('Error', 'Please sign in to complete checkout');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipping_address: address,
          payment_method: 'card',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        Alert.alert('Checkout Failed', err.error || 'Unable to complete checkout');
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('Checkout success:', result);

      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      const qrPayload = isGuest
        ? { guest: true, timestamp: new Date().toISOString() }
        : {
            userId: effectiveUser?.id,
            username: effectiveUser?.username,
            email: effectiveUser?.email,
            timestamp: new Date().toISOString(),
          };

      router.push({
        pathname: '/order-confirmation',
        params: {
          items: JSON.stringify(cartItems),
          total: formattedTotal,
          address,
          deliveryDate: 'Oct 26–Nov 2',
          qrPayload: JSON.stringify(qrPayload),
        },
      });
    } catch (err) {
      console.error('Checkout error:', err);
      Alert.alert('Error', 'Failed to complete checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Loading state
  // -------------------------------
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <EnhancedHeader scrollY={scrollY} />
        <Text style={{ color: colors.textPrimary, marginTop: HEADER_MAX_HEIGHT + 20 }}>
          Loading…
        </Text>
      </View>
    );
  }

  // -------------------------------
  // No user
  // -------------------------------
  if (!effectiveUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <EnhancedHeader scrollY={scrollY} />
        <Text style={{ color: colors.textPrimary, marginTop: HEADER_MAX_HEIGHT + 20 }}>
          Please sign in to check out or continue as guest.
        </Text>
      </View>
    );
  }

  // -------------------------------
  // Main UI
  // -------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <KeyboardAwareScrollView
  enableOnAndroid
  extraScrollHeight={80}
  extraHeight={120}
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={{
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  }}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  )}
  scrollEventThrottle={16}
>

        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingHorizontal: 20, paddingBottom: 20 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page Title with Back Arrow */}
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Checkout</Text>
              </View>


        {cartItems.map((item) => (
          <View
            key={String(item.id)}
            style={[
              styles.item,
              { borderColor: theme === 'dark' ? '#333' : '#eee' },
            ]}
          >
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            <Text style={{ color: colors.textPrimary }}>
              ${item.price.toFixed(2)}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              Listed: {safeFormat(item.listedAt || item.listed_at || item.registration_time)}
            </Text>
          </View>
        ))}

        {showCelebration && (
          <ConfettiCannon count={80} origin={{ x: 0, y: 0 }} fadeOut />
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>
              Order Summary
            </Text>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Subtotal
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                ${calculatingCosts ? '...' : subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Shipping
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                ${calculatingCosts ? '...' : totalShipping.toFixed(2)}
              </Text>
            </View>

            {totalInsurance > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                  Insurance
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                  ${totalInsurance.toFixed(2)}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.divider,
                { backgroundColor: theme === 'dark' ? '#333' : '#ddd' },
              ]}
            />

            <View style={styles.breakdownRow}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
                ${calculatingCosts ? '...' : formattedTotal}
              </Text>
            </View>
          </View>

          {/* Address */}
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            Shipping Address
          </Text>
          <TextInput
            placeholder="Enter your shipping address"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: theme === 'dark' ? '#444' : '#ccc',
              },
            ]}
            multiline
            numberOfLines={3}
            textContentType="fullStreetAddress"
            autoCapitalize="words"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => cardNumberRef.current?.focus()}
          />

          {/* Payment */}
          <View style={styles.paymentHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
              Payment Information
            </Text>
            <View style={styles.stripeBadge}>
              <Text style={styles.stripeBadgeText}>Powered by Stripe</Text>
            </View>
          </View>

          <TextInput
            ref={cardNumberRef}
            placeholder="Card Number"
            placeholderTextColor={colors.textSecondary}
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="number-pad"
            textContentType="creditCardNumber"
            maxLength={19}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => expRef.current?.focus()}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: theme === 'dark' ? '#444' : '#ccc',
              },
            ]}
          />

          <View style={styles.cardDetailsRow}>
            <TextInput
              ref={expRef}
              placeholder="MM/YY"
              placeholderTextColor={colors.textSecondary}
              value={exp}
              onChangeText={setExp}
              keyboardType="number-pad"
              maxLength={5}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => cvvRef.current?.focus()}
              style={[
                styles.input,
                styles.halfInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: theme === 'dark' ? '#444' : '#ccc',
                },
              ]}
            />
            <TextInput
              ref={cvvRef}
              placeholder="CVV"
              placeholderTextColor={colors.textSecondary}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handlePlaceOrder}
              style={[
                styles.input,
                styles.halfInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: theme === 'dark' ? '#444' : '#ccc',
                },
              ]}
            />
          </View>

          <View style={styles.secureRow}>
            <Text style={styles.secureIcon}>🔒</Text>
            <Text style={[styles.secureText, { color: colors.textSecondary }]}>
              Secure 256-bit encrypted payment
            </Text>
          </View>

          <Button title="Place Order" onPress={handlePlaceOrder} color="#6A0DAD" />
        </View>
        </Animated.ScrollView>
      </KeyboardAwareScrollView>

      <GlobalFooter />
    </View>
  );
}

// -------------------------------
// Styles
// -------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  pageTitle: { fontSize: 28, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  item: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: '600' },
  summary: { marginTop: 20 },
  breakdownCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  breakdownTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: { fontSize: 14 },
  breakdownValue: { fontSize: 14, fontWeight: '600' },
  breakdownNote: { fontSize: 14, fontStyle: 'italic' },
  divider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  sectionLabel: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stripeBadge: {
    backgroundColor: '#635BFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stripeBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  cardDetailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  secureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  secureIcon: { fontSize: 18, marginRight: 6 },
  secureText: { fontSize: 14 },
});

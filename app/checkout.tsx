import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Pressable,
  Image,
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
// Stripe SDK removed - using backend escrow system instead

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
  console.log('🎯 CheckoutScreen: Component rendering');
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { cartItems } = useCartBackend();

  console.log('🎯 CheckoutScreen: Cart items:', cartItems?.length || 0);

  // -------------------------------
  // State
  // -------------------------------
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [costBreakdowns, setCostBreakdowns] = useState<Record<string | number, BuyerTotalBreakdown>>({});
  const [calculatingCosts, setCalculatingCosts] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [confirmedOwnItems, setConfirmedOwnItems] = useState<Set<number>>(new Set());

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const reduxUser = useAppSelector((s) => s.user.profile);
  const { email, username, address: paramAddress, includeInsurance: insuranceParam } = useLocalSearchParams();

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

  // US States list
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Countries list
  const COUNTRIES = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland',
    'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland',
    'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Mexico'
  ];

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

  // Initialize insurance from cart
  useEffect(() => {
    if (insuranceParam === '1') {
      setIncludeInsurance(true);
    }
  }, [insuranceParam]);

  // Fade in and pulsate animation
  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulsate loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      setStreetAddress(paramAddress);
    }
  }, [paramAddress]);

  // -------------------------------
  // Guest detection
  // -------------------------------
  useEffect(() => {
    setIsGuest(!userProfile && !!email && !!username);
  }, [userProfile, email, username]);

  // -------------------------------
  // Checkout handler with Escrow System
  // -------------------------------
  const handlePlaceOrder = async () => {
    if (!streetAddress || !city || !state || !zipCode || !country) {
      Alert.alert('Missing Info', 'Please complete all address fields.');
      return;
    }

    const fullAddress = `${streetAddress}, ${city}, ${state} ${zipCode}, ${country}`;

    try {
      setProcessing(true);
      const token = await AsyncStorage.getItem('jwtToken');

      if (!token) {
        Alert.alert('Error', 'Please sign in to complete checkout');
        setProcessing(false);
        return;
      }

      // Process each item in cart with escrow system
      const orderIds = [];

      for (const item of cartItems) {
        const itemId = Number(item.id);
        const breakdown = costBreakdowns[itemId];

        if (!breakdown) {
          console.error(`No cost breakdown for item ${itemId}`);
          continue;
        }

        // Create escrow payment - money held until delivery confirmed
        const escrowResponse = await fetch(`${API_BASE_URL}/api/stripe-connect/payment/create-escrow`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_id: itemId,
            amount: Math.round(breakdown.total * 100), // Convert to cents
            include_insurance: includeInsurance,
            shipping_address: fullAddress,
            confirm_buy_own_item: confirmedOwnItems.has(itemId), // Include confirmation if already confirmed
          }),
        });

        const escrowResult = await escrowResponse.json();

        // Handle confirmation requirement (seller buying own item)
        if (escrowResult.requires_confirmation) {
          setProcessing(false);
          Alert.alert(
            escrowResult.message || 'Confirmation Required',
            `${escrowResult.details}\n\nItem: ${escrowResult.item_name}\nPrice: $${escrowResult.sale_price}`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, Buy It Back',
                style: 'destructive',
                onPress: () => {
                  // Mark this item as confirmed and retry
                  setConfirmedOwnItems(prev => new Set(prev).add(itemId));
                  setTimeout(() => handlePlaceOrder(), 100); // Small delay to ensure state update
                },
              },
            ]
          );
          return;
        }

        if (!escrowResponse.ok) {
          Alert.alert('Payment Failed', escrowResult.error || 'Unable to process payment');
          setProcessing(false);
          return;
        }

        const { order_id, payment_intent_id, escrow_id } = escrowResult;
        orderIds.push(order_id);

        console.log('✅ Escrow payment created:', { order_id, payment_intent_id, escrow_id });
      }

      // All payments successful - held in escrow
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

      // Calculate delivery date based on processing time (7-10 business days)
      const deliveryStart = new Date();
      deliveryStart.setDate(deliveryStart.getDate() + 7);
      const deliveryEnd = new Date();
      deliveryEnd.setDate(deliveryEnd.getDate() + 10);
      const estimatedDelivery = `${format(deliveryStart, 'MMM d')}–${format(deliveryEnd, 'MMM d')}`;

      // Get buyer full name
      const buyerFullName = effectiveUser?.firstname && effectiveUser?.lastname
        ? `${effectiveUser.firstname.trim()} ${effectiveUser.lastname.trim()}`
        : effectiveUser?.username || 'Guest';

      router.push({
        pathname: '/order-confirmation',
        params: {
          items: JSON.stringify(cartItems),
          total: formattedTotal,
          address: fullAddress,
          buyerName: buyerFullName,
          deliveryDate: estimatedDelivery,
          qrPayload: JSON.stringify(qrPayload),
          orderIds: JSON.stringify(orderIds),
        },
      });
    } catch (err) {
      console.error('Checkout error:', err);
      Alert.alert('Error', 'Failed to complete checkout. Please try again.');
    } finally {
      setProcessing(false);
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
    paddingTop: HEADER_MAX_HEIGHT + 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  }}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  )}
  scrollEventThrottle={16}
>
  {/* Page Title with Back Arrow - scrolls with content */}
  <Animated.View style={{
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    opacity: fadeAnim,
    transform: [{ scale: pulseAnim }]
  }}>
    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
      <Ionicons name="arrow-back" size={28} color="#6A0DAD" />
    </TouchableOpacity>
    <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Checkout</Text>
  </Animated.View>

  {cartItems.map((item) => {
        const breakdown = costBreakdowns[item.id];
        return (
          <View
            key={String(item.id)}
            style={[
              styles.item,
              {
                borderColor: theme === 'dark' ? '#333' : '#E5E5E5',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {/* Item Image with Verified Badge */}
              <View style={{ position: 'relative' }}>
                {item.photo_url && (
                  <Image
                    source={{ uri: item.photo_url }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5',
                      borderWidth: 1,
                      borderColor: theme === 'dark' ? '#444' : '#E0E0E0',
                    }}
                    resizeMode="cover"
                  />
                )}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -6,
                    right: -6,
                    backgroundColor: '#10B981',
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.surface,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                </View>
              </View>

              {/* Item Details */}
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: '600',
                      lineHeight: 20,
                      marginBottom: 4,
                    }}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>

                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: theme === 'dark' ? '#93C5FD' : '#1E40AF',
                        fontSize: 10,
                        fontWeight: '600',
                      }}
                    >
                      ✓ AUTHENTICATED
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                  <Text style={{ color: '#6A0DAD', fontSize: 20, fontWeight: '700' }}>
                    ${item.price.toFixed(2)}
                  </Text>
                  {item.quantity > 1 && (
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                      × {item.quantity}
                    </Text>
                  )}
                </View>

                {breakdown && (
                  <View
                    style={{
                      backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9FAFB',
                      padding: 8,
                      borderRadius: 8,
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>📦 Shipping</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                        ${breakdown.shipping_cost.toFixed(2)}
                      </Text>
                    </View>
                    {breakdown.insurance_included && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>🛡️ Buyer Protection</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                          ${breakdown.insurance_cost.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingTop: 4,
                        borderTopWidth: 1,
                        borderTopColor: theme === 'dark' ? '#2C2C2E' : '#E5E7EB',
                        marginTop: 2,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                        Item Total
                      </Text>
                      <Text style={{ color: '#6A0DAD', fontSize: 12, fontWeight: '700' }}>
                        ${breakdown.total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Seller Trust Signals */}
            <View
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: theme === 'dark' ? '#2C2C2E' : '#F3F4F6',
                gap: 6,
              }}
            >
              {/* Row 1: Listed date & Member since */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                  {(() => {
                    const dateStr = (item as any).listedAt || (item as any).listed_at || (item as any).registration_time;
                    return dateStr ? `Listed ${safeFormat(dateStr, 'MMM d, yyyy')}` : 'Recently Listed';
                  })()}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>•</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                  {(item as any).seller?.memberSince ? `Member since ${new Date((item as any).seller.memberSince).getFullYear()}` : 'New seller'}
                </Text>
              </View>

              {/* Row 2: Rating & Premium Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {(item as any).seller?.rating > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
                      {(item as any).seller.rating.toFixed(1)}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      ({(item as any).seller.reviewCount} reviews)
                    </Text>
                  </View>
                )}
                {(item as any).seller?.isPremium && (
                  <View style={{
                    backgroundColor: '#6A0DAD',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>
                      PREMIUM SELLER
                    </Text>
                  </View>
                )}
              </View>

              {/* Row 3: Shipping & Returns */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="cube-outline" size={12} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    Ships in {(item as any).seller?.processingTimeDays || 1}-{((item as any).seller?.processingTimeDays || 1) + 1} days
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>•</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="return-down-back-outline" size={12} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {(item as any).seller?.returnPolicyDays || 30}-day returns
                  </Text>
                </View>
              </View>

              {/* Row 4: BidGoat Protected */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '600' }}>
                  BidGoat Protected
                </Text>
              </View>
            </View>
          </View>
        );
      })}

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
                Buyer Protection Guarantee
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
        <Text style={[styles.sectionLabel, { color: '#6A0DAD', fontWeight: '600' }]}>
          📍 Shipping Address
        </Text>

        <TextInput
          placeholder="Street Address"
          placeholderTextColor={colors.textSecondary}
          value={streetAddress}
          onChangeText={setStreetAddress}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: streetAddress ? '#6A0DAD' : (theme === 'dark' ? '#444' : '#ccc'),
              borderWidth: 2,
              marginBottom: 12,
            },
          ]}
          textContentType="streetAddressLine1"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <TextInput
          placeholder="City"
          placeholderTextColor={colors.textSecondary}
          value={city}
          onChangeText={setCity}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: city ? '#6A0DAD' : (theme === 'dark' ? '#444' : '#ccc'),
              borderWidth: 2,
              marginBottom: 12,
            },
          ]}
          textContentType="addressCity"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setShowStateModal(true)}
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: colors.surface,
                borderColor: state ? '#6A0DAD' : (theme === 'dark' ? '#444' : '#ccc'),
                borderWidth: 2,
                marginBottom: 0,
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ color: state ? colors.textPrimary : colors.textSecondary }}>
              {state || 'State'}
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder="ZIP Code"
            placeholderTextColor={colors.textSecondary}
            value={zipCode}
            onChangeText={setZipCode}
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: zipCode ? '#6A0DAD' : (theme === 'dark' ? '#444' : '#ccc'),
                borderWidth: 2,
                marginBottom: 0,
              },
            ]}
            textContentType="postalCode"
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="next"
          />
        </View>

        <TouchableOpacity
          onPress={() => setShowCountryModal(true)}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: country ? '#6A0DAD' : (theme === 'dark' ? '#444' : '#ccc'),
              borderWidth: 2,
              marginBottom: 12,
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ color: country ? colors.textPrimary : colors.textSecondary }}>
            {country || 'Country'}
          </Text>
        </TouchableOpacity>

        {/* State Picker Modal */}
        <Modal visible={showStateModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '70%'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: theme === 'dark' ? '#333' : '#eee'
              }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>
                  Select State
                </Text>
                <TouchableOpacity onPress={() => setShowStateModal(false)}>
                  <Ionicons name="close" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {US_STATES.map((st) => (
                  <Pressable
                    key={st}
                    onPress={() => {
                      setState(st);
                      setShowStateModal(false);
                    }}
                    style={({ pressed }) => ({
                      padding: 16,
                      backgroundColor: pressed ? (theme === 'dark' ? '#333' : '#f0f0f0') : 'transparent',
                      borderBottomWidth: 1,
                      borderBottomColor: theme === 'dark' ? '#222' : '#eee'
                    })}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: state === st ? '#6A0DAD' : colors.textPrimary,
                      fontWeight: state === st ? '600' : '400'
                    }}>
                      {st}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Country Picker Modal */}
        <Modal visible={showCountryModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '70%'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: theme === 'dark' ? '#333' : '#eee'
              }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>
                  Select Country
                </Text>
                <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                  <Ionicons name="close" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {COUNTRIES.map((ctry) => (
                  <Pressable
                    key={ctry}
                    onPress={() => {
                      setCountry(ctry);
                      setShowCountryModal(false);
                    }}
                    style={({ pressed }) => ({
                      padding: 16,
                      backgroundColor: pressed ? (theme === 'dark' ? '#333' : '#f0f0f0') : 'transparent',
                      borderBottomWidth: 1,
                      borderBottomColor: theme === 'dark' ? '#222' : '#eee'
                    })}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: country === ctry ? '#6A0DAD' : colors.textPrimary,
                      fontWeight: country === ctry ? '600' : '400'
                    }}>
                      {ctry}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Payment */}
        <View style={styles.paymentHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            Payment Information
          </Text>
          <View style={styles.stripeBadge}>
            <Text style={styles.stripeBadgeText}>Secured by Stripe</Text>
          </View>
        </View>

        <View style={[styles.paymentInfoBox, { backgroundColor: colors.surface, borderColor: theme === 'dark' ? '#444' : '#ccc' }]}>
          <Ionicons name="card-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.paymentInfoText, { color: colors.textPrimary }]}>
            Payment via Stripe Connect
          </Text>
          <Text style={[styles.paymentInfoSubtext, { color: colors.textSecondary }]}>
            Funds held in escrow until delivery confirmed
          </Text>
        </View>

        <View style={styles.secureRow}>
          <Text style={styles.secureIcon}>🔒</Text>
          <Text style={[styles.secureText, { color: colors.textSecondary }]}>
            Secure escrow protection · Money released only after delivery
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            { backgroundColor: processing ? '#999' : '#6A0DAD' }
          ]}
          onPress={handlePlaceOrder}
          disabled={processing || calculatingCosts}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              Place Order · ${formattedTotal}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  pageTitle: { fontSize: 22, fontWeight: '700' },
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
  paymentInfoBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 12,
  },
  paymentInfoText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  paymentInfoSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  secureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  secureIcon: { fontSize: 18, marginRight: 6 },
  secureText: { fontSize: 14 },
  placeOrderButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

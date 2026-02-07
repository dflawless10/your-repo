import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ReceiptView from "@/components/ReceiptView";
import { useCartBackend } from 'hooks/usecartBackend';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from './components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';


// types/items.ts
export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  photo_url: string;   // required for UI
  startingPrice?: number;
}


function OrderConfirmationScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = new Animated.Value(0);
  const params = useLocalSearchParams();

  // Get items and total from params (passed from checkout)
  const passedItems = params.items ? JSON.parse(params.items as string) : [];
  const passedTotal = params.total ? parseFloat(params.total as string) : 0;
  const passedAddress = params.address ? params.address as string : '123 Pearl Street, Burr Ridge, IL';
  const passedDeliveryDate = params.deliveryDate ? params.deliveryDate as string : format(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), 'PPP');

  // Use passed data from checkout instead of cartItems which may be cleared
  const cartItems = passedItems;
  const total = passedTotal;
  const address = passedAddress;
  const deliveryDate = passedDeliveryDate;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 100 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Success Banner */}
        <View style={[styles.successBanner, { backgroundColor: theme === 'dark' ? '#1A3D2E' : '#F0FFF4' }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#2D5A3F' : '#9AE6B4' }]}>
            <Ionicons name="checkmark-circle" size={48} color={theme === 'dark' ? '#7FD6A8' : '#22543D'} />
          </View>
          <Text style={[styles.title, { color: theme === 'dark' ? '#7FD6A8' : '#22543D' }]}>Order Confirmed!</Text>
          <Text style={[styles.subtitle, { color: theme === 'dark' ? '#A8D5BA' : '#2F855A' }]}>
            Thank you for shopping with BidGoat 🐐💍
          </Text>
        </View>

        {/* Order Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Order Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.detailText, { color: colors.textPrimary }]}>Order Total: ${total.toFixed(2)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.detailText, { color: colors.textPrimary }]}>Estimated Delivery: {deliveryDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.detailText, { color: colors.textPrimary }]}>Shipping To: {address}</Text>
          </View>
        </View>

        {/* Receipt */}
        <ReceiptView
          items={cartItems}
          address={address}
          total={total}
          deliveryDate={deliveryDate}
        />

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/orders')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6A0DAD', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="receipt-outline" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>View My Orders</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' }]}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="home-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.secondaryButtonText, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      <GlobalFooter />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successBanner: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

 export default OrderConfirmationScreen;
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/theme/ThemeContext';
import { Order } from '@/app/orders';

export type ShippingTier = 'standard' | 'expedited' | 'overnight';

interface ShippingOption {
  id: ShippingTier;
  emoji: string;
  label: string;
  description: string;
  price: number;
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: 'standard',  emoji: '📦', label: 'Standard',          description: '3-5 business days',         price: 0     },
  { id: 'expedited', emoji: '💨', label: '48-Hour Priority',  description: '2 business days guaranteed', price: 14.99 },
  { id: 'overnight', emoji: '🚀', label: '24-Hour Express',   description: '1 business day guaranteed',  price: 24.99 },
];

const INSURANCE_PRICE = 4.99;

interface PrePaymentModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onProceed: (insurance: boolean, shipping: ShippingTier) => void;
}

export default function PrePaymentModal({ visible, order, onClose, onProceed }: Readonly<PrePaymentModalProps>) {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const [selectedShipping, setSelectedShipping] = useState<ShippingTier>('standard');
  const [includeInsurance, setIncludeInsurance] = useState(false);

  if (!order) return null;

  const shippingUpgrade = SHIPPING_OPTIONS.find(o => o.id === selectedShipping)?.price ?? 0;
  const insuranceCost = includeInsurance ? INSURANCE_PRICE : 0;
  const estimatedTotal = order.sale_price + order.shipping_cost + shippingUpgrade + insuranceCost;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: isDark ? '#555' : '#DDD' }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#E2E8F0' }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Complete Your Purchase</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Order summary */}
            <View style={[styles.orderCard, { backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB' }]}>
              {order.photo_url ? (
                <Image source={{ uri: order.photo_url }} style={styles.itemPhoto} contentFit="cover" />
              ) : (
                <View style={[styles.itemPhoto, styles.photoPlaceholder, { backgroundColor: isDark ? '#333' : '#E2E8F0' }]}>
                  <Ionicons name="image-outline" size={28} color="#999" />
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                  {order.item_name}
                </Text>
                <Text style={[styles.sellerName, { color: isDark ? '#999' : '#666' }]}>
                  Seller: @{order.seller_username}
                </Text>
                <Text style={[styles.basePrice, { color: isDark ? '#B794F4' : '#6A0DAD' }]}>
                  ${order.sale_price.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Shipping speed */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Speed</Text>
            {SHIPPING_OPTIONS.map((option) => {
              const selected = selectedShipping === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.shippingOption,
                    { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#333' : '#E2E8F0' },
                    selected && { borderColor: isDark ? '#8B5CF6' : '#6A0DAD', backgroundColor: isDark ? '#2D2040' : '#F5F0FF' },
                  ]}
                  onPress={() => setSelectedShipping(option.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.shippingEmoji}>{option.emoji}</Text>
                  <View style={styles.shippingInfo}>
                    <Text style={[styles.shippingLabel, { color: colors.textPrimary }]}>{option.label}</Text>
                    <Text style={[styles.shippingDesc, { color: isDark ? '#999' : '#666' }]}>{option.description}</Text>
                  </View>
                  <Text style={[
                    styles.shippingPrice,
                    { color: option.price === 0 ? (isDark ? '#48BB78' : '#38A169') : (isDark ? '#B794F4' : '#6A0DAD') },
                  ]}>
                    {option.price === 0 ? 'FREE' : `+$${option.price.toFixed(2)}`}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={isDark ? '#8B5CF6' : '#6A0DAD'} style={styles.checkmark} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Insurance */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Purchase Protection</Text>
            <View style={[
              styles.insuranceRow,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: includeInsurance ? (isDark ? '#8B5CF6' : '#6A0DAD') : (isDark ? '#333' : '#E2E8F0') },
            ]}>
              <Ionicons
                name="shield-checkmark"
                size={30}
                color={includeInsurance ? (isDark ? '#8B5CF6' : '#6A0DAD') : '#999'}
              />
              <View style={styles.insuranceInfo}>
                <Text style={[styles.insuranceLabel, { color: colors.textPrimary }]}>Shipping Insurance</Text>
                <Text style={[styles.insuranceDesc, { color: isDark ? '#999' : '#666' }]}>
                  Coverage up to $500 if lost or damaged
                </Text>
                <Text style={[styles.insurancePrice, { color: isDark ? '#B794F4' : '#6A0DAD' }]}>
                  +${INSURANCE_PRICE.toFixed(2)}
                </Text>
              </View>
              <Switch
                value={includeInsurance}
                onValueChange={setIncludeInsurance}
                trackColor={{ false: isDark ? '#555' : '#E2E8F0', true: isDark ? '#6D28D9' : '#6A0DAD' }}
                thumbColor="#FFF"
              />
            </View>

            {/* Estimated total */}
            <View style={[styles.totalBox, { backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB', borderColor: isDark ? '#333' : '#E2E8F0' }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalRowLabel, { color: isDark ? '#999' : '#666' }]}>Item price</Text>
                <Text style={[styles.totalRowValue, { color: colors.textPrimary }]}>${order.sale_price.toFixed(2)}</Text>
              </View>
              {order.shipping_cost > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalRowLabel, { color: isDark ? '#999' : '#666' }]}>Base shipping</Text>
                  <Text style={[styles.totalRowValue, { color: colors.textPrimary }]}>${order.shipping_cost.toFixed(2)}</Text>
                </View>
              )}
              {shippingUpgrade > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalRowLabel, { color: isDark ? '#999' : '#666' }]}>Shipping upgrade</Text>
                  <Text style={[styles.totalRowValue, { color: isDark ? '#B794F4' : '#6A0DAD' }]}>
                    +${shippingUpgrade.toFixed(2)}
                  </Text>
                </View>
              )}
              {includeInsurance && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalRowLabel, { color: isDark ? '#999' : '#666' }]}>Insurance</Text>
                  <Text style={[styles.totalRowValue, { color: isDark ? '#B794F4' : '#6A0DAD' }]}>
                    +${INSURANCE_PRICE.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#E2E8F0' }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalFinalLabel, { color: colors.textPrimary }]}>Estimated Total</Text>
                <Text style={[styles.totalFinalValue, { color: isDark ? '#B794F4' : '#6A0DAD' }]}>
                  ${estimatedTotal.toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.totalNote, { color: isDark ? '#666' : '#999' }]}>
                Final amount confirmed before payment
              </Text>
            </View>
          </ScrollView>

          {/* CTA */}
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: isDark ? '#333' : '#E2E8F0' }]}>
            <TouchableOpacity
              onPress={() => onProceed(includeInsurance, selectedShipping)}
              style={styles.proceedButton}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#6A0DAD', '#9D50BB']} style={styles.proceedGradient}>
                <Ionicons name="lock-closed" size={18} color="#FFF" />
                <Text style={styles.proceedText}>Proceed to Payment</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 8,
  },
  orderCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  itemPhoto: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 12,
    marginBottom: 6,
  },
  basePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  shippingEmoji: {
    fontSize: 22,
  },
  shippingInfo: {
    flex: 1,
  },
  shippingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  shippingDesc: {
    fontSize: 12,
  },
  shippingPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  checkmark: {
    marginLeft: 6,
  },
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  insuranceDesc: {
    fontSize: 12,
    marginBottom: 4,
  },
  insurancePrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalRowLabel: {
    fontSize: 14,
  },
  totalRowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalFinalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalFinalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  proceedButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  proceedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  proceedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});

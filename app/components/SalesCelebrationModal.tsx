import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface SalesCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  itemName: string;
  salePrice: number;
  buyerUsername: string;
  sellerPayout: number;
  bidgoatFee: number;
  orderId: number;
  itemId: number;
  premiumShipping?: {
    hours: number;
    emoji: string;
    name: string;
  };
}

export default function SalesCelebrationModal({
  visible,
  onClose,
  itemName,
  salePrice,
  buyerUsername,
  sellerPayout,
  bidgoatFee,
  orderId,
  itemId,
  premiumShipping,
}: SalesCelebrationModalProps) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePrintLabel = () => {
    onClose();
    router.push(`/seller/orders?orderId=${orderId}`);
  };

  const handleViewOrder = () => {
    onClose();
    router.push(`/seller/orders?orderId=${orderId}`);
  };

  const confettiTranslateY = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  const premiumShippingTiers: Record<number, { emoji: string; name: string; color: string }> = {
    6: { emoji: '🚀', name: '6-Hour Rush', color: '#DC2626' },
    12: { emoji: '⚡', name: '12-Hour Rush', color: '#EA580C' },
    24: { emoji: '💨', name: '24-Hour Express', color: '#F59E0B' },
    48: { emoji: '📦', name: '48-Hour Priority', color: '#3B82F6' },
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti Effect */}
        <Animated.View
          style={[
            styles.confettiContainer,
            { transform: [{ translateY: confettiTranslateY }] },
          ]}
        >
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${(i * 5) % 100}%`,
                  backgroundColor: ['#FFD700', '#FF6B35', '#8B5CF6', '#10B981', '#F59E0B'][i % 5],
                  transform: [{ rotate: `${i * 18}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFD700', '#FF6B35', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Celebration Header */}
            <View style={styles.header}>
              <Text style={styles.celebration}>🎉 SOLD!</Text>
              <Text style={styles.itemName} numberOfLines={2}>
                {itemName}
              </Text>
              <Text style={styles.itemId}>Item #{itemId}</Text>
            </View>

            {/* Sale Details */}
            <View style={styles.detailsCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Sale Price</Text>
                <Text style={styles.salePrice}>${salePrice.toFixed(2)}</Text>
              </View>

              <View style={styles.buyerRow}>
                <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.buyerText}>Sold to @{buyerUsername}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.payoutCard}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>BidGoat Fee (8%)</Text>
                  <Text style={styles.feeValue}>-${bidgoatFee.toFixed(2)}</Text>
                </View>
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Your Payout</Text>
                  <Text style={styles.payoutValue}>${sellerPayout.toFixed(2)}</Text>
                </View>
              </View>

              {/* Premium Shipping Alert */}
              {premiumShipping && premiumShippingTiers[premiumShipping.hours] && (
                <View style={[styles.premiumAlert, { backgroundColor: premiumShippingTiers[premiumShipping.hours].color + '20' }]}>
                  <View style={styles.premiumHeader}>
                    <Text style={styles.premiumEmoji}>{premiumShippingTiers[premiumShipping.hours].emoji}</Text>
                    <Text style={[styles.premiumTitle, { color: premiumShippingTiers[premiumShipping.hours].color }]}>
                      {premiumShippingTiers[premiumShipping.hours].name}
                    </Text>
                  </View>
                  <Text style={styles.premiumText}>
                    ⚠️ You must ship within {premiumShipping.hours} business hours!
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handlePrintLabel}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="rocket" size={20} color="#FFF" />
                  <Text style={styles.primaryButtonText}>🚀 Print Shipping Label</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleViewOrder}
                activeOpacity={0.8}
              >
                <Ionicons name="receipt-outline" size={20} color="#8B5CF6" />
                <Text style={styles.secondaryButtonText}>View Order Details</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebration: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  itemId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  salePrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  buyerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  payoutCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeValue: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payoutLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  payoutValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  premiumAlert: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  premiumEmoji: {
    fontSize: 20,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  premiumText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  secondaryButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

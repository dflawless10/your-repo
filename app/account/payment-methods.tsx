import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  brand?: string; // visa, mastercard, amex, discover
  last4: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  billing_details?: {
    name: string;
    email?: string;
  };
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = new Animated.Value(0);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  // Card form state
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [billingZip, setBillingZip] = useState('');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/payment/methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.log('Payment methods endpoint not available yet');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/payment/methods/${methodId}/set-default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await loadPaymentMethods();
        Alert.alert('Success', 'Default payment method updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const handleDeleteMethod = (methodId: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const response = await fetch(`${API_BASE_URL}/api/payment/methods/${methodId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                await loadPaymentMethods();
                Alert.alert('Success', 'Payment method removed');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove payment method');
            }
          },
        },
      ]
    );
  };


  const handleAddCard = async () => {
    if (!cardholderName.trim()) {
      Alert.alert('Error', 'Please enter cardholder name');
      return;
    }

    if (!cardDetails || !cardDetails.complete) {
      Alert.alert('Error', 'Please enter valid card information');
      return;
    }

    setAddingCard(true);

    try {
      // Create payment method using Stripe SDK (secure, PCI-compliant)
      const { error, paymentMethod } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: cardholderName,
          },
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to process card');
        setAddingCard(false);
        return;
      }

      if (paymentMethod) {
        await savePaymentMethodToBackend(paymentMethod.id, 'card');
        setShowAddModal(false);
        setCardDetails(null);
        setCardholderName('');
        setBillingZip('');
      }
    } catch (error) {
      console.error('Add card error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setAddingCard(false);
    }
  };

  const handleLearnMoreStripe = () => {
    Linking.openURL('https://stripe.com/docs/payments');
  };

  const getCardIcon = (method: PaymentMethod) => {
    if (method.type === 'apple_pay') {
      return { name: 'logo-apple', color: '#000000' };
    }
    if (method.type === 'google_pay') {
      return { name: 'logo-google', color: '#4285F4' };
    }

    switch (method.brand?.toLowerCase()) {
      case 'visa':
        return { name: 'card', color: '#1A1F71' };
      case 'mastercard':
        return { name: 'card', color: '#EB001B' };
      case 'amex':
      case 'american express':
        return { name: 'card', color: '#006FCF' };
      case 'discover':
        return { name: 'card', color: '#FF6000' };
      default:
        return { name: 'card-outline', color: '#6A0DAD' };
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    if (method.type === 'apple_pay') return 'Apple Pay';
    if (method.type === 'google_pay') return 'Google Pay';
    return method.brand?.toUpperCase() || 'CARD';
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const icon = getCardIcon(method);

    return (
      <View key={method.id} style={styles.paymentMethodCard}>
        <View style={styles.paymentMethodHeader}>
          <View style={[styles.cardIcon, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name as any} size={24} color={icon.color} />
          </View>

          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodTitleRow}>
              <Text style={styles.paymentMethodBrand}>{getMethodLabel(method)}</Text>
              {method.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
            </View>
            {method.type === 'card' && (
              <>
                <Text style={styles.paymentMethodNumber}>•••• {method.last4}</Text>
                {method.exp_month && method.exp_year && (
                  <Text style={styles.paymentMethodExpiry}>
                    Expires {String(method.exp_month).padStart(2, '0')}/{String(method.exp_year).slice(-2)}
                  </Text>
                )}
              </>
            )}
            {method.billing_details?.name && (
              <Text style={styles.paymentMethodName}>{method.billing_details.name}</Text>
            )}
          </View>
        </View>

        <View style={styles.paymentMethodActions}>
          {!method.is_default && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(method.id)}
            >
              <Ionicons name="star-outline" size={18} color="#6A0DAD" />
              <Text style={styles.actionButtonText}>Set Default</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteMethod(method.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, backgroundColor: colors.background }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Header with Back Arrow */}
        <View style={[styles.pageHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Payment Methods</Text>
        </View>
        {/* Security Banner */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.securityBanner}
        >
          <Ionicons name="shield-checkmark" size={28} color="#FFF" />
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Secure Payment Processing</Text>
            <Text style={styles.securitySubtitle}>
              Powered by Stripe • PCI-DSS Compliant • Your data is encrypted
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.loadingText, { color: theme === 'dark' ? '#999' : '#999' }]}>Loading payment methods...</Text>
          </View>
        ) : paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={theme === 'dark' ? '#3C3C3E' : '#D1D5DB'} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Payment Methods</Text>
            <Text style={[styles.emptySubtitle, { color: theme === 'dark' ? '#999' : '#999' }]}>
              Add a payment method to make purchases faster and easier
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Payment Methods</Text>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        )}

        {/* Stripe Integration Notice */}
        <TouchableOpacity style={[styles.stripeNotice, { backgroundColor: theme === 'dark' ? '#1C1C2E' : '#F0F4FF', borderColor: theme === 'dark' ? '#2C2C3E' : '#D1D9FF' }]} onPress={handleLearnMoreStripe}>
          <View style={styles.stripeNoticeContent}>
            <Ionicons name="shield-checkmark" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <View style={styles.stripeNoticeText}>
              <Text style={[styles.stripeNoticeTitle, { color: theme === 'dark' ? '#B794F4' : '#1E40AF' }]}>Powered by Stripe</Text>
              <Text style={[styles.stripeNoticeSubtitle, { color: theme === 'dark' ? '#999' : '#1E40AF' }]}>
                Secure payment processing with Apple Pay, Google Pay, and card payments
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </View>
        </TouchableOpacity>

        {/* Add Payment Method Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6A0DAD', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFF" />
            <Text style={styles.addButtonText}>Add Credit or Debit Card</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme === 'dark' ? '#1C1C2E' : '#F0F4FF', borderColor: theme === 'dark' ? '#2C2C3E' : '#D1D9FF' }]}>
          <Text style={[styles.infoTitle, { color: theme === 'dark' ? '#B794F4' : '#1E40AF' }]}>💳 Accepted Payment Methods</Text>
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#999' : '#1E40AF' }]}>
            • Visa, Mastercard, American Express, Discover{'\n'}
            • Secure card payments via Stripe{'\n'}
            • Apple Pay & Google Pay (coming soon)
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* Add Card Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Card</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <LinearGradient
              colors={['#6A0DAD', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalBanner}
            >
              <Ionicons name="lock-closed" size={24} color="#FFF" />
              <Text style={styles.modalBannerText}>
                Your card information is encrypted and secure
              </Text>
            </LinearGradient>

            {/* Cardholder Name */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Cardholder Name</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
                <Ionicons name="person-outline" size={20} color={theme === 'dark' ? '#666' : '#999'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  placeholder="John Doe"
                  placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Card Information - Coming Soon */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Card Information</Text>
              <View style={[styles.comingSoonBox, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F5F5F5', borderColor: colors.border }]}>
                <Ionicons name="card-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                  Stripe integration coming soon
                </Text>
                <Text style={[styles.comingSoonSubtext, { color: colors.textSecondary }]}>
                  Add payment methods securely
                </Text>
              </View>
            </View>

            {/* Add Card Button */}
            <TouchableOpacity
              style={[styles.submitButton, addingCard && styles.submitButtonDisabled]}
              onPress={handleAddCard}
              disabled={addingCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={addingCard ? ['#D1D5DB', '#9CA3AF'] : ['#6A0DAD', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {addingCard ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    <Text style={styles.submitButtonText}>Add Card</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={[styles.securityNotice, { backgroundColor: theme === 'dark' ? '#1C1C2E' : '#F0F4FF' }]}>
              <Ionicons name="information-circle" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
              <Text style={[styles.securityNoticeText, { color: theme === 'dark' ? '#999' : '#1E40AF' }]}>
                We use Stripe for secure payment processing. Your card details are encrypted with industry-standard SSL/TLS.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  securityText: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  securitySubtitle: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  paymentMethodCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentMethodBrand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  paymentMethodNumber: {
    fontSize: 15,
    color: '#666',
    marginBottom: 2,
  },
  paymentMethodExpiry: {
    fontSize: 13,
    color: '#999',
    marginBottom: 2,
  },
  paymentMethodName: {
    fontSize: 13,
    color: '#999',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  stripeNotice: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1D9FF',
  },
  stripeNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stripeNoticeText: {
    flex: 1,
  },
  stripeNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  stripeNoticeSubtitle: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D9FF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
    gap: 12,
  },
  modalBannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1A1A1A',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  comingSoonBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  comingSoonSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});

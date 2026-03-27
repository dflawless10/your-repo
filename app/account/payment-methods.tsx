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
  Switch,
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
  id: number;
  method_type: string;
  provider: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  paypal_email?: string;
  cashapp_cashtag?: string;
  crypto_wallet_address?: string;
  crypto_currency?: string;
  billing_name?: string;
  is_default: boolean;
  is_verified: boolean;
  enabled_for_receiving: boolean;
  enabled_for_sending: boolean;
  last_used_at?: string;
}

interface SellerPreferences {
  accepts_stripe: boolean;
  accepts_paypal: boolean;
  accepts_cashapp: boolean;
  accepts_crypto: boolean;
  track_payment_method_performance: boolean;
  notify_when_better_method_available: boolean;
}

interface PaymentAnalytics {
  method_type: string;
  provider: string;
  total_transactions: number;
  successful_transactions: number;
  avg_amount: number;
  total_volume: number;
  avg_conversion_rate: number;
  avg_time_seconds: number;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = new Animated.Value(0);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [sellerPrefs, setSellerPrefs] = useState<SellerPreferences | null>(null);
  const [analytics, setAnalytics] = useState<PaymentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAddType, setSelectedAddType] = useState<string>('');

  // Form states
  const [cardholderName, setCardholderName] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cashappCashtag, setCashappCashtag] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('ETH');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadPaymentMethods(),
      loadSellerPreferences(),
      loadAnalytics(),
    ]);
    setLoading(false);
  };

  const loadPaymentMethods = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/payment/methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadSellerPreferences = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/payment/seller/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSellerPrefs(data);
      }
    } catch (error) {
      console.error('Error loading seller preferences:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/payment/seller/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.methods || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSetDefault = async (methodId: number) => {
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

  const handleDeleteMethod = (methodId: number) => {
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

  const handleAddPaymentMethod = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      let body: any = {
        method_type: selectedAddType,
        enabled_for_sending: true,
      };

      switch (selectedAddType) {
        case 'stripe_card':
          if (!cardholderName.trim()) {
            Alert.alert('Error', 'Please enter cardholder name');
            return;
          }
          body.billing_name = cardholderName;
          // In production, you'd collect card details via Stripe SDK
          body.card_brand = 'visa';
          body.card_last4 = '4242';
          body.card_exp_month = 12;
          body.card_exp_year = 2025;
          break;

        case 'paypal':
          if (!paypalEmail.trim()) {
            Alert.alert('Error', 'Please enter PayPal email');
            return;
          }
          body.paypal_email = paypalEmail;
          body.billing_name = paypalEmail.split('@')[0];
          break;

        case 'cashapp':
          if (!cashappCashtag.trim()) {
            Alert.alert('Error', 'Please enter Cash App $cashtag');
            return;
          }
          body.cashapp_cashtag = cashappCashtag.startsWith('$') ? cashappCashtag : `$${cashappCashtag}`;
          body.billing_name = body.cashapp_cashtag;
          break;

        case 'crypto':
          if (!cryptoAddress.trim()) {
            Alert.alert('Error', 'Please enter wallet address');
            return;
          }
          body.crypto_wallet_address = cryptoAddress;
          body.crypto_currency = cryptoCurrency;
          body.billing_name = `${cryptoCurrency} Wallet`;
          break;
      }

      const response = await fetch(`${API_BASE_URL}/api/payment/methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        await loadPaymentMethods();
        Alert.alert('Success', 'Payment method added successfully');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const resetForm = () => {
    setCardholderName('');
    setPaypalEmail('');
    setCashappCashtag('');
    setCryptoAddress('');
    setSelectedAddType('');
  };

  const handleToggleSellerAcceptance = async (methodType: 'stripe' | 'paypal' | 'cashapp' | 'crypto', enabled: boolean) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const updatedPrefs = {
        ...sellerPrefs,
        [`accepts_${methodType}`]: enabled,
      };

      const response = await fetch(`${API_BASE_URL}/api/payment/seller/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPrefs),
      });

      if (response.ok) {
        setSellerPrefs(updatedPrefs as SellerPreferences);
      }
    } catch (error) {
      console.error('Error updating seller preferences:', error);
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.method_type) {
      case 'stripe_apple_pay':
        return { name: 'logo-apple' as const, color: '#000000' };
      case 'stripe_google_pay':
        return { name: 'logo-google' as const, color: '#4285F4' };
      case 'paypal':
        return { name: 'logo-paypal' as const, color: '#00457C' };
      case 'cashapp':
        return { name: 'cash' as const, color: '#00D64F' };
      case 'crypto':
        return { name: 'logo-bitcoin' as const, color: '#F7931A' };
      case 'stripe_card':
      default:
        switch (method.card_brand?.toLowerCase()) {
          case 'visa':
            return { name: 'card' as const, color: '#1A1F71' };
          case 'mastercard':
            return { name: 'card' as const, color: '#EB001B' };
          case 'amex':
            return { name: 'card' as const, color: '#006FCF' };
          default:
            return { name: 'card-outline' as const, color: '#6A0DAD' };
        }
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method.method_type) {
      case 'stripe_apple_pay':
        return 'Apple Pay';
      case 'stripe_google_pay':
        return 'Google Pay';
      case 'paypal':
        return 'PayPal';
      case 'cashapp':
        return 'Cash App';
      case 'crypto':
        return `${method.crypto_currency} Wallet`;
      case 'stripe_card':
      default:
        return method.card_brand?.toUpperCase() || 'CARD';
    }
  };

  const getMethodDetails = (method: PaymentMethod) => {
    switch (method.method_type) {
      case 'stripe_card':
        return `•••• ${method.card_last4}`;
      case 'paypal':
        return method.paypal_email || '';
      case 'cashapp':
        return method.cashapp_cashtag || '';
      case 'crypto':
        return `${method.crypto_wallet_address?.substring(0, 6)}...${method.crypto_wallet_address?.substring(method.crypto_wallet_address.length - 4)}`;
      default:
        return '';
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const icon = getMethodIcon(method);

    return (
      <View key={method.id} style={[styles.paymentMethodCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
        <View style={styles.paymentMethodHeader}>
          <View style={[styles.cardIcon, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>

          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodTitleRow}>
              <Text style={[styles.paymentMethodBrand, { color: colors.textPrimary }]}>{getMethodLabel(method)}</Text>
              {method.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
            </View>
            <Text style={[styles.paymentMethodNumber, { color: theme === 'dark' ? '#999' : '#666' }]}>
              {getMethodDetails(method)}
            </Text>
            {method.billing_name && (
              <Text style={[styles.paymentMethodName, { color: theme === 'dark' ? '#666' : '#999' }]}>
                {method.billing_name}
              </Text>
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

  const renderSellerPaymentOption = (
    methodType: 'stripe' | 'paypal' | 'cashapp' | 'crypto',
    icon: any,
    title: string,
    subtitle: string,
    stats?: PaymentAnalytics
  ) => {
    const enabled = sellerPrefs?.[`accepts_${methodType}` as keyof SellerPreferences] as boolean || false;

    return (
      <View style={[styles.sellerMethodCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
        <View style={styles.sellerMethodHeader}>
          <View style={styles.sellerMethodLeft}>
            <Ionicons name={icon} size={28} color={enabled ? '#10B981' : '#999'} />
            <View style={styles.sellerMethodText}>
              <Text style={[styles.sellerMethodTitle, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.sellerMethodSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
                {subtitle}
              </Text>
            </View>
          </View>
          <Switch
            value={enabled}
            onValueChange={(value) => handleToggleSellerAcceptance(methodType, value)}
            trackColor={{ false: '#767577', true: '#10B981' }}
            thumbColor={enabled ? '#FFF' : '#f4f3f4'}
          />
        </View>

        {stats && enabled && (
          <View style={[styles.statsRow, { borderTopColor: theme === 'dark' ? '#2C2C2E' : '#E5E5E5' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.total_transactions}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Sales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>${stats.total_volume.toFixed(0)}</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Volume</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.avg_conversion_rate}%</Text>
              <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Conversion</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAddMethodModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Payment Method</Text>
          <TouchableOpacity
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
          {!selectedAddType ? (
            <View style={styles.methodTypeSelector}>
              <Text style={[styles.selectorTitle, { color: colors.textPrimary }]}>Select Payment Method Type</Text>

              <TouchableOpacity
                style={[styles.methodTypeButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
                onPress={() => setSelectedAddType('stripe_card')}
              >
                <Ionicons name="card-outline" size={32} color="#6A0DAD" />
                <Text style={[styles.methodTypeText, { color: colors.textPrimary }]}>Credit/Debit Card</Text>
                <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#666' : '#999'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTypeButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
                onPress={() => setSelectedAddType('paypal')}
              >
                <Ionicons name="logo-paypal" size={32} color="#00457C" />
                <Text style={[styles.methodTypeText, { color: colors.textPrimary }]}>PayPal</Text>
                <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#666' : '#999'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTypeButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
                onPress={() => setSelectedAddType('cashapp')}
              >
                <Ionicons name="cash-outline" size={32} color="#00D64F" />
                <Text style={[styles.methodTypeText, { color: colors.textPrimary }]}>Cash App</Text>
                <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#666' : '#999'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTypeButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
                onPress={() => setSelectedAddType('crypto')}
              >
                <Ionicons name="logo-bitcoin" size={32} color="#F7931A" />
                <Text style={[styles.methodTypeText, { color: colors.textPrimary }]}>Crypto Wallet</Text>
                <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#666' : '#999'} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.methodForm}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setSelectedAddType('');
                  resetForm();
                }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Back</Text>
              </TouchableOpacity>

              {selectedAddType === 'stripe_card' && (
                <>
                  <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Add Credit/Debit Card</Text>
                  <View style={styles.inputSection}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Cardholder Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      placeholder="John Doe"
                      placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                    />
                  </View>
                  <View style={[styles.comingSoonBox, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F5F5F5', borderColor: colors.border }]}>
                    <Ionicons name="card-outline" size={32} color={colors.textSecondary} />
                    <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                      Stripe card integration coming soon
                    </Text>
                  </View>
                </>
              )}

              {selectedAddType === 'paypal' && (
                <>
                  <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Add PayPal Account</Text>
                  <View style={styles.inputSection}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>PayPal Email</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}
                      value={paypalEmail}
                      onChangeText={setPaypalEmail}
                      placeholder="user@example.com"
                      placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}

              {selectedAddType === 'cashapp' && (
                <>
                  <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Add Cash App</Text>
                  <View style={styles.inputSection}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Cash App $Cashtag</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}
                      value={cashappCashtag}
                      onChangeText={setCashappCashtag}
                      placeholder="$johndoe"
                      placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}

              {selectedAddType === 'crypto' && (
                <>
                  <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Add Crypto Wallet</Text>
                  <View style={styles.inputSection}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Cryptocurrency</Text>
                    <View style={styles.cryptoSelector}>
                      {['BTC', 'ETH', 'USDC'].map((crypto) => (
                        <TouchableOpacity
                          key={crypto}
                          style={[
                            styles.cryptoButton,
                            { borderColor: cryptoCurrency === crypto ? '#6A0DAD' : (theme === 'dark' ? '#333' : '#E0E0E0') },
                            cryptoCurrency === crypto && styles.cryptoButtonSelected
                          ]}
                          onPress={() => setCryptoCurrency(crypto)}
                        >
                          <Text style={[styles.cryptoButtonText, { color: cryptoCurrency === crypto ? '#6A0DAD' : colors.textPrimary }]}>
                            {crypto}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.inputSection}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Wallet Address</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}
                      value={cryptoAddress}
                      onChangeText={setCryptoAddress}
                      placeholder="0x..."
                      placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddPaymentMethod}
              >
                <LinearGradient
                  colors={['#6A0DAD', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                  <Text style={styles.submitButtonText}>Add Payment Method</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

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
        {/* Page Header */}
        <View style={[styles.pageHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonHeader}
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
              All methods encrypted • PCI-DSS Compliant • Multiple trusted providers
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.loadingText, { color: theme === 'dark' ? '#999' : '#999' }]}>Loading payment data...</Text>
          </View>
        ) : (
          <>
            {/* BUYER SECTION: Your Payment Methods */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💳 Your Payment Methods</Text>
              <Text style={[styles.sectionSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
                Use these to purchase items
              </Text>

              {paymentMethods.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="card-outline" size={64} color={theme === 'dark' ? '#3C3C3E' : '#D1D5DB'} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Payment Methods</Text>
                  <Text style={[styles.emptySubtitle, { color: theme === 'dark' ? '#999' : '#999' }]}>
                    Add a payment method to make purchases faster
                  </Text>
                </View>
              ) : (
                paymentMethods.map(renderPaymentMethod)
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <LinearGradient
                  colors={['#6A0DAD', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                  <Text style={styles.addButtonText}>Add Payment Method</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* SELLER SECTION: Accept Payments */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💰 Accept Payments (Seller)</Text>
              <Text style={[styles.sectionSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
                Select which payment methods you accept from buyers
              </Text>

              {renderSellerPaymentOption(
                'stripe',
                'card-outline',
                'Stripe',
                'Cards, Apple Pay, Google Pay',
                analytics.find(a => a.provider === 'stripe')
              )}

              {renderSellerPaymentOption(
                'paypal',
                'logo-paypal',
                'PayPal',
                'Higher trust for expensive items',
                analytics.find(a => a.provider === 'paypal')
              )}

              {renderSellerPaymentOption(
                'cashapp',
                'cash-outline',
                'Cash App',
                'Popular with younger buyers',
                analytics.find(a => a.provider === 'cashapp')
              )}

              {renderSellerPaymentOption(
                'crypto',
                'logo-bitcoin',
                'Cryptocurrency',
                'BTC, ETH, USDC - Lower fees (2%)',
                analytics.find(a => a.provider === 'crypto' || a.provider === 'coinbase')
              )}

              <TouchableOpacity
                style={[styles.analyticsButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}
                onPress={() => router.push('/seller/payment-analytics' as any)}
              >
                <Ionicons name="analytics-outline" size={20} color="#6A0DAD" />
                <Text style={[styles.analyticsButtonText, { color: '#6A0DAD' }]}>View Detailed Analytics</Text>
                <Ionicons name="chevron-forward" size={20} color="#6A0DAD" />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {renderAddMethodModal()}
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
  },
  backButtonHeader: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  paymentMethodCard: {
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
    marginBottom: 2,
  },
  paymentMethodName: {
    fontSize: 13,
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
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
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
  sellerMethodCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sellerMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sellerMethodText: {
    flex: 1,
  },
  sellerMethodTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sellerMethodSubtitle: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  analyticsButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  methodTypeSelector: {
    paddingTop: 20,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  methodTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  methodTypeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  methodForm: {
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  cryptoSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  cryptoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  cryptoButtonSelected: {
    backgroundColor: '#F5F3FF',
  },
  cryptoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
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
  comingSoonBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 12,
  },
  comingSoonText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

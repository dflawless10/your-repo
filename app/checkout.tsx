// app/checkout.tsx
import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, FlatList, Button, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useCartBackend } from 'hooks/usecartBackend';
import ConfettiCannon from 'react-native-confetti-cannon';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { parseISO, format } from 'date-fns';

function safeFormat(dateString: string | undefined, formatStr: string): string {
  if (!dateString) return '—'; // or 'Not yet listed'
  try {
    const iso = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const parsed = parseISO(iso);
    return format(parsed, formatStr);
  } catch {
    return '—';
  }
}



export default function CheckoutScreen() {
  const { cartItems } = useCartBackend();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const formattedTotal = formatCurrency(total);
  const timestamp = new Date().toISOString();
  const formattedTimestamp = formatDate(timestamp);
  const [isGuest, setIsGuest] = useState(false);

  const { email, username, address: paramAddress } = useLocalSearchParams();
  const user = useAppSelector(state => state.user.profile);

  const fallbackUser = email && username
  ? { id: 0, email, username, address: paramAddress }
  : null;

  const effectiveUser = user ?? fallbackUser;

   useEffect(() => {
    if (typeof paramAddress === 'string') {
  setAddress(paramAddress);
} else if (Array.isArray(paramAddress)) {
  setAddress(paramAddress[0]); // or join(', ') if you want all
}

    console.log('🧪 paramAddress type:', typeof paramAddress, paramAddress);


  }, [effectiveUser]);

   useEffect(() => {
  setIsGuest(!user && !!email && !!username);
}, [user, email, username]);




  const handlePlaceOrder = () => {
    if (!address || !cardNumber || !exp || !cvv) {
      Alert.alert('Missing Info', 'Please fill out all fields before placing your order.');
      return;
    }

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);

    // 🧾 Prepare QR payload
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
        total: total.toFixed(2),
        address,
        deliveryDate: 'Oct 26–Nov 2',
        qrPayload: JSON.stringify(qrPayload),
      },
    });
  };

  if (!effectiveUser) {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 18, marginTop: 20 }}>
        Please sign in to check out or continue as guest.
      </Text>
    </View>
  );
}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>💳 Checkout</Text>

        {cartItems.map((item) => (
          <View key={item.id.toString()} style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>${item.price.toFixed(2)}</Text>
            <Text>Total: {formattedTotal}</Text>
            <Text>Confirmed: {formattedTimestamp}</Text>
            <Text>🕒 Listed: {safeFormat(item.listedAt || item.listed_at || item.registration_time, 'PPP')}</Text>
          </View>
        ))}

        {showCelebration && (
          <ConfettiCannon count={80} origin={{ x: 0, y: 0 }} fadeOut />
        )}

        <View style={styles.summary}>
          {/* Cost Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Order Summary</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Shipping</Text>
              <Text style={styles.breakdownNote}>Calculated at delivery</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Sales Tax</Text>
              <Text style={styles.breakdownNote}>Calculated at delivery</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Shipping Address */}
          <Text style={styles.sectionLabel}>Shipping Address</Text>
          <TextInput placeholder="Enter your shipping address" value={address} onChangeText={setAddress} style={styles.input} multiline numberOfLines={2} />

          {/* Payment Section */}
          <View style={styles.paymentHeader}>
            <Text style={styles.sectionLabel}>Payment Information</Text>
            <View style={styles.stripeBadge}>
              <Text style={styles.stripeBadgeText}>Powered by Stripe</Text>
            </View>
          </View>

          <TextInput placeholder="Card Number" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" style={styles.input} />
          <View style={styles.cardDetailsRow}>
            <TextInput placeholder="MM/YY" value={exp} onChangeText={setExp} style={[styles.input, styles.halfInput]} />
            <TextInput placeholder="CVV" value={cvv} onChangeText={setCvv} keyboardType="number-pad" style={[styles.input, styles.halfInput]} secureTextEntry />
          </View>

          {/* Secure Payment Badge */}
          <View style={styles.secureRow}>
            <Text style={styles.secureIcon}>🔒</Text>
            <Text style={styles.secureText}>Secure 256-bit encrypted payment</Text>
          </View>

          <Button title="Place Order" onPress={handlePlaceOrder} color="#6A0DAD" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 10, marginBottom: 12, backgroundColor: '#fafafa',
  },
  name: { fontSize: 16, fontWeight: '500' },
  summary: { marginTop: 24 },
  total: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  breakdownCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  breakdownNote: {
    fontSize: 14,
    color: '#868e96',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  stripeBadge: {
    backgroundColor: '#635BFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  stripeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 8,
  },
  secureIcon: {
    fontSize: 16,
  },
  secureText: {
    fontSize: 13,
    color: '#48BB78',
    fontWeight: '500',
  },
});

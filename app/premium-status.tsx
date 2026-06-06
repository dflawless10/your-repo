import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';

export default function PremiumStatusScreen() {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const [renewalDate, setRenewalDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/premium/billing-info`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setRenewalDate(data.renewal_date ?? null);
        }
      } catch (err) {
        console.warn('Failed to fetch billing info');
      }
    };

    void fetchBilling();
  }, []);

  const handleCancelPremium = () => {
    Alert.alert(
      'Cancel Premium Membership',
      "We're sorry to see you go 🐐 Want to cancel your Premium Seller membership?",
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Cancel Premium',
          style: 'destructive',
          onPress: async () => {
            const token = await AsyncStorage.getItem('jwtToken');
            if (!token) return;

            try {
              const res = await fetch(`${API_BASE_URL}/api/premium/cancel`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'User canceled from Premium Status screen' }),
              });

              if (res.ok) {
                Alert.alert(
                  'Premium Canceled',
                  'Your benefits remain active until the end of your billing period.'
                );
              } else {
                Alert.alert('Error', 'Could not cancel your membership.');
              }
            } catch {
              Alert.alert('Error', 'Network issue. Try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + insets.top,
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="diamond" size={60} color="#FFD700" />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Premium Seller</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You&#39;re saving 3% on every sale 🎉
          </Text>
        </View>

        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Your Benefits</Text>

          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={22} color="#48BB78" />
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>
              Lower fees: 5% instead of 8%
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={22} color="#48BB78" />
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>
              Verified Seller Badge
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={22} color="#48BB78" />
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>
              Priority Listing Placement
            </Text>
          </View>

          {renewalDate && (
            <Text style={[styles.renewalText, { color: colors.textSecondary }]}>
              Renews on: {renewalDate}
            </Text>
          )}
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelPremium}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={22} color="#fff" />
          <Text style={styles.cancelButtonText}>Cancel Premium</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  rowText: {
    fontSize: 16,
    marginLeft: 10,
  },
  renewalText: {
    marginTop: 16,
    fontSize: 14,
    fontStyle: 'italic',
  },
  cancelButton: {
    backgroundColor: '#E53E3E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

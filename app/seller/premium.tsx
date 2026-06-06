import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

const YEARLY_PRICE = 191.99;

type PricingData = {
  subscription: {
    premium_seller_monthly: number;
    benefits: string[];
  };
  shipping_rates: Record<string, string>;
  insurance_tiers: { range: string; cost: string }[];
};

export default function PremiumSellerScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/premium-features/pricing`);
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: 'monthly' | 'yearly') => {
    router.push({
      pathname: '/premium-benefits',
      params: { plan },
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!pricing) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Failed to load pricing</Text>
      </View>
    );
  }

  const monthlyPrice = pricing.subscription.premium_seller_monthly;
  const yearlyMonthlyCost = (YEARLY_PRICE / 12).toFixed(2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT,
          paddingBottom: 160,
          paddingHorizontal: 16,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Header */}
        <View style={styles.pageHeaderInline}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Premium Seller</Text>
        </View>

        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF9F5' }]}>
          <View style={styles.starContainer}>
            <Ionicons name="star" size={48} color="#FFD700" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Upgrade to Premium</Text>
          <Text style={[styles.heroSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
            Reduce your fees and unlock exclusive features
          </Text>
        </View>

        {/* Pricing Boxes */}
        <View style={styles.pricingRow}>
          {/* Monthly Box */}
          <TouchableOpacity
            style={[styles.pricingBox, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff', borderColor: '#FF6B35' }]}
            onPress={() => handleSelectPlan('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.planLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Monthly</Text>
            <Text style={styles.planPrice}>${monthlyPrice}</Text>
            <Text style={[styles.planPeriod, { color: theme === 'dark' ? '#999' : '#718096' }]}>/month</Text>
            <View style={[styles.selectBadge, { backgroundColor: '#FF6B35' }]}>
              <Text style={styles.selectBadgeText}>Select</Text>
            </View>
          </TouchableOpacity>

          {/* Yearly Box */}
          <TouchableOpacity
            style={[styles.pricingBox, styles.pricingBoxBest, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff', borderColor: '#6A0DAD' }]}
            onPress={() => handleSelectPlan('yearly')}
            activeOpacity={0.8}
          >
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best Value</Text>
            </View>
            <Text style={[styles.planLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Yearly</Text>
            <Text style={[styles.planPrice, { color: '#6A0DAD' }]}>${YEARLY_PRICE}</Text>
            <Text style={[styles.planPeriod, { color: theme === 'dark' ? '#999' : '#718096' }]}>/year</Text>
            <Text style={[styles.planSavings, { color: '#48BB78' }]}>${yearlyMonthlyCost}/mo — save 20%</Text>
            <View style={[styles.selectBadge, { backgroundColor: '#6A0DAD' }]}>
              <Text style={styles.selectBadgeText}>Select</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Fee Comparison */}
        <View style={[styles.comparisonCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Commission Comparison</Text>

          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCol}>
              <Text style={[styles.comparisonLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Regular Seller</Text>
              <Text style={styles.regularFee}>11% total</Text>
              <Text style={[styles.feeBreakdown, { color: theme === 'dark' ? '#666' : '#A0AEC0' }]}>8% + 3% processing</Text>
            </View>

            <Ionicons name="arrow-forward" size={24} color={theme === 'dark' ? '#666' : '#A0AEC0'} />

            <View style={styles.comparisonCol}>
              <Text style={[styles.comparisonLabel, { color: theme === 'dark' ? '#999' : '#718096' }]}>Premium Seller</Text>
              <Text style={styles.premiumFee}>8% total</Text>
              <Text style={[styles.feeBreakdown, { color: theme === 'dark' ? '#666' : '#A0AEC0' }]}>5% + 3% processing</Text>
            </View>
          </View>

          <View style={[styles.savingsBox, { backgroundColor: theme === 'dark' ? '#1A3D2E' : '#C6F6D5' }]}>
            <Text style={[styles.savingsText, { color: theme === 'dark' ? '#7FD6A8' : '#22543D' }]}>
              💰 Save 3% on every sale! On $1,000 in sales, that&#39;s $30 saved.
            </Text>
          </View>
        </View>

        {/* Benefits */}
        <View style={[styles.benefitsCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Premium Benefits</Text>
          {pricing.subscription.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={24} color="#48BB78" />
              <Text style={[styles.benefitText, { color: theme === 'dark' ? '#CCC' : '#2D3748' }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Shipping Rates Info */}
        <View style={[styles.infoCard, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#EDF2F7' }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>📦 Buyer-Paid Shipping</Text>
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>
            All shipping costs are paid by buyers. Flat rates based on weight:
          </Text>
          {Object.entries(pricing.shipping_rates).map(([tier, rate]) => (
            <Text key={tier} style={[styles.shippingRate, { color: theme === 'dark' ? '#999' : '#718096' }]}>
              • {rate}
            </Text>
          ))}
        </View>

        <Text style={[styles.footerText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
          Cancel anytime. No commitments. Start saving on fees today! 🐐
        </Text>
      </Animated.ScrollView>
      <GlobalFooter />
    </View>
  );
}

const createStyles = (isDark: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#E53E3E',
  },
  pageHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
    borderRadius: 12,
  },
  starContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pricingBox: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingBoxBest: {
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#6A0DAD',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B35',
  },
  planPeriod: {
    fontSize: 14,
    marginBottom: 4,
  },
  planSavings: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectBadge: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  comparisonCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonCol: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  regularFee: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E53E3E',
    marginBottom: 4,
  },
  premiumFee: {
    fontSize: 24,
    fontWeight: '700',
    color: '#48BB78',
    marginBottom: 4,
  },
  feeBreakdown: {
    fontSize: 12,
  },
  savingsBox: {
    padding: 12,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  benefitsCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 12,
  },
  shippingRate: {
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 4,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 32,
    lineHeight: 20,
  },
});

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

const API_URL = API_BASE_URL;

type PricingData = {
  subscription: {
    premium_seller_monthly: number;
    benefits: string[];
  };
  listing_features: {
    featured_listing: {
      cost: number;
      description: string;
    };
    reserve_price: {
      cost: number;
      description: string;
    };
  };
  shipping_rates: Record<string, string>;
  insurance_tiers: { range: string; cost: string }[];
};

export default function PremiumSellerScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchPricing();
  }, []);

  useEffect(() => {
    // Fade in header title and arrow
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${API_URL}/api/premium-features/pricing`);
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

  const handleSubscribe = () => {
    Alert.alert(
      '🎉 Upgrade to Premium',
      `Subscribe for $${pricing?.subscription.premium_seller_monthly}/month?\n\nYou'll save 3% on every sale!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setSubscribing(true);
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              // TODO: Implement actual subscription logic
              setTimeout(() => {
                setSubscribing(false);
                Alert.alert(
                  'Success!',
                  'You are now a Premium Seller! Enjoy reduced fees on all your sales.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }, 1500);
            } catch (error) {
              setSubscribing(false);
              Alert.alert('Error', 'Failed to subscribe. Please try again.');
            }
          },
        },
      ]
    );
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

  const monthlySavings = (pricing.subscription.premium_seller_monthly / 0.03).toFixed(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, backgroundColor: colors.background }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Header with Back Arrow */}
        <Animated.View style={[
          styles.pageHeader,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
            backgroundColor: colors.background,
            borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5'
          }
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Premium Seller</Text>
        </Animated.View>

      {/* Hero Section */}
      <View style={[styles.hero, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
        <View style={styles.starContainer}>
          <Ionicons name="star" size={48} color="#FFD700" />
        </View>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Upgrade to Premium</Text>
        <Text style={[styles.heroSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
          Reduce your fees and unlock exclusive features
        </Text>
        <View style={styles.priceTag}>
          <Text style={styles.priceAmount}>
            ${pricing.subscription.premium_seller_monthly}
          </Text>
          <Text style={styles.pricePeriod}>/month</Text>
        </View>
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

      {/* Additional Features */}
      <View style={[styles.featuresCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Additional Revenue Features</Text>

        <View style={[styles.featureItem, { borderBottomColor: theme === 'dark' ? '#333' : '#E2E8F0' }]}>
          <View style={styles.featureHeader}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={[styles.featureName, { color: colors.textPrimary }]}>Featured Listing</Text>
          </View>
          <Text style={[styles.featureDescription, { color: theme === 'dark' ? '#999' : '#718096' }]}>
            {pricing.listing_features.featured_listing.description}
          </Text>
          <Text style={styles.featurePrice}>
            ${pricing.listing_features.featured_listing.cost}
          </Text>
        </View>

        <View style={[styles.featureItem, { borderBottomColor: theme === 'dark' ? '#333' : '#E2E8F0' }]}>
          <View style={styles.featureHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#4299E1" />
            <Text style={[styles.featureName, { color: colors.textPrimary }]}>Reserve Price</Text>
          </View>
          <Text style={[styles.featureDescription, { color: theme === 'dark' ? '#999' : '#718096' }]}>
            {pricing.listing_features.reserve_price.description}
          </Text>
          <Text style={styles.featurePrice}>
            ${pricing.listing_features.reserve_price.cost}
          </Text>
        </View>
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

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.subscribeButton, subscribing && styles.subscribeButtonDisabled]}
        onPress={handleSubscribe}
        disabled={subscribing}
      >
        {subscribing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="star" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.subscribeButtonText}>
              Subscribe for ${pricing.subscription.premium_seller_monthly}/month
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Footer */}
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
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: '#E53E3E',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#E2E8F0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hero: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
    backgroundColor: isDark ? '#1C1C1E' : '#FFF9F5',
  },
  starContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.textSecondary,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6B35',
  },
  pricePeriod: {
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  comparisonCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
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
    color: colors.textPrimary,
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
    color: colors.textSecondary,
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
    color: isDark ? '#9CA3AF' : '#A0AEC0',
  },
  savingsBox: {
    backgroundColor: isDark ? '#1F3A2E' : '#C6F6D5',
    padding: 12,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 14,
    color: isDark ? '#86EFAC' : '#22543D',
    textAlign: 'center',
  },
  benefitsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
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
    color: colors.textPrimary,
  },
  featuresCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#E2E8F0',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featureDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  featurePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 12,
    color: colors.textSecondary,
  },
  shippingRate: {
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 4,
    color: colors.textSecondary,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 32,
    lineHeight: 20,
  },
});

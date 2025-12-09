import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.0.0.170:5000';

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
  insurance_tiers: Array<{ range: string; cost: string }>;
};

export default function PremiumSellerScreen() {
  const router = useRouter();
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchPricing();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!pricing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load pricing</Text>
      </View>
    );
  }

  const monthlySavings = (pricing.subscription.premium_seller_monthly / 0.03).toFixed(0);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Seller</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.starContainer}>
          <Ionicons name="star" size={48} color="#FFD700" />
        </View>
        <Text style={styles.heroTitle}>Upgrade to Premium</Text>
        <Text style={styles.heroSubtitle}>
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
      <View style={styles.comparisonCard}>
        <Text style={styles.sectionTitle}>Commission Comparison</Text>

        <View style={styles.comparisonRow}>
          <View style={styles.comparisonCol}>
            <Text style={styles.comparisonLabel}>Regular Seller</Text>
            <Text style={styles.regularFee}>11% total</Text>
            <Text style={styles.feeBreakdown}>8% + 3% processing</Text>
          </View>

          <Ionicons name="arrow-forward" size={24} color="#A0AEC0" />

          <View style={styles.comparisonCol}>
            <Text style={styles.comparisonLabel}>Premium Seller</Text>
            <Text style={styles.premiumFee}>8% total</Text>
            <Text style={styles.feeBreakdown}>5% + 3% processing</Text>
          </View>
        </View>

        <View style={styles.savingsBox}>
          <Text style={styles.savingsText}>
            💰 Save 3% on every sale! On $1,000 in sales, that's $30 saved.
          </Text>
        </View>
      </View>

      {/* Benefits */}
      <View style={styles.benefitsCard}>
        <Text style={styles.sectionTitle}>Premium Benefits</Text>
        {pricing.subscription.benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={24} color="#48BB78" />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      {/* Additional Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.sectionTitle}>Additional Revenue Features</Text>

        <View style={styles.featureItem}>
          <View style={styles.featureHeader}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={styles.featureName}>Featured Listing</Text>
          </View>
          <Text style={styles.featureDescription}>
            {pricing.listing_features.featured_listing.description}
          </Text>
          <Text style={styles.featurePrice}>
            ${pricing.listing_features.featured_listing.cost}
          </Text>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#4299E1" />
            <Text style={styles.featureName}>Reserve Price</Text>
          </View>
          <Text style={styles.featureDescription}>
            {pricing.listing_features.reserve_price.description}
          </Text>
          <Text style={styles.featurePrice}>
            ${pricing.listing_features.reserve_price.cost}
          </Text>
        </View>
      </View>

      {/* Shipping Rates Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📦 Buyer-Paid Shipping</Text>
        <Text style={styles.infoText}>
          All shipping costs are paid by buyers. Flat rates based on weight:
        </Text>
        {Object.entries(pricing.shipping_rates).map(([tier, rate]) => (
          <Text key={tier} style={styles.shippingRate}>
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
      <Text style={styles.footerText}>
        Cancel anytime. No commitments. Start saving on fees today! 🐐
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  hero: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  starContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
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
    color: '#718096',
    marginBottom: 8,
    marginLeft: 4,
  },
  comparisonCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
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
    color: '#1A202C',
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
    color: '#718096',
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
    color: '#A0AEC0',
  },
  savingsBox: {
    backgroundColor: '#C6F6D5',
    padding: 12,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 14,
    color: '#22543D',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
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
    color: '#2D3748',
    lineHeight: 22,
  },
  featuresCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
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
    borderBottomColor: '#E2E8F0',
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
    color: '#1A202C',
  },
  featureDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    lineHeight: 20,
  },
  featurePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  infoCard: {
    backgroundColor: '#EDF2F7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 12,
  },
  shippingRate: {
    fontSize: 13,
    color: '#718096',
    marginLeft: 8,
    marginBottom: 4,
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
    color: '#718096',
    marginHorizontal: 16,
    marginBottom: 32,
    lineHeight: 20,
  },
});

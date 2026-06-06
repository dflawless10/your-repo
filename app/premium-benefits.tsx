import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/app/theme/ThemeContext';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PremiumBenefitsScreen() {
  const router = useRouter();
  const { plan: initialPlan } = useLocalSearchParams<{ plan?: string }>();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    initialPlan === 'yearly' ? 'yearly' : 'monthly'
  );
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/user-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsPremium(!!data.is_premium_seller);
        }
      } catch {}
    };
    void fetchStatus();
  }, []);

  const benefits = [
    {
      icon: 'flash',
      title: 'Lower Commission Fees',
      description: 'Pay only 5% commission instead of 8%',
      savings: 'Save 3% on every sale',
      color: '#FFD700',
    },
    {
      icon: 'trending-up',
      title: 'Priority Listing Placement',
      description: 'Your items appear first in search results',
      savings: 'Get more views & bids',
      color: '#FF6B35',
    },
    {
      icon: 'shield-checkmark',
      title: 'Verified Seller Badge',
      description: 'Stand out with a premium badge on your listings',
      savings: 'Build trust faster',
      color: '#4CAF50',
    },
  ];

  const handleSelectAndUpgrade = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    const price = plan === 'monthly' ? '$19.99/month' : '$191.99/year';
    Alert.alert(
      'Confirm Subscription',
      `You're subscribing to BidGoat Premium — ${price}.\n\nYou'll save 3% on every sale!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => void subscribeToPremium(plan) },
      ]
    );
  };

  const subscribeToPremium = async (plan: 'monthly' | 'yearly') => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/premium/subscribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsPremium(true);
        Alert.alert('Welcome to Premium! 🎉', 'Your lower fees and benefits are now active. Happy selling!');
      } else {
        Alert.alert('Subscription Failed', data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      Alert.alert('Connection Error', 'Could not reach the server. Please try again.');
    }
  };

  const handleCancelPremium = () => {
    Alert.alert(
      'Cancel Premium Membership',
      "We're sorry to see you go 🐐 What's your reason for canceling?",
      [
        { text: 'Too expensive', onPress: () => void confirmCancel('Too expensive') },
        { text: 'Not enough benefits', onPress: () => void confirmCancel('Not enough benefits') },
        { text: 'Switching platforms', onPress: () => void confirmCancel('Switching platforms') },
        { text: 'Just taking a break', onPress: () => void confirmCancel('Just taking a break') },
        { text: 'Other reason', onPress: () => void confirmCancel('Other') },
        { text: 'Keep My Premium', style: 'cancel' },
      ]
    );
  };

  const confirmCancel = async (reason: string) => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/premium/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setIsPremium(false);
        Alert.alert(
          'Membership Canceled',
          'Your premium benefits remain active until the end of your current billing period.'
        );
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'Could not cancel. Please try again.');
      }
    } catch {
      Alert.alert('Connection Error', 'Could not reach the server. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

      <Animated.ScrollView
        style={styles.contentWrapper}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT + insets.top, paddingBottom: 80 },
        ]}
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
          <Text style={[styles.pageTitleText, { color: colors.textPrimary }]}>Upgrade to Premium</Text>
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={['#6A0DAD', '#9C27B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Ionicons name="diamond" size={60} color="#FFD700" />
          <Text style={styles.heroTitle}>BidGoat Premium</Text>
          <Text style={styles.heroSubtitle}>Sell smarter, earn more, grow faster</Text>
        </LinearGradient>

        {/* Plan Selection — tap to subscribe */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>
        <View style={styles.planSelector}>
          <TouchableOpacity
            style={[
              styles.planOption,
              { backgroundColor: colors.surface, borderColor: '#FF6B35' },
            ]}
            onPress={() => handleSelectAndUpgrade('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.planTitle, { color: colors.textPrimary }]}>Monthly</Text>
            <Text style={[styles.planPrice, { color: '#FF6B35' }]}>$19.99</Text>
            <Text style={[styles.planPer, { color: colors.textSecondary }]}>per month</Text>
            <View style={[styles.selectBadge, { backgroundColor: '#FF6B35' }]}>
              <Text style={styles.selectBadgeText}>Subscribe</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planOption,
              { backgroundColor: colors.surface, borderColor: '#6A0DAD' },
            ]}
            onPress={() => handleSelectAndUpgrade('yearly')}
            activeOpacity={0.8}
          >
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>SAVE 20%</Text>
            </View>
            <Text style={[styles.planTitle, { color: colors.textPrimary }]}>Yearly</Text>
            <Text style={[styles.planPrice, { color: '#6A0DAD' }]}>$191.99</Text>
            <Text style={[styles.planPer, { color: colors.textSecondary }]}>per year</Text>
            <Text style={[styles.planEquivalent, { color: colors.textSecondary }]}>($15.99/mo)</Text>
            <View style={[styles.selectBadge, { backgroundColor: '#6A0DAD' }]}>
              <Text style={styles.selectBadgeText}>Subscribe</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Premium Benefits</Text>
        <View style={styles.benefitsSection}>
          {benefits.map((benefit, index) => (
            <View
              key={index}
              style={[styles.benefitCard, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '20' }]}>
                <Ionicons name={benefit.icon as any} size={28} color={benefit.color} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                  {benefit.title}
                </Text>
                <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                  {benefit.description}
                </Text>
                <Text style={[styles.benefitSavings, { color: benefit.color }]}>
                  💰 {benefit.savings}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ROI Calculator */}
        <View style={[styles.roiSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.roiTitle, { color: colors.textPrimary }]}>
            💡 How much will you save?
          </Text>
          <View style={styles.roiCalculation}>
            <View style={styles.roiRow}>
              <Text style={[styles.roiLabel, { color: colors.textSecondary }]}>
                If you sell $10,000/month:
              </Text>
            </View>
            <View style={styles.roiComparison}>
              <View style={styles.roiColumn}>
                <Text style={[styles.roiPlanName, { color: colors.textSecondary }]}>
                  Standard (8%)
                </Text>
                <Text style={[styles.roiFees, { color: '#E53E3E' }]}>-$800</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
              <View style={styles.roiColumn}>
                <Text style={[styles.roiPlanName, { color: '#FFD700' }]}>
                  Premium (5%)
                </Text>
                <Text style={[styles.roiFees, { color: '#4CAF50' }]}>-$500</Text>
              </View>
            </View>
            <View style={[styles.roiSavings, { borderTopColor: isDark ? '#333' : 'rgba(0,0,0,0.1)' }]}>
              <Text style={[styles.roiSavingsLabel, { color: colors.textSecondary }]}>
                Monthly Savings:
              </Text>
              <Text style={styles.roiSavingsAmount}>$300</Text>
            </View>
            <Text style={[styles.roiNote, { color: colors.textSecondary }]}>
              Premium pays for itself after ~$700 in sales! 🎉
            </Text>
          </View>
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>
          Frequently Asked Questions
        </Text>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes! Scroll to the bottom of this page and tap "Cancel My Premium Membership". No questions asked.' },
          { q: 'What happens if I cancel?', a: "You'll keep Premium benefits until your current billing period ends." },
          { q: 'Do I still pay Stripe fees?', a: 'Yes, Stripe payment processing fees (2.9% + $0.30) still apply.' },
          { q: 'Can I upgrade from monthly to yearly?', a: 'Absolutely! The difference will be prorated automatically.' },
        ].map((faq, index) => (
          <View key={index} style={[styles.faqCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.faqQuestion, { color: colors.textPrimary }]}>{faq.q}</Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
          </View>
        ))}

        <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
          Cancel anytime. No commitments. 🐐
        </Text>

        {isPremium && (
          <TouchableOpacity style={styles.cancelPremiumButton} onPress={handleCancelPremium}>
            <Text style={styles.cancelPremiumText}>Cancel My Premium Membership</Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
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
  pageTitleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  planSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  planOption: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  planPer: {
    fontSize: 14,
    marginTop: 4,
  },
  planEquivalent: {
    fontSize: 12,
    marginTop: 4,
  },
  selectBadge: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  benefitSavings: {
    fontSize: 13,
    fontWeight: '600',
  },
  roiSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  roiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  roiCalculation: {
    gap: 16,
  },
  roiRow: {
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  roiComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  roiColumn: {
    alignItems: 'center',
  },
  roiPlanName: {
    fontSize: 14,
    marginBottom: 8,
  },
  roiFees: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roiSavings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  roiSavingsLabel: {
    fontSize: 16,
  },
  roiSavingsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  roiNote: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelPremiumButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E53E3E',
    alignItems: 'center',
  },
  cancelPremiumText: {
    color: '#E53E3E',
    fontSize: 15,
    fontWeight: '600',
  },
});

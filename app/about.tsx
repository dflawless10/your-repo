import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EnhancedHeader, {HEADER_MAX_HEIGHT} from './components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";

const { width } = Dimensions.get('window');

export default function AboutScreen() {
  const router = useRouter();
  const scrollY = new Animated.Value(0);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/discover');
  };

  return (
    <View style={styles.wrapper}>
      <EnhancedHeader scrollY={scrollY} />

       <View style={styles.headerTitleContainer}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backArrow}
          >
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About BidGoat</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#6A0DAD', '#8B5CF6', '#A78BFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <Text style={styles.heroEmoji}>💎</Text>
          <Text style={styles.heroTitle}>Where Luxury Meets Opportunity</Text>
          <Text style={styles.heroSubtitle}>
            The premier auction platform for fine jewelry, luxury watches, and rare diamonds
          </Text>
        </LinearGradient>

        {/* The Hook */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>What if you could own that?</Text>
          <Text style={styles.bodyText}>
            That Rolex you&#39;ve been eyeing. That diamond necklace that catches the light just right.
            That vintage Cartier piece with a story to tell. What if it wasn&#39;t out of reach?
          </Text>
          <Text style={styles.bodyText}>
            <Text style={styles.boldText}>BidGoat changes the game.</Text> We&#39;re not another marketplace.
            We&#39;re where collectors hunt, dealers compete, and dreams become reality—one bid at a time.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <LinearGradient
              colors={['#F59E0B', '#F97316']}
              style={styles.featureIcon}
            >
              <Ionicons name="flash" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Live Auctions</Text>
            <Text style={styles.featureText}>
              Real-time bidding wars. Watch prices climb. Feel the adrenaline. Win your trophy.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.featureIcon}
            >
              <Ionicons name="shield-checkmark" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Verified Authenticity</Text>
            <Text style={styles.featureText}>
              Every piece vetted. Every seller verified. Sleep easy knowing you&#39;re getting the real deal.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              style={styles.featureIcon}
            >
              <Ionicons name="trending-down" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Below Market Prices</Text>
            <Text style={styles.featureText}>
              Luxury doesn&#39;t have to break the bank. Start bidding low and win high-end pieces for less.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <LinearGradient
              colors={['#EC4899', '#DB2777']}
              style={styles.featureIcon}
            >
              <Ionicons name="heart" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Instant Gratification</Text>
            <Text style={styles.featureText}>
              Can&#39;t wait? Buy It Now option gets you that piece immediately. No bidding, no waiting.
            </Text>
          </View>
        </View>

        {/* Social Proof */}
        <View style={styles.statsSection}>
          <LinearGradient
            colors={['#F3E8FF', '#FFFFFF']}
            style={styles.statsGradient}
          >
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>$2.4M+</Text>
              <Text style={styles.statLabel}>Traded in 2024</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Collectors</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>4.9★</Text>
              <Text style={styles.statLabel}>Seller Rating</Text>
            </View>
          </LinearGradient>
        </View>

        {/* How It Works */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>How the Hunt Works</Text>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Discover</Text>
              <Text style={styles.stepText}>
                Browse curated auctions for jewelry, watches, and diamonds. Filter by brand, price, or style.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Bid Smart</Text>
              <Text style={styles.stepText}>
                Place your bid. Set auto-bidding. Get alerts when you&#39;re outbid. Stay in the game.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Win & Own</Text>
              <Text style={styles.stepText}>
                Auction closes. You win. Secure checkout. Authenticated delivery. Pure joy.
              </Text>
            </View>
          </View>
        </View>

        {/* Why BidGoat */}
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.whySection}
        >
          <Text style={styles.whySectionTitle}>Why Collectors Choose BidGoat</Text>

          <View style={styles.whyItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>No Hidden Fees:</Text> What you bid is what you pay. Transparent pricing, always.
            </Text>
          </View>

          <View style={styles.whyItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>Seller Protection:</Text> Escrow system protects both buyers and sellers. Trade with confidence.
            </Text>
          </View>

          <View style={styles.whyItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>Expert Insights:</Text> Get real-time appraisals, market data, and AI-powered recommendations.
            </Text>
          </View>

          <View style={styles.whyItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>Community First:</Text> Join a network of passionate collectors, dealers, and enthusiasts.
            </Text>
          </View>
        </LinearGradient>

        {/* Testimonial */}
        <View style={styles.testimonialSection}>
          <Text style={styles.testimonialQuote}>
            &#34;I snagged a 1.2 carat diamond ring for 40% below retail. The authentication was flawless.
            BidGoat turned me from a window shopper into a collector.&#34;
          </Text>
          <Text style={styles.testimonialAuthor}>— Sarah M., Miami</Text>
        </View>

        {/* Final CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Your Next Treasure Awaits</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of collectors who&#39;ve discovered the thrill of bidding smart and winning big.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/register');
            }}
          >
            <LinearGradient
              colors={['#6A0DAD', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Start Bidding Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePress}
          >
            <Text style={styles.secondaryButtonText}>Browse Auctions First</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  titleWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: Platform.OS === 'ios' ? 180 : 180,
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#F3E8FF',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },

  // Section Container
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4B5563',
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '700',
    color: '#6A0DAD',
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  statsGradient: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6A0DAD',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },

  // How It Works Steps
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6A0DAD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
  },

  // Why Section
  whySection: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 28,
    marginBottom: 40,
  },
  whySectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  whyText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#E5E7EB',
    marginLeft: 12,
  },
  whyBold: {
    fontWeight: '700',
    color: '#FFF',
  },

  // Testimonial
  testimonialSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  testimonialQuote: {
    fontSize: 17,
    lineHeight: 28,
    color: '#374151',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  testimonialAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A0DAD',
    textAlign: 'center',
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  ctaSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 340,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A0DAD',
    textAlign: 'center',
  },
});

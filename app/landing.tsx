import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learn Why We're Different</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
      <LinearGradient
        colors={['#4CAF50', '#6A0DAD']}
        style={styles.hero}
      >
        <Text style={styles.goatEmoji}>🐐</Text>
        <Text style={styles.heroTitle}>BidGoat</Text>
        <Text style={styles.heroSubtitle}>
          The Most Intelligent Auction Platform Ever Built
        </Text>
        <Text style={styles.heroDescription}>
          While others run 25-year-old auction systems, we built the future
        </Text>
      </LinearGradient>

      {/* The Problem Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Legacy Platforms Fail You</Text>

        <View style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <Ionicons name="time-outline" size={24} color="#DC2626" />
            <Text style={styles.problemTitle}>Built in 1995</Text>
          </View>
          <Text style={styles.problemText}>
            eBay&#39;s proxy bidding is older than smartphones. They can&#39;t innovate without
            risking billions in transactions on ancient code.
          </Text>
        </View>

        <View style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <Ionicons name="cash-outline" size={24} color="#DC2626" />
            <Text style={styles.problemTitle}>Wrong Incentives</Text>
          </View>
          <Text style={styles.problemText}>
            Legacy platforms want quick sales. They take their cut regardless of price.
            Why help you get more when fast is easier?
          </Text>
        </View>

        <View style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <Ionicons name="eye-off-outline" size={24} color="#DC2626" />
            <Text style={styles.problemTitle}>&#34;Set and Forget&#34;</Text>
          </View>
          <Text style={styles.problemText}>
            Other platforms treat auto-bidding as a convenience feature. You&#39;re on your own
            after clicking &#34;Submit.&#34;
          </Text>
        </View>
      </View>

      {/* The BidGoat Difference */}
      <View style={[styles.section, styles.differenceSection]}>
        <Text style={styles.sectionTitle}>The BidGoat Difference</Text>
        <Text style={styles.differenceSubtitle}>
          We&#39;re not just another auction site. We&#39;re your intelligent partner.
        </Text>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="bulb" size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.featureTitle}>AI-Powered Strategy</Text>
          <Text style={styles.featureDescription}>
            Real-time competitive intelligence tells you exactly when to bid, how much
            to bid, and when to walk away. No guessing.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="trending-up" size={32} color="#FF6B35" />
          </View>
          <Text style={styles.featureTitle}>We Win When You Win</Text>
          <Text style={styles.featureDescription}>
            Higher final prices = more revenue for us. We actively want bidding wars
            because we profit from your success, not transaction speed.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="shield-checkmark" size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.featureTitle}>Smart Protection</Text>
          <Text style={styles.featureDescription}>
            Set your max once. Our AI tracks competing bids, market trends, and timing
            to maximize your odds while respecting your budget.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="people" size={32} color="#FF6B35" />
          </View>
          <Text style={styles.featureTitle}>Bidding War Intelligence</Text>
          <Text style={styles.featureDescription}>
            Multiple auto-bidders competing? Perfect. We orchestrate organic price
            discovery that benefits sellers and keeps buyers engaged.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="compass" size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.featureTitle}>Personalized Recommendations</Text>
          <Text style={styles.featureDescription}>
            Our recommendation engine learns what you love and surfaces hidden gems
            before anyone else finds them.
          </Text>
        </View>
      </View>

      {/* Innovation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Built for 2026, Not 1995</Text>
        
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonColumn}>
              <Text style={styles.comparisonLabel}>Legacy Platforms</Text>
              <Text style={styles.oldWay}>❌ Static proxy bidding</Text>
              <Text style={styles.oldWay}>❌ No market intelligence</Text>
              <Text style={styles.oldWay}>❌ Zero guidance</Text>
              <Text style={styles.oldWay}>❌ Quick sale focus</Text>
              <Text style={styles.oldWay}>❌ Manual everything</Text>
            </View>
            <View style={styles.comparisonColumn}>
              <Text style={styles.comparisonLabel}>BidGoat 🐐</Text>
              <Text style={styles.newWay}>✅ Dynamic AI strategy</Text>
              <Text style={styles.newWay}>✅ Real-time insights</Text>
              <Text style={styles.newWay}>✅ Active coaching</Text>
              <Text style={styles.newWay}>✅ Maximum value focus</Text>
              <Text style={styles.newWay}>✅ Intelligent automation</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Why Now Section */}
      <View style={[styles.section, styles.whyNowSection]}>
        <Text style={styles.sectionTitle}>Why This Matters Now</Text>
        <Text style={styles.whyNowText}>
          <Text style={styles.bold}>eBay can&#39;t fix this.</Text> Their 25-year-old codebase 
          is too fragile. One wrong move crashes billions in transactions.
        </Text>
        <Text style={styles.whyNowText}>
          <Text style={styles.bold}>Heritage and Southey&#39;s won&#39;t fix this.</Text> They 
          believe automation &#34;dilutes the authentic auction experience.&#34;
        </Text>
        <Text style={styles.whyNowText}>
          <Text style={styles.bold}>DealDash doesn&#39;t care.</Text> They make money on bid 
          purchases, not helping you win at fair prices.
        </Text>
        <Text style={styles.whyNowText}>
          <Text style={styles.bold}>BidGoat was built from scratch</Text> to solve the 
          problems legacy platforms can&#39;t (or won&#39;t) fix.
        </Text>
      </View>

      {/* Social Proof Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Join the Intelligent Auction Revolution</Text>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3.2x</Text>
          <Text style={styles.statLabel}>Higher winning bid rates with AI guidance</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>67%</Text>
          <Text style={styles.statLabel}>Users save money vs. manual bidding</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24/7</Text>
          <Text style={styles.statLabel}>AI monitoring - never miss an opportunity</Text>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Bid Smarter?</Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands who&#39;ve upgraded from legacy platforms
        </Text>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.primaryButtonText}>Get Started Free</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/sign-in')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          🐐 BidGoat - The Greatest Of All Time in auction intelligence
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  hero: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  goatEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  problemCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  problemText: {
    fontSize: 15,
    color: '#991B1B',
    lineHeight: 22,
  },
  differenceSection: {
    backgroundColor: '#FFF7ED',
  },
  differenceSubtitle: {
    fontSize: 16,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  featureCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFEDD5',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  comparisonCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  comparisonColumn: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  oldWay: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  newWay: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  whyNowSection: {
    backgroundColor: '#FFFBEB',
  },
  whyNowText: {
    fontSize: 16,
    color: '#78716C',
    lineHeight: 26,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    backgroundColor: '#1F2937',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 32,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  footer: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 32,
    textAlign: 'center',
  },
});

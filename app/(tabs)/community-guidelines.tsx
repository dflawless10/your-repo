import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader from '../components/EnhancedHeader';
import {HEADER_MAX_HEIGHT} from "@/components/EnhancedHeader";
import GlobalFooter from "@/app/components/GlobalFooter";

export default function CommunityGuidelinesScreen() {
  const router = useRouter();
  const scrollY = new Animated.Value(0);

  const handleReportIssue = () => {
    Linking.openURL('mailto:support@bidgoat.com?subject=Community Guidelines Question');
  };

  return (
    <View style={styles.wrapper}>
      <EnhancedHeader scrollY={scrollY} />

        {/* Title with Back Arrow */}
      <View style={styles.headerTitleContainer}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Guidlines</Text>

        </View>
      </View>


      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >


      {/* Do Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>✅</Text>
          <Text style={styles.sectionTitle}>Do:</Text>
        </View>

        <View style={styles.guidelinesList}>
          <GuidelineItem text="Write clear, honest descriptions of your items" />
          <GuidelineItem text="Use your own photos of the actual item you're selling" />
          <GuidelineItem text="Be respectful in all communications with buyers and sellers" />
          <GuidelineItem text="Price items fairly based on market value" />
          <GuidelineItem text="Respond to questions and messages promptly" />
          <GuidelineItem text="Ship items quickly and securely after sale" />
          <GuidelineItem text="Disclose any flaws, damage, or authenticity concerns" />
          <GuidelineItem text="Provide accurate measurements and specifications" />
        </View>
      </View>

      {/* Don't Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>❌</Text>
          <Text style={styles.sectionTitle}>Don&apos;t:</Text>
        </View>

        <View style={styles.guidelinesList}>
          <GuidelineItem
            text="Use profanity or offensive language"
            severity="high"
          />
          <GuidelineItem
            text="Share contact information or external links (email, phone, social media)"
            severity="high"
          />
          <GuidelineItem
            text="Post misleading photos or descriptions"
            severity="high"
          />
          <GuidelineItem
            text="List counterfeit, replica, or fake items"
            severity="high"
          />
          <GuidelineItem
            text="Use stock photos or images from other websites"
            severity="medium"
          />
          <GuidelineItem
            text="Harass, threaten, or intimidate other users"
            severity="high"
          />
          <GuidelineItem
            text="Manipulate prices or solicit off-platform payments"
            severity="high"
          />
          <GuidelineItem
            text="Use high-pressure sales tactics"
            severity="medium"
          />
        </View>
      </View>

      {/* Prohibited Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🚫</Text>
          <Text style={styles.sectionTitle}>Prohibited Items:</Text>
        </View>

        <View style={styles.guidelinesList}>
          <GuidelineItem text="Counterfeit or replica jewelry" />
          <GuidelineItem text="Stolen items" />
          <GuidelineItem text="Items with false authentication claims" />
          <GuidelineItem text="Blood diamonds or conflict minerals" />
          <GuidelineItem text="Items that are not jewelry, watches, or diamonds" />
        </View>
      </View>

      {/* Consequences */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>⚖️</Text>
          <Text style={styles.sectionTitle}>Consequences:</Text>
        </View>

        <View style={styles.consequencesList}>
          <ConsequenceItem
            offense="First Offense"
            consequence="⚠️ Warning + Listing Removed"
            description="Your listing will be taken down and you'll receive an explanation"
          />
          <ConsequenceItem
            offense="Second Offense"
            consequence="🔒 7-Day Suspension"
            description="Your account will be suspended for 7 days. Cannot list or bid."
          />
          <ConsequenceItem
            offense="Third Offense"
            consequence="🚫 Permanent Ban"
            description="Your account will be permanently banned from BidGoat"
          />
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>📋 Note:</Text>
          <Text style={styles.noteText}>
            Severe violations (counterfeit items, threats, fraud) may result in immediate permanent ban.
          </Text>
        </View>
      </View>

      {/* New Seller Review */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>👀</Text>
          <Text style={styles.sectionTitle}>New Seller Review:</Text>
        </View>

        <Text style={styles.bodyText}>
          To maintain marketplace quality, your first 5 listings will be manually reviewed by our team before going live.
          This typically takes 1-24 hours.
        </Text>

        <Text style={styles.bodyText}>
          Once you have 5 approved listings, your future listings will go live instantly (subject to automated moderation).
        </Text>
      </View>

      {/* Automated Moderation */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🤖</Text>
          <Text style={styles.sectionTitle}>Automated Moderation:</Text>
        </View>

        <Text style={styles.bodyText}>
          We use automated systems to check all listings for:
        </Text>

        <View style={styles.guidelinesList}>
          <GuidelineItem text="Inappropriate language" />
          <GuidelineItem text="Contact information in text or images" />
          <GuidelineItem text="Spam patterns" />
          <GuidelineItem text="Inappropriate images" />
          <GuidelineItem text="Stock photos or watermarks" />
          <GuidelineItem text="Counterfeit indicators" />
        </View>

        <Text style={styles.bodyText}>
          You&apos;ll get instant feedback while creating your listing, so you can fix issues before submitting.
        </Text>
      </View>

      {/* Report Issues */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🚩</Text>
          <Text style={styles.sectionTitle}>Report Violations:</Text>
        </View>

        <Text style={styles.bodyText}>
          See something that violates our guidelines? Report it!
        </Text>

        <Text style={styles.bodyText}>
          On any listing, tap the &quot;Report&quot; button and select the reason. Our team will review within 24 hours.
        </Text>

        <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
          <Text style={styles.reportButtonText}>📧 Contact Support</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for helping keep BidGoat safe and trustworthy! 🐐
        </Text>
        <Text style={styles.footerSubtext}>
          Last updated: December 2024
        </Text>
      </View>
      <View style={{ height: 40 }} />
    </Animated.ScrollView>
    </View>
  );
}

// Helper Components
interface GuidelineItemProps {
  text: string;
  severity?: 'low' | 'medium' | 'high';
}

function GuidelineItem({ text, severity }: Readonly<GuidelineItemProps>) {
  const getSeverityColor = () => {
    if (severity === 'high') return '#DC2626';
    if (severity === 'medium') return '#F59E0B';
    return '#6B7280';
  };

  return (
    <View style={styles.guidelineItem}>
      <Text style={styles.bullet}>•</Text>
      <Text style={[styles.guidelineText, { color: getSeverityColor() }]}>{text}</Text>
    </View>
  );
}

interface ConsequenceItemProps {
  offense: string;
  consequence: string;
  description: string;
}

function ConsequenceItem({ offense, consequence, description }: Readonly<ConsequenceItemProps>) {
  return (
    <View style={styles.consequenceItem}>
      <View style={styles.consequenceHeader}>
        <Text style={styles.offenseText}>{offense}</Text>
        <Text style={styles.consequenceText}>{consequence}</Text>
      </View>
      <Text style={styles.consequenceDescription}>{description}</Text>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 36,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 4,
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
    padding: 8,
  },

  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 210 : 210,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  guidelinesList: {
    marginLeft: 8,
  },
  guidelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 10,
  },
  bullet: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 10,
    lineHeight: 24,
  },
  guidelineText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  consequencesList: {
    marginTop: 8,
  },
  consequenceItem: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  consequenceHeader: {
    marginBottom: 8,
  },
  offenseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  consequenceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B45309',
  },
  consequenceDescription: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  noteBox: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  reportButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});

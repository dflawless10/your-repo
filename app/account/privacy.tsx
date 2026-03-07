import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Animated,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  show_bid_history: boolean;
  show_purchase_history: boolean;
  allow_messages: 'everyone' | 'verified' | 'none';
  search_engine_indexing: boolean;
  data_sharing_analytics: boolean;
  personalized_ads: boolean;
  activity_status: boolean;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    show_bid_history: true,
    show_purchase_history: false,
    allow_messages: 'everyone',
    search_engine_indexing: true,
    data_sharing_analytics: true,
    personalized_ads: true,
    activity_status: true,
  });

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrivacySettings();
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

  const loadPrivacySettings = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/privacy-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.log('Privacy settings endpoint not available yet, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/user/privacy-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Error updating privacy setting:', error);
    }
  };

  const handleDownloadData = async () => {
    Alert.alert(
      'Download Your Data',
      'We will email you a copy of your personal data within 48 hours. This includes your profile, bids, messages, and transaction history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Download',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              await fetch(`${API_BASE_URL}/api/user/request-data-download`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Your data download request has been submitted. Check your email within 48 hours.');
            } catch (error) {
              Alert.alert('Error', 'Failed to request data download. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderToggleSetting = (
    title: string,
    subtitle: string,
    key: keyof PrivacySettings,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={[styles.settingRow, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
      <View style={[styles.settingIcon, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF' }]}>
        <Ionicons name={icon} size={22} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>{subtitle}</Text>
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(value) => updateSetting(key, value)}
        trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
        thumbColor={settings[key] ? '#6A0DAD' : '#F3F4F6'}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
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
        {/* Page Header with Back Arrow */}
        <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Privacy Settings</Text>
        </Animated.View>
        {/* Privacy Policy Banner */}
        <TouchableOpacity
          style={styles.policyBanner}
          onPress={() => setShowPolicyModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6A0DAD', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.policyGradient}
          >
            <Ionicons name="document-text" size={28} color="#FFF" />
            <View style={styles.policyText}>
              <Text style={styles.policyTitle}>BidGoat Privacy Policy</Text>
              <Text style={styles.policySubtitle}>Tap to read our full privacy policy</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Profile Visibility</Text>

          <View style={[styles.optionsCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            {['public', 'private', 'friends'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionRow,
                  { borderBottomColor: theme === 'dark' ? '#2C2C2E' : '#F3F4F6' },
                  settings.profile_visibility === option && { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F3FF' },
                ]}
                onPress={() => updateSetting('profile_visibility', option)}
              >
                <Ionicons
                  name={settings.profile_visibility === option ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={settings.profile_visibility === option ? (theme === 'dark' ? '#B794F4' : '#6A0DAD') : '#999'}
                />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    {option === 'public' && '🌐 Public'}
                    {option === 'private' && '🔒 Private'}
                    {option === 'friends' && '👥 Friends Only'}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
                    {option === 'public' && 'Anyone can see your profile'}
                    {option === 'private' && 'Only you can see your profile'}
                    {option === 'friends' && 'Only verified connections'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Activity Privacy</Text>

          {renderToggleSetting(
            'Show Bid History',
            'Let others see items you\'ve bid on',
            'show_bid_history',
            'hammer-outline'
          )}

          {renderToggleSetting(
            'Show Purchase History',
            'Display your past purchases on profile',
            'show_purchase_history',
            'cart-outline'
          )}

          {renderToggleSetting(
            'Show Activity Status',
            'Let others see when you\'re online',
            'activity_status',
            'ellipse'
          )}
        </View>

        {/* Communication Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Who Can Message You</Text>

          <View style={[styles.optionsCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            {[
              { value: 'everyone', label: 'Everyone', subtitle: 'Anyone can send you messages' },
              { value: 'verified', label: 'Verified Users Only', subtitle: 'Only verified sellers' },
              { value: 'none', label: 'No One', subtitle: 'Disable all messages' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionRow,
                  { borderBottomColor: theme === 'dark' ? '#2C2C2E' : '#F3F4F6' },
                  settings.allow_messages === option.value && { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F3FF' },
                ]}
                onPress={() => updateSetting('allow_messages', option.value)}
              >
                <Ionicons
                  name={settings.allow_messages === option.value ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={settings.allow_messages === option.value ? (theme === 'dark' ? '#B794F4' : '#6A0DAD') : '#999'}
                />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>{option.label}</Text>
                  <Text style={[styles.optionSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>{option.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data & Privacy</Text>

          {renderToggleSetting(
            'Search Engine Indexing',
            'Allow search engines to index your public profile',
            'search_engine_indexing',
            'globe-outline'
          )}

          {renderToggleSetting(
            'Analytics Data Sharing',
            'Help improve BidGoat with anonymized usage data',
            'data_sharing_analytics',
            'analytics-outline'
          )}

          {renderToggleSetting(
            'Personalized Ads',
            'See relevant recommendations based on your activity',
            'personalized_ads',
            'bulb-outline'
          )}
        </View>

        {/* Data Rights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Data Rights</Text>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={handleDownloadData}
          >
            <Ionicons name="download-outline" size={22} color="#2196F3" />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Download Your Data</Text>
              <Text style={[styles.actionSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>Get a copy of your personal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => Alert.alert('Data Deletion', 'To delete your data, please delete your account from Account Settings → Delete Account.')}
          >
            <Ionicons name="trash-outline" size={22} color="#DC2626" />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Delete Your Data</Text>
              <Text style={[styles.actionSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>Permanently remove all your information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>
        </View>

        {/* Privacy Statement */}
        <View style={[styles.statementCard, {
          backgroundColor: theme === 'dark' ? '#1C2C1E' : '#F0FDF4',
          borderColor: theme === 'dark' ? '#2C4F2E' : '#86EFAC'
        }]}>
          <Text style={[styles.statementTitle, { color: theme === 'dark' ? '#86EFAC' : '#166534' }]}>🛡️ Our Commitment</Text>
          <Text style={[styles.statementText, { color: theme === 'dark' ? '#A7F3D0' : '#166534' }]}>
            BidGoat takes your privacy seriously. We never sell your personal data to third parties and use industry-standard encryption to protect your information.
          </Text>
          <TouchableOpacity onPress={() => setShowPolicyModal(true)} style={styles.learnMoreButton}>
            <Text style={[styles.learnMoreText, { color: theme === 'dark' ? '#6EE7B7' : '#059669' }]}>Learn more about our privacy practices →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPolicyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5EA' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setShowPolicyModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.policyHeader, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>BidGoat Privacy Policy</Text>
            <Text style={[styles.policyDate, { color: theme === 'dark' ? '#999' : '#999' }]}>Effective Date: December 24, 2025</Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>Our Commitment to Your Privacy</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              At BidGoat, we believe that your privacy is a fundamental right. We are committed to protecting your personal information and being transparent about how we collect, use, and safeguard your data.
            </Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>1. Information We Collect</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              • Account Information: Username, email, password (encrypted){'\n'}
              • Profile Information: Display name, avatar, bio{'\n'}
              • Transaction Data: Bid history, purchase history{'\n'}
              • Usage Data: Pages viewed, search queries, favorites{'\n'}
              • Device Information: IP address, browser type
            </Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>2. How We Use Your Information</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              • Provide and improve our services{'\n'}
              • Process transactions and auctions{'\n'}
              • Send notifications about bids and messages{'\n'}
              • Prevent fraud and abuse{'\n'}
              • Comply with legal obligations
            </Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>3. We NEVER Sell Your Data</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              BidGoat will never sell, rent, or trade your personal information to third parties for their marketing purposes. Period.
            </Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>4. Your Privacy Rights</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              • Access: Request a copy of your personal data{'\n'}
              • Correction: Update or correct inaccurate information{'\n'}
              • Deletion: Request deletion of your account and data{'\n'}
              • Portability: Download your data in a standard format{'\n'}
              • Opt-Out: Unsubscribe from marketing emails
            </Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>5. Data Security</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              • All data transmitted over HTTPS/TLS encryption{'\n'}
              • Passwords hashed with bcrypt algorithm{'\n'}
              • PCI-DSS compliant payment processing{'\n'}
              • Regular security audits and monitoring{'\n'}
              • Strict employee access controls
            </Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>6. Children&#39;s Privacy</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              BidGoat is not intended for users under 18 years old. We do not knowingly collect information from children.
            </Text>

            <Text style={[styles.policySectionTitle, { color: colors.textPrimary }]}>7. Contact Us</Text>
            <Text style={[styles.policyBody, { color: theme === 'dark' ? '#999' : '#4B5563' }]}>
              For privacy questions or concerns:{'\n\n'}
              Email: privacy@bidgoat.com{'\n'}
              Data Protection Officer: dpo@bidgoat.com{'\n\n'}
              Response Time: 7 business days
            </Text>

            <Text style={[styles.policyFooter, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
              By using BidGoat, you acknowledge that you have read and understood this Privacy Policy.
            </Text>

            <Text style={[styles.policyCopyright, { color: theme === 'dark' ? '#666' : '#9CA3AF' }]}>
              © 2025 BidGoat. All rights reserved.
            </Text>

            <View style={{ height: 80 }} />
          </ScrollView>
        </View>
      </Modal>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
  },
  policyBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  policyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  policyText: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  policySubtitle: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  optionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionRowSelected: {
    backgroundColor: '#F5F3FF',
  },
  optionContent: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  statementCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  statementText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 22,
    marginBottom: 12,
  },
  learnMoreButton: {
    marginTop: 4,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  policyHeader: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  policyDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  policySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  policyBody: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  policyFooter: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 32,
    marginBottom: 16,
    lineHeight: 22,
  },
  policyCopyright: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
});

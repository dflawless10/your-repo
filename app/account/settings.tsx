import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';
import { useTranslation } from '@/app/i18n/useTranslation';

interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  bid_notifications: boolean;
  outbid_notifications: boolean;
  auction_ending_notifications: boolean;
  marketing_emails: boolean;
  newsletter: boolean;
  suggest_account_to_contacts: boolean;
  contact_sync_enabled: boolean;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { t, language, changeLanguage: changeI18nLanguage } = useTranslation();
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    bid_notifications: true,
    outbid_notifications: true,
    auction_ending_notifications: true,
    marketing_emails: false,
    newsletter: false,
    suggest_account_to_contacts: false,
    contact_sync_enabled: false,
  });

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Fade in header title and arrow
  useEffect(() => {
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

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const storedEmail = await AsyncStorage.getItem('email');
      const storedUsername = await AsyncStorage.getItem('username');
      const storedLanguage = await AsyncStorage.getItem('preferredLanguage');

      if (storedEmail) setEmail(storedEmail);
      if (storedUsername) setUsername(storedUsername);
      if (storedLanguage) setSelectedLanguage(storedLanguage);

      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user settings from backend
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings || settings);
          if (data.preferredLanguage) {
            setSelectedLanguage(data.preferredLanguage);
          }
        }
      } catch (e) {
        console.log('Settings endpoint not available yet, using defaults');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      // Save to backend
      await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const updateLanguage = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      setShowLanguagePicker(false);

      // Update i18n language
      await changeI18nLanguage(languageCode as any);

      // Save to AsyncStorage
      await AsyncStorage.setItem('preferredLanguage', languageCode);

      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      // Save to backend
      await fetch(`${API_BASE_URL}/api/user/language`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: languageCode }),
      });

      Alert.alert(
        'Language Updated',
        'Your preferred language has been saved. Full language support coming soon!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your listings, bids, and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const response = await fetch(`${API_BASE_URL}/api/user/delete-account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                await AsyncStorage.multiRemove(['jwtToken', 'username', 'email', 'avatar_url']);
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                router.replace('/sign-in');
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(['username', 'jwtToken', 'email', 'avatar_url']);
    router.replace('/sign-in');
  };

  const renderSettingRow = (
    title: string,
    subtitle: string,
    key: keyof UserSettings,
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
        value={settings[key]}
        onValueChange={(value) => updateSetting(key, value)}
        trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
        thumbColor={settings[key] ? '#6A0DAD' : '#F3F4F6'}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Title with Back Button */}
        <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('accountInformation')}</Text>
        </Animated.View>

        {/* Account Info Section */}
        <View style={styles.section}>

          <View style={[styles.infoCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={theme === 'dark' ? '#999' : '#666'} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme === 'dark' ? '#999' : '#999' }]}>Username</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{username || 'Not set'}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={theme === 'dark' ? '#999' : '#666'} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme === 'dark' ? '#999' : '#999' }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{email || 'Not set'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferences</Text>

          <TouchableOpacity
            style={[styles.languageRow, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <View style={[styles.languageIcon, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF' }]}>
              <Ionicons name="language-outline" size={22} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            </View>
            <View style={styles.languageContent}>
              <Text style={[styles.languageTitle, { color: colors.textPrimary }]}>{t('preferredLanguage')}</Text>
              <Text style={[styles.languageSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>{t('chooseLanguage')}</Text>
            </View>
            <View style={styles.selectedLanguage}>
              <Text style={styles.languageFlag}>
                {languages.find(lang => lang.code === selectedLanguage)?.flag}
              </Text>
              <Text style={[styles.languageName, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
                {languages.find(lang => lang.code === selectedLanguage)?.name}
              </Text>
              <Ionicons
                name={showLanguagePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme === 'dark' ? '#999' : '#999'}
              />
            </View>
          </TouchableOpacity>

          {showLanguagePicker && (
            <View style={[styles.languagePicker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === language.code && [styles.languageOptionSelected, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF' }],
                  ]}
                  onPress={() => updateLanguage(language.code)}
                >
                  <Text style={styles.languageOptionFlag}>{language.flag}</Text>
                  <Text
                    style={[
                      styles.languageOptionName,
                      { color: colors.textPrimary },
                      selectedLanguage === language.code && styles.languageOptionNameSelected,
                      selectedLanguage === language.code && { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' },
                    ]}
                  >
                    {language.name}
                  </Text>
                  {selectedLanguage === language.code && (
                    <Ionicons name="checkmark-circle" size={22} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Privacy & Discoverability Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Privacy & Discoverability</Text>

          <View style={[styles.settingRow, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF' }]}>
              <Ionicons name="people-outline" size={22} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Suggest account to others</Text>
              <Text style={[styles.settingSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
                BidGoat will suggest your account to your contacts.{'\n'}
                This will be active once you sync your contacts.
              </Text>
            </View>
            <Switch
              value={settings.suggest_account_to_contacts}
              onValueChange={(value) => updateSetting('suggest_account_to_contacts', value)}
              trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
              thumbColor={settings.suggest_account_to_contacts ? '#6A0DAD' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>

          {settings.suggest_account_to_contacts && (
            <>
              <View style={[styles.infoBox, { backgroundColor: theme === 'dark' ? '#2C2416' : '#F0F4FF', borderColor: theme === 'dark' ? '#4A3A1E' : '#D1D5F0' }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme === 'dark' ? '#FFD700' : '#6A0DAD'} />
                <Text style={[styles.infoBoxText, { color: theme === 'dark' ? '#FFD700' : '#5B21B6' }]}>
                  Your phone contacts will be periodically synced to help you find and get discovered by people you know.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.syncContactsButton, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF', borderColor: theme === 'dark' ? '#3C3C3E' : '#D1D5F0' }]}
                onPress={async () => {
                  // TODO: Implement contact sync functionality
                  Alert.alert(
                    'Sync Contacts',
                    'Contact sync will be enabled in a future update. Your account will be suggested to your contacts once this feature is available.',
                    [{ text: 'Got it' }]
                  );
                }}
              >
                <Ionicons name="sync-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                <Text style={[styles.syncContactsText, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
                  {settings.contact_sync_enabled ? 'Contacts Synced' : 'Sync Your Contacts'}
                </Text>
                {settings.contact_sync_enabled && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notifications</Text>

          {renderSettingRow(
            'Push Notifications',
            'Receive notifications on your device',
            'push_notifications',
            'notifications-outline'
          )}

          {renderSettingRow(
            'Email Notifications',
            'Receive updates via email',
            'email_notifications',
            'mail-outline'
          )}

          {renderSettingRow(
            'Bid Alerts & Received Offers',
            'Get notified when you receive bids & offers',
            'bid_notifications',
            'hammer-outline'
          )}

          {renderSettingRow(
            'Outbid Alerts & Sent offers',
            'Get notified when you\'re outbid & Offers not accepted',
            'outbid_notifications',
            'alert-circle-outline'
          )}

          {renderSettingRow(
            'Auction Ending',
            'Reminders for ending auctions',
            'auction_ending_notifications',
            'time-outline'
          )}
        </View>

        {/* Marketing Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Marketing & Communications</Text>

          {renderSettingRow(
            'Marketing Emails',
            'Receive promotional offers',
            'marketing_emails',
            'pricetag-outline'
          )}

          {renderSettingRow(
            'Newsletter',
            'Weekly digest of new items',
            'newsletter',
            'newspaper-outline'
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Actions</Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => router.push('/account/privacy' as any)}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => router.push('/settings/seller-policies' as any)}
          >
            <Ionicons name="document-text-outline" size={22} color={theme === 'dark' ? '#B794F4' : '#8B5CF6'} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Seller Policies</Text>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => router.push('legal/security-account-integrity' as any)}
          >
            <Ionicons name="document-lock-outline" size={22} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Legal Center</Text>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => router.push('/account/payment-methods' as any)}
          >
            <Ionicons name="card-outline" size={22} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={22} color="#F59E0B" />
            <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Danger Zone</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={22} color="#DC2626" />
            <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
              Delete Account
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
          </TouchableOpacity>

          <Text style={[styles.dangerText, { color: theme === 'dark' ? '#999' : '#666' }]}>
            Once you delete your account, there is no going back. Please be certain.
          </Text>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.versionText, { color: theme === 'dark' ? '#999' : '#999' }]}>BidGoat v1.0.0</Text>
          <Text style={[styles.copyrightText, { color: theme === 'dark' ? '#666' : '#CCC' }]}>© 2024 BidGoat. All rights reserved.</Text>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
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
  actionButton: {
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
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  dangerText: {
    fontSize: 13,
    color: '#DC2626',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  copyrightText: {
    fontSize: 12,
    color: '#CCC',
    textAlign: 'center',
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F4FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1D5F0',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#5B21B6',
    fontWeight: '500',
  },
  syncContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5F0',
  },
  syncContactsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  languageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  languageContent: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  languageSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  selectedLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  languagePicker: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  languageOptionSelected: {
    backgroundColor: '#F0F4FF',
  },
  languageOptionFlag: {
    fontSize: 24,
  },
  languageOptionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  languageOptionNameSelected: {
    fontWeight: '700',
    color: '#6A0DAD',
  },
});

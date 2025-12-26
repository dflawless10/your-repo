import React, { useState, useEffect } from 'react';
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
import EnhancedHeader from '../components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";

interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  bid_notifications: boolean;
  outbid_notifications: boolean;
  auction_ending_notifications: boolean;
  marketing_emails: boolean;
  newsletter: boolean;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const scrollY = new Animated.Value(0);

  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    bid_notifications: true,
    outbid_notifications: true,
    auction_ending_notifications: true,
    marketing_emails: false,
    newsletter: false,
  });

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const storedEmail = await AsyncStorage.getItem('email');
      const storedUsername = await AsyncStorage.getItem('username');

      if (storedEmail) setEmail(storedEmail);
      if (storedUsername) setUsername(storedUsername);

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
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#6A0DAD" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
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
    <View style={styles.container}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{username || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email || 'Not set'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

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
          <Text style={styles.sectionTitle}>Marketing & Communications</Text>

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
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/account/privacy' as any)}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#6A0DAD" />
            <Text style={styles.actionButtonText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/account/payment-methods' as any)}
          >
            <Ionicons name="card-outline" size={22} color="#6A0DAD" />
            <Text style={styles.actionButtonText}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color="#F59E0B" />
            <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Danger Zone</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={22} color="#DC2626" />
            <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
              Delete Account
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <Text style={styles.dangerText}>
            Once you delete your account, there is no going back. Please be certain.
          </Text>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.versionText}>BidGoat v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 BidGoat. All rights reserved.</Text>
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
    paddingTop: Platform.OS === 'ios' ? 170 : 170,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
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
});

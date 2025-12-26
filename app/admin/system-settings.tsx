import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalFooter from "@/app/components/GlobalFooter";

interface Settings {
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  min_bid_increment: number;
  max_item_images: number;
  auction_extension_minutes: number;
  featured_item_cost: number;
}

export default function SystemSettingsScreen() {
  const router = useRouter();
  const scrollY = new Animated.Value(0);

  const [settings, setSettings] = useState<Settings>({
    maintenance_mode: false,
    allow_new_registrations: true,
    min_bid_increment: 1.00,
    max_item_images: 10,
    auction_extension_minutes: 5,
    featured_item_cost: 9.99,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key: keyof Settings, value: any) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        setSettings({ ...settings, [key]: value });
        Alert.alert('Success', 'Setting updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const SettingRow = ({ title, subtitle, children }: any) => (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>System Settings</Text>
        </View>
        <LinearGradient
          colors={['#607D8B', '#455A64']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.warningBanner}
        >
          <Ionicons name="warning" size={24} color="#FFF" />
          <Text style={styles.warningText}>
            Changes to system settings affect all users. Use caution.
          </Text>
        </LinearGradient>

        {/* Platform Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform</Text>

          <SettingRow
            title="Maintenance Mode"
            subtitle="Disable site for maintenance"
          >
            <Switch
              value={settings.maintenance_mode}
              onValueChange={(value) => updateSetting('maintenance_mode', value)}
              trackColor={{ false: '#ccc', true: '#6A0DAD' }}
            />
          </SettingRow>

          <SettingRow
            title="New Registrations"
            subtitle="Allow new users to register"
          >
            <Switch
              value={settings.allow_new_registrations}
              onValueChange={(value) => updateSetting('allow_new_registrations', value)}
              trackColor={{ false: '#ccc', true: '#6A0DAD' }}
            />
          </SettingRow>
        </View>

        {/* Auction Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auction Rules</Text>

          <SettingRow
            title="Min Bid Increment"
            subtitle="Minimum amount to increase bid"
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={styles.input}
                value={settings.min_bid_increment.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setSettings({ ...settings, min_bid_increment: value });
                }}
                onBlur={() => updateSetting('min_bid_increment', settings.min_bid_increment)}
                keyboardType="decimal-pad"
              />
            </View>
          </SettingRow>

          <SettingRow
            title="Extension Time"
            subtitle="Minutes to extend auction on late bids"
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={settings.auction_extension_minutes.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setSettings({ ...settings, auction_extension_minutes: value });
                }}
                onBlur={() => updateSetting('auction_extension_minutes', settings.auction_extension_minutes)}
                keyboardType="number-pad"
              />
              <Text style={styles.inputSuffix}>min</Text>
            </View>
          </SettingRow>
        </View>

        {/* Item Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Settings</Text>

          <SettingRow
            title="Max Images Per Item"
            subtitle="Maximum photos sellers can upload"
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={settings.max_item_images.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 1;
                  setSettings({ ...settings, max_item_images: value });
                }}
                onBlur={() => updateSetting('max_item_images', settings.max_item_images)}
                keyboardType="number-pad"
              />
            </View>
          </SettingRow>

          <SettingRow
            title="Featured Item Cost"
            subtitle="Price to feature an item"
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={styles.input}
                value={settings.featured_item_cost.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setSettings({ ...settings, featured_item_cost: value });
                }}
                onBlur={() => updateSetting('featured_item_cost', settings.featured_item_cost)}
                keyboardType="decimal-pad"
              />
            </View>
          </SettingRow>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: '#F44336' }]}>Danger Zone</Text>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => router.push('/cleanup-expired' as any)}
          >
            <Ionicons name="trash" size={20} color="#F44336" />
            <Text style={styles.dangerButtonText}>Clean Up Expired Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => Alert.alert('Coming Soon', 'Database backup feature')}
          >
            <Ionicons name="save" size={20} color="#F44336" />
            <Text style={styles.dangerButtonText}>Backup Database</Text>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  backButton: { marginRight: 12, padding: 4 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dangerSection: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingText: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  settingSubtitle: { fontSize: 13, color: '#666' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    minWidth: 100,
  },
  input: {
    padding: 8,
    fontSize: 16,
    color: '#1A1A1A',
    minWidth: 60,
    textAlign: 'right',
  },
  inputPrefix: { fontSize: 16, color: '#666', marginRight: 4 },
  inputSuffix: { fontSize: 14, color: '#666', marginLeft: 4 },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEBEE',
    gap: 12,
  },
  dangerButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
});

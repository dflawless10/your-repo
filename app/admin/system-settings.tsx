import React, { useState, useEffect, useRef } from 'react';
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
import { useTheme } from '@/app/theme/ThemeContext';

interface Settings {
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  max_item_images: number;
  auction_extension_minutes: number;
  featured_item_cost: number;
}

export default function SystemSettingsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [settings, setSettings] = useState<Settings>({
    maintenance_mode: false,
    allow_new_registrations: true,
    max_item_images: 10,
    auction_extension_minutes: 5,
    featured_item_cost: 9.99,
  });

  useEffect(() => {
    loadSettings();
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
    <View style={[styles.settingRow, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.pageHeader, { backgroundColor: colors.surface, opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={isDark ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>System Settings</Text>
        </Animated.View>
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
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Platform</Text>

          <SettingRow
            title="Maintenance Mode"
            subtitle="Disable site for maintenance"
          >
            <Switch
              value={settings.maintenance_mode}
              onValueChange={(value) => updateSetting('maintenance_mode', value)}
              thumbColor={settings.maintenance_mode ? '#6A0DAD' : '#F3F4F6'}
              trackColor={{ false: isDark ? '#555' : '#ccc', true: '#A78BFA' }}
            />
          </SettingRow>

          <SettingRow
            title="New Registrations"
            subtitle="Allow new users to register"
          >
            <Switch
              value={settings.allow_new_registrations}
              onValueChange={(value) => updateSetting('allow_new_registrations', value)}
              thumbColor={settings.allow_new_registrations ? '#6A0DAD' : '#F3F4F6'}
              trackColor={{ false: isDark ? '#555' : '#ccc', true: '#A78BFA' }}
            />
          </SettingRow>
        </View>

        {/* Auction Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Auction Rules</Text>

          <View style={[styles.infoBox, { backgroundColor: isDark ? '#1a1a2e' : '#F3E5F5' }]}>
            <Ionicons name="information-circle" size={20} color="#6A0DAD" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Tiered Bid Increments (Fixed)</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                BidGoat uses industry-standard tiered increments:{'\n'}
                Under $100: $5 • $100-$499: $25 • $500-$999: $50{'\n'}
                $1K-$4.9K: $100 • $5K-$9.9K: $250 • $10K-$24.9K: $500{'\n'}
                $25K+: $1,000
              </Text>
            </View>
          </View>

          <SettingRow
            title="Extension Time"
            subtitle="Minutes to extend auction on late bids"
          >
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5' }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={settings.auction_extension_minutes.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setSettings({ ...settings, auction_extension_minutes: value });
                }}
                onBlur={() => updateSetting('auction_extension_minutes', settings.auction_extension_minutes)}
                keyboardType="number-pad"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
              <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>min</Text>
            </View>
          </SettingRow>
        </View>

        {/* Item Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Item Settings</Text>

          <SettingRow
            title="Max Images Per Item"
            subtitle="Maximum photos sellers can upload"
          >
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5' }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={settings.max_item_images.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 1;
                  setSettings({ ...settings, max_item_images: value });
                }}
                onBlur={() => updateSetting('max_item_images', settings.max_item_images)}
                keyboardType="number-pad"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>
          </SettingRow>

          <SettingRow
            title="Featured Item Cost"
            subtitle="Price to feature an item"
          >
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5' }]}>
              <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={settings.featured_item_cost.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setSettings({ ...settings, featured_item_cost: value });
                }}
                onBlur={() => updateSetting('featured_item_cost', settings.featured_item_cost)}
                keyboardType="decimal-pad"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>
          </SettingRow>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: '#F44336' }]}>Danger Zone</Text>

          <TouchableOpacity
            style={[styles.dangerButton, { borderBottomColor: isDark ? '#331111' : '#FFEBEE' }]}
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
  pageTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#6A0DAD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  infoTextContainer: { flex: 1 },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A0DAD',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
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

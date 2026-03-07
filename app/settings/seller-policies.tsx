import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/config';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';

type ReturnPolicy = 'no_returns' | '7_days' | '14_days' | '30_days';

interface PolicyOption {
  value: ReturnPolicy;
  label: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

const POLICY_OPTIONS: PolicyOption[] = [
  {
    value: 'no_returns',
    label: 'No Returns (Final Sale)',
    description: 'Items sold as-is. Only platform protections apply.',
    icon: 'close-circle',
  },
  {
    value: '7_days',
    label: '7-Day Returns',
    description: 'Fast-moving inventory. Buyer pays return shipping.',
    icon: 'time',
  },
  {
    value: '14_days',
    label: '14-Day Returns',
    description: 'Standard return window. Great for most items.',
    icon: 'calendar',
    recommended: true,
  },
  {
    value: '30_days',
    label: '30-Day Returns',
    description: 'Extended window builds buyer confidence.',
    icon: 'calendar-outline',
  },
];

export default function SellerPoliciesScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seller policy state
  const [returnPolicy, setReturnPolicy] = useState<ReturnPolicy>('14_days');
  const [buyerPaysReturnShipping, setBuyerPaysReturnShipping] = useState(true);
  const [restockingFeePercent, setRestockingFeePercent] = useState(0);
  const [authenticityGuarantee, setAuthenticityGuarantee] = useState(false);
  const [shippingPolicy, setShippingPolicy] = useState('Ships within 3 business days');

  useEffect(() => {
    loadSellerPolicies();
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

  const loadSellerPolicies = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${API_BASE_URL}/api/seller/policies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.policies) {
          setReturnPolicy(data.policies.return_policy || '14_days');
          setBuyerPaysReturnShipping(data.policies.buyer_pays_return_shipping ?? true);
          setRestockingFeePercent(data.policies.restocking_fee_percent || 0);
          setAuthenticityGuarantee(data.policies.authenticity_guarantee || false);
          setShippingPolicy(data.policies.shipping_policy || 'Ships within 3 business days');
        }
      }
    } catch (error) {
      console.error('Error loading seller policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const response = await fetch(`${API_BASE_URL}/api/seller/policies`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_policy: returnPolicy,
          buyer_pays_return_shipping: buyerPaysReturnShipping,
          restocking_fee_percent: restockingFeePercent,
          authenticity_guarantee: authenticityGuarantee,
          shipping_policy: shippingPolicy,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Policies Updated!',
          'Your seller policies have been saved. They will appear on all your listings.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const errorData = await response.text();
        console.error('Save policies error:', response.status, errorData);
        Alert.alert(
          'Error',
          `Failed to save policies (Status: ${response.status}). ${errorData}. Please check backend logs.`
        );
      }
    } catch (error) {
      console.error('Error saving seller policies:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getReturnWindowDays = (): number => {
    switch (returnPolicy) {
      case '7_days': return 7;
      case '14_days': return 14;
      case '30_days': return 30;
      default: return 0;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 100, backgroundColor: colors.background }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Header with Back Arrow */}
        <Animated.View style={[styles.pageHeader, {
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
          backgroundColor: colors.background,
          borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5'
        }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#8B5CF6'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Seller Policies</Text>
        </Animated.View>
        {/* Info Banner */}
        <View style={[styles.infoBanner, {
          backgroundColor: theme === 'dark' ? '#1C1C2E' : '#F5F3FF',
          borderColor: theme === 'dark' ? '#3730A3' : '#8B5CF6'
        }]}>
          <Ionicons name="information-circle" size={20} color={theme === 'dark' ? '#B794F4' : '#8B5CF6'} />
          <Text style={[styles.infoBannerText, { color: theme === 'dark' ? '#C4B5FD' : '#5B21B6' }]}>
            Your policies appear on your seller profile and every listing. Choose policies that build buyer trust while protecting your business.
          </Text>
        </View>

        {/* Return Policy Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Return Policy</Text>
        <Text style={[styles.sectionDescription, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
          Choose how long buyers have to return items. Platform protections always apply (counterfeit, not as described).
        </Text>

        {POLICY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.policyCard,
              { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' },
              returnPolicy === option.value && {
                backgroundColor: theme === 'dark' ? '#2C2C3E' : '#F5F3FF',
                borderColor: theme === 'dark' ? '#B794F4' : '#8B5CF6'
              },
            ]}
            onPress={() => setReturnPolicy(option.value)}
          >
            <View style={styles.policyHeader}>
              <View style={[styles.policyIconContainer, {
                backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F3F4F6'
              }]}>
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={returnPolicy === option.value ? (theme === 'dark' ? '#B794F4' : '#8B5CF6') : '#6B7280'}
                />
              </View>
              <View style={styles.policyContent}>
                <View style={styles.policyTitleRow}>
                  <Text
                    style={[
                      styles.policyLabel,
                      { color: colors.textPrimary },
                      returnPolicy === option.value && { color: theme === 'dark' ? '#B794F4' : '#8B5CF6' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.recommended && (
                    <View style={[styles.recommendedBadge, {
                      backgroundColor: theme === 'dark' ? '#3730A3' : '#DBEAFE'
                    }]}>
                      <Text style={[styles.recommendedText, {
                        color: theme === 'dark' ? '#93C5FD' : '#1E40AF'
                      }]}>Recommended</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.policyDescription, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
                  {option.description}
                </Text>
              </View>
              <View style={[styles.radioButton, { borderColor: theme === 'dark' ? '#555' : '#D1D5DB' }]}>
                {returnPolicy === option.value && (
                  <View style={[styles.radioButtonInner, { backgroundColor: theme === 'dark' ? '#B794F4' : '#8B5CF6' }]} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Return Shipping Section */}
        {returnPolicy !== 'no_returns' && (
          <View style={[styles.optionCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.optionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Return Shipping Cost</Text>
                <Text style={[styles.optionDescription, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
                  Who pays for return shipping on buyer's remorse returns?
                </Text>
              </View>
              <Switch
                value={!buyerPaysReturnShipping}
                onValueChange={(value) => setBuyerPaysReturnShipping(!value)}
                trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={[styles.shippingCostPreview, {
              backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB'
            }]}>
              <Text style={[styles.shippingCostText, { color: theme === 'dark' ? '#C4B5FD' : '#6B7280' }]}>
                {buyerPaysReturnShipping
                  ? '💰 Buyer pays return shipping'
                  : '📦 You pay return shipping (builds more trust)'}
              </Text>
            </View>
          </View>
        )}

        {/* Restocking Fee Section */}
        {returnPolicy !== 'no_returns' && (
          <View style={[styles.optionCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.optionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  Restocking Fee: {restockingFeePercent}%
                </Text>
                <Text style={[styles.optionDescription, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
                  Charge up to 20% for buyer's remorse returns (not for items not as described)
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={20}
                step={5}
                value={restockingFeePercent}
                onValueChange={setRestockingFeePercent}
                minimumTrackTintColor="#F97316"
                maximumTrackTintColor={theme === 'dark' ? '#3C3C3E' : '#E5E7EB'}
                thumbTintColor="#8B5CF6"
              />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>0%</Text>
              <Text style={[styles.sliderLabel, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>5%</Text>
              <Text style={[styles.sliderLabel, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>10%</Text>
              <Text style={[styles.sliderLabel, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>15%</Text>
              <Text style={[styles.sliderLabel, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>20%</Text>
            </View>
          </View>
        )}

        {/* Authenticity Guarantee Section */}
        <View style={[styles.optionCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <View style={styles.optionHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.authenticityStar}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Authenticity Guarantee</Text>
              </View>
              <Text style={[styles.optionDescription, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
                Guarantee all items are 100% authentic. Builds massive trust for luxury items.
              </Text>
            </View>
            <Switch
              value={authenticityGuarantee}
              onValueChange={setAuthenticityGuarantee}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>
          {authenticityGuarantee && (
            <View style={[styles.authenticityBadgePreview, {
              backgroundColor: theme === 'dark' ? '#1C2E1E' : '#ECFDF5'
            }]}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={[styles.authenticityBadgeText, { color: theme === 'dark' ? '#86EFAC' : '#059669' }]}>
                Authenticity Guaranteed
              </Text>
            </View>
          )}
        </View>

        {/* Shipping Policy Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Policy</Text>
        <Text style={[styles.sectionDescription, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
          Tell buyers when you typically ship items
        </Text>

        <View style={[styles.inputWrapper, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <Ionicons name="cube-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#8B5CF6'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="e.g., Ships within 3 business days"
            placeholderTextColor={theme === 'dark' ? '#666' : '#9CA3AF'}
            value={shippingPolicy}
            onChangeText={setShippingPolicy}
            multiline
          />
        </View>

        {/* Policy Preview */}
        <View style={[styles.previewCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>How This Appears to Buyers</Text>
          <View style={[styles.previewContent, {
            backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB'
          }]}>
            <View style={styles.previewRow}>
              <Ionicons name="refresh" size={18} color={theme === 'dark' ? '#B794F4' : '#8B5CF6'} />
              <Text style={[styles.previewText, { color: colors.textPrimary }]}>
                {POLICY_OPTIONS.find(p => p.value === returnPolicy)?.label}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Ionicons name="cube" size={18} color="#FF6B35" />
              <Text style={[styles.previewText, { color: colors.textPrimary }]}>{shippingPolicy}</Text>
            </View>
            {authenticityGuarantee && (
              <View style={styles.previewRow}>
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                <Text style={[styles.previewText, { color: colors.textPrimary }]}>Authenticity Guaranteed</Text>
              </View>
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={saving ? ['#9CA3AF', '#9CA3AF'] : ['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Policies</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Help Text */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.push('/legal/terms')}
        >
          <Ionicons name="book-outline" size={18} color="#8B5CF6" />
          <Text style={styles.helpButtonText}>View Full Return Policy Framework</Text>
        </TouchableOpacity>
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
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#6B21A8',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  policyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  policyCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F9FAFB',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  policyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyContent: {
    flex: 1,
  },
  policyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  policyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  policyLabelSelected: {
    color: '#8B5CF6',
  },
  recommendedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  policyDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  optionNote: {
    fontSize: 13,
    color: '#8B5CF6',
    marginTop: 12,
    fontWeight: '500',
  },
  shippingCostPreview: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  shippingCostText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  sliderContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  slider: {
    width: '100%',
    height: 50,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  authenticityStar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  authenticityBadgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  authenticityBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  previewCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFEDD5',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EA580C',
    marginBottom: 12,
  },
  previewContent: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewText: {
    fontSize: 14,
    color: '#9A3412',
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
});

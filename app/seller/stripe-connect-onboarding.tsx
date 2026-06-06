import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/theme/ThemeContext';
import { API_BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingStatus {
  status: 'not_started' | 'pending' | 'active' | 'restricted';
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements?: any;
}

export default function StripeConnectOnboardingScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [startingOnboarding, setStartingOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/stripe-connect/onboarding/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setOnboardingStatus(data);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      Alert.alert('Error', 'Failed to check onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setStartingOnboarding(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const response = await fetch(`${API_BASE_URL}/api/stripe-connect/onboarding/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding');
      }

      // Open Stripe onboarding in browser
      const supported = await Linking.canOpenURL(data.url);
      if (supported) {
        await Linking.openURL(data.url);
      } else {
        Alert.alert('Error', 'Cannot open Stripe onboarding link');
      }

    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      Alert.alert('Error', error.message || 'Failed to start onboarding');
    } finally {
      setStartingOnboarding(false);
    }
  };

  const renderStatusBadge = () => {
    if (!onboardingStatus) return null;

    let badgeColor = '#FFA500';
    let badgeText = 'Pending';
    let iconName: any = 'time-outline';

    if (onboardingStatus.status === 'active' && onboardingStatus.payouts_enabled) {
      badgeColor = '#48BB78';
      badgeText = 'Active';
      iconName = 'checkmark-circle';
    } else if (onboardingStatus.status === 'not_started') {
      badgeColor = '#E53E3E';
      badgeText = 'Not Started';
      iconName = 'alert-circle-outline';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: badgeColor + '20' }]}>
        <Ionicons name={iconName} size={20} color={badgeColor} />
        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    card: {
      backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 16,
      gap: 6,
    },
    statusBadgeText: {
      fontSize: 14,
      fontWeight: '600',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 20,
    },
    featureList: {
      gap: 12,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    featureIcon: {
      marginTop: 2,
    },
    featureText: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    buttonContainer: {
      marginTop: 24,
    },
    button: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    buttonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFF',
    },
    infoBox: {
      backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    statusGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 16,
    },
    statusItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    statusItemLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Stripe Connect Setup',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const isFullyActive = onboardingStatus?.status === 'active' &&
                        onboardingStatus?.payouts_enabled &&
                        onboardingStatus?.charges_enabled;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Stripe Connect Setup',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Status Card */}
          <View style={styles.card}>
            {renderStatusBadge()}

            {isFullyActive ? (
              <>
                <Text style={styles.title}>🎉 You're All Set!</Text>
                <Text style={styles.subtitle}>
                  Your Stripe account is active and ready to receive payments.
                </Text>

                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Ionicons name="card" size={32} color="#48BB78" />
                    <Text style={styles.statusItemLabel}>Charges Enabled</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Ionicons name="cash" size={32} color="#48BB78" />
                    <Text style={styles.statusItemLabel}>Payouts Enabled</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>Enable Payments</Text>
                <Text style={styles.subtitle}>
                  Complete your Stripe Connect onboarding to start receiving payments from your sales.
                </Text>

                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.primary} style={styles.featureIcon} />
                    <Text style={styles.featureText}>
                      <Text style={{ fontWeight: '600' }}>Secure Payments:</Text> Stripe handles all payment processing securely
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="lock-closed" size={24} color={colors.primary} style={styles.featureIcon} />
                    <Text style={styles.featureText}>
                      <Text style={{ fontWeight: '600' }}>Escrow Protection:</Text> Funds held until buyer confirms delivery
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="cash" size={24} color={colors.primary} style={styles.featureIcon} />
                    <Text style={styles.featureText}>
                      <Text style={{ fontWeight: '600' }}>Fast Payouts:</Text> Automatic transfers after order completion
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="analytics" size={24} color={colors.primary} style={styles.featureIcon} />
                    <Text style={styles.featureText}>
                      <Text style={{ fontWeight: '600' }}>Transparent Fees:</Text> 8% commission (5% for premium sellers)
                    </Text>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={startOnboarding}
                    disabled={startingOnboarding}
                  >
                    <LinearGradient
                      colors={['#6A0DAD', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {startingOnboarding ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="arrow-forward-circle" size={24} color="#FFF" />
                          <Text style={styles.buttonText}>
                            {onboardingStatus?.status === 'not_started' ? 'Start Setup' : 'Continue Setup'}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              1. Complete Stripe Connect onboarding (2-3 minutes){'\n'}
              2. When you make a sale, buyer pays securely via Stripe{'\n'}
              3. Funds held in escrow until delivery confirmed{'\n'}
              4. Automatic payout to your bank account (minus commission){'\n'}
              5. Track all earnings in your seller dashboard
            </Text>
          </View>

          {onboardingStatus?.status === 'pending' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>⏳ Onboarding In Progress</Text>
              <Text style={styles.infoText}>
                Complete your Stripe onboarding to enable payments. If you didn't finish the onboarding, tap "Continue Setup" above.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

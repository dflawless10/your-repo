import { API_BASE_URL } from '@/config';

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyUser } from '@/api/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams();

  const [email, setEmail] = useState(
    typeof emailParam === 'string' ? emailParam : ''
  );
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the email icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleVerify = async () => {
    if (!email || !code) {
      Alert.alert('Missing Information', 'Please enter both email and verification code.');
      return;
    }

    try {
      setLoading(true);
      const success = await verifyUser(email.trim(), code.trim());
      if (success) {
        Alert.alert(
          '✅ Email Verified!',
          'Your email has been confirmed. Let\'s complete your profile.',
          [
            {
              text: 'Continue',
              onPress: () => router.push('/complete-profile')
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', 'The code you entered is incorrect. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch('http://10.0.0.170:5000/api/register/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) throw new Error('Resend failed');

      Alert.alert('Code Sent!', 'Check your email for a new verification code.');
      setCooldown(60);
    } catch (err) {
      console.error('Resend error:', err);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };

  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#FF6B35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons name="mail-open" size={64} color="#FFF" />
        </Animated.View>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>
      </LinearGradient>

      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.instructionText}>
          Enter the verification code below
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="key-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            placeholderTextColor="#9CA3AF"
            value={code}
            onChangeText={setCode}
            maxLength={6}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || !email || !code}
        >
          <LinearGradient
            colors={loading || !email || !code ? ['#9CA3AF', '#9CA3AF'] : ['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <Text style={styles.buttonText}>Verifying...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Verify Email</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend Code Section */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn&#39;t receive the code?</Text>
          {cooldown > 0 ? (
            <View style={styles.cooldownContainer}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.cooldownText}>
                Resend in {cooldown}s
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={!email || cooldown > 0}
            >
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.helpText}>
            Check your spam folder if you don&#39;t see the email
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  emailHighlight: {
    fontWeight: '700',
  },
  formContainer: {
    padding: 24,
    paddingTop: 32,
  },
  instructionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  verifyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resendContainer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cooldownText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 15,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
});

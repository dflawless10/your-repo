import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyUser } from '@/api/auth';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams();

  const [email, setEmail] = useState(
    typeof emailParam === 'string' ? emailParam : ''
  );
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const handleVerify = async () => {
    const success = await verifyUser(email.trim(), code.trim());
    if (success) {
      Alert.alert('✅ Verified', 'Your email has been confirmed.');
      router.push('/complete-profile'); // or wherever you want to go next
    } else {
      Alert.alert('❌ Verification failed', 'Check your code or try again.');
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

      Alert.alert('📨 Code sent', 'Check your email again.');
      setCooldown(60);
    } catch (err) {
      console.error('Resend error:', err);
      Alert.alert('Error', 'Failed to resend code.');
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
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email 📨</Text>
      <Text style={styles.subtitle}>Enter the code we sent to your email</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Verification Code"
        value={code}
        onChangeText={setCode}
        maxLength={6}
      />

      <Button
        title="Verify"
        onPress={handleVerify}
        disabled={!email || !code}
      />

      {cooldown > 0 && (
        <Text style={styles.timerText}>
          Resend available in {cooldown}s
        </Text>
      )}

      <Button
        title="Resend Code"
        onPress={handleResend}
        disabled={cooldown > 0 || !email}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8
  },
  timerText: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    color: '#666'
  }
});

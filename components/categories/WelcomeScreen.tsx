import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/config';

export default function WelcomeScreen() {
  const router = useRouter();
  const [action, setAction] = useState<'join' | 'signin' | null>(null);
  const [loading, setLoading] = useState(false);
  const [welcomeData, setWelcomeData] = useState<null | {
    title: string;
    subtitle: string;
    footer: string;
    actions: { label: string; route: string }[];
  }>(null);

  useEffect(() => {
    const fetchWelcome = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/welcome`);
        const data = await res.json();
        setWelcomeData(data);
      } catch (err) {
        console.error('Welcome fetch error:', err);
        Alert.alert('Error', 'Failed to load welcome content.');
      }
    };
    fetchWelcome();
  }, []);

  const sendWelcomeAction = async (selectedAction: 'join' | 'signin') => {
    setAction(selectedAction);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/welcome-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: selectedAction }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(
          selectedAction === 'join' ? 'Welcome!' : 'Welcome back!',
          data.message || 'Let’s get started!'
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to log welcome action.');
      }
    } catch (err) {
      console.error('Welcome API error:', err);
      Alert.alert('Network Error', 'Unable to reach the barnyard.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    sendWelcomeAction('join');
    router.push('/sign-up');
  };

  const handleSignIn = () => {
    sendWelcomeAction('signin');
    router.push('/sign-in');
  };

  if (!welcomeData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#d14" />
        <Text style={styles.loadingText}>Summoning goat magic...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{welcomeData.title}</Text>
      <Text style={styles.subtitle}>{welcomeData.subtitle}</Text>

      <TouchableOpacity
  style={styles.button}
  onPress={() => router.push('/register')}
  disabled={loading}
>
  <Ionicons name="sparkles" size={20} color="#fff" />
  <Text style={styles.buttonText}>Join the Herd</Text>
</TouchableOpacity>


      <TouchableOpacity style={styles.buttonOutline} onPress={handleSignIn} disabled={loading}>
        <Text style={styles.buttonOutlineText}>Already a Goat? Sign In</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>{welcomeData.footer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#d14',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#d14',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonOutlineText: {
    color: '#d14',
    fontSize: 16,
  },
  footer: {
    marginTop: 40,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

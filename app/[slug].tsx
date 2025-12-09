import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

type WelcomeData = {
  title: string;
  subtitle: string;
  footer?: string;
  actions?: {
    label: string;
    route: string;
  }[];
};



const API_URL = 'http://10.0.0.170:5000';

export default function DynamicScreen() {
  const { slug } = useLocalSearchParams();
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null);


  useEffect(() => {
    if (slug === 'welcome') {
      fetch(`${API_URL}/api/welcome`)
        .then((res) => res.json())
        .then(setWelcomeData)
        .catch((err) => {
          console.error('Welcome fetch error:', err);
          Alert.alert('Error', 'Unable to load welcome content.');
        });
    }
  }, [slug]);

  if (slug === 'mascot-guidelines') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Mascot Guidelines 🐐</ThemedText>
        <ThemedText>
          Use <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes for PNGs. SVGs are preferred for animations.
        </ThemedText>
      </ScrollView>
    );
  }

  if (slug === 'welcome' && welcomeData) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{welcomeData.title}</Text>
        <Text style={styles.subtitle}>{welcomeData.subtitle}</Text>

        {welcomeData.actions?.map((action, index) => (
          <TouchableOpacity
            key={action.label}
            style={styles.button}
            onPress={() => Alert.alert('Routing', `Go to ${action.route}`)}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.buttonText}>{action.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.footer}>{welcomeData.footer}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText>Unknown slug: {slug}</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 12,
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
  footer: {
    marginTop: 40,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

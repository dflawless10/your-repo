import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { HelloWave } from '@/components/HelloWave';

export default function AboutScreen() {
  const router = useRouter();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/discover');
  };

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(500)}
    >

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome to BidGoatMobile</Text>
        <HelloWave />
      </View>
      
      <Text style={styles.description}>
        BidGoatMobile is your auction companion with attitude. We blend playful branding,
        goat-themed animations, and sound effects to make bidding fun, memorable, and multisensory.
      </Text>
      <Text style={styles.description}>
        Whether you're chasing rare collectibles or just browsing, BidGoatMobile is designed to
        make every interaction feel like a celebration.
      </Text>
      
      <Text style={styles.footer}>Created with ❤️ by goatMaster</Text>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>Go to Discover</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    color: '#555',
    lineHeight: 24,
  },
  footer: {
    marginTop: 20,
    marginBottom: 24,
    fontSize: 14,
    color: '#888',
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonPressed: {
    backgroundColor: '#5B54D9',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
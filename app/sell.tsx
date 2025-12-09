import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MascotOverlay from '../app/components/MascotOverlay';
import SparkleTrail from '../app/sparkletrail/SparkleTrail';
import CreateAuctionForm from './CreateAuctionScreen';
import type { MascotMood } from '@/types/goatmoods';

export default function SellScreen() {
  const mood: MascotMood = 'Majestic';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💎 Sell Your Gem</Text>
      <Text style={styles.subtitle}>
        Ready to list your treasure? The goat is watching with regal anticipation.
      </Text>

      <CreateAuctionForm />

      <SparkleTrail mood={mood} milestoneLevel={2} />
      <MascotOverlay
        mood="Shimmer" // ✅ Must match MascotMood union
        message="Sparkle on, seller!"
        position="bottom"
        visible={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, marginBottom: 20 },
});

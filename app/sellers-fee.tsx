import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import SparkleTrail from '../app/sparkletrail/SparkleTrail';
import MascotOverlay from '../app/components/MascotOverlay';
import type { MascotMood } from '@/types/goatmoods'; // ✅ Correct type name

export default function SellersFee() {
  const theme = useTheme();

  const sparkleMood: MascotMood = 'Shimmer'; // ✅ Typed correctly

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
      accessibilityRole="summary"
      testID="sellers-fee-container"
    >
      {/* Optional mascot stamp */}
      {/* <Image source={GoatStampImage} style={styles.goatStamp} /> */}

      <Text
        style={[styles.title, { color: theme.colors.onBackground }]}
        accessibilityRole="header"
        testID="sellers-fee-title"
      >
        🐐 BidGoat Seller Fee Declaration
      </Text>

      <Text
        style={[styles.body, { color: theme.colors.onBackground }]}
        accessibilityRole="text"
        testID="sellers-fee-description"
      >
        No listing fees. No upfront costs. You only pay when your item sells.
        Our fulfillment fee fuels platform magic, marketing sparkle, and mascot joy.
        When your item finds a new home, the goat celebrates with confetti and sparkle.
      </Text>

      <SparkleTrail
        mood={sparkleMood}
        milestoneLevel={1}
        testID="sellers-fee-sparkletrail"
      />

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
  container: {
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  goatStamp: {
    width: 64,
    height: 64,
    marginBottom: 12,
    alignSelf: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GoatDroop() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🥺🐐</Text>
      <Text style={styles.text}>No wishlist items? The goat is heartbroken.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 48,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

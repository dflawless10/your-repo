import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GoatConfetti() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎊🐐🎊</Text>
      <Text style={styles.text}>You did it! The goat is dancing in confetti!</Text>
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
    color: '#444',
    textAlign: 'center',
  },
});

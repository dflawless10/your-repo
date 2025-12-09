import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function GoatSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B4513" />
      <Text style={styles.text}>The goat is preparing your auction magic...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
  },
});

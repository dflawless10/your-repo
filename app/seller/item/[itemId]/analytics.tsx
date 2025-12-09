import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function AnalyticsScreen() {
  const { itemId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📈 Bid Analytics</Text>
      <Text>Item ID: {itemId}</Text>
      {/* Analytics content coming soon... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
});

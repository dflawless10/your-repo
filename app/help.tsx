import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>🐐 Welcome to BidGoat Help!</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          <Text style={styles.text}>• Create an account to start bidding</Text>
          <Text style={styles.text}>• Browse items in the Discover section</Text>
          <Text style={styles.text}>• Add items to your wishlist with the heart icon</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buying Items</Text>
          <Text style={styles.text}>• Place bids on auction items</Text>
          <Text style={styles.text}>• Use "Buy It Now" for instant purchase</Text>
          <Text style={styles.text}>• Track your orders in "My Orders"</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selling Items</Text>
          <Text style={styles.text}>• List items for 7-30 days</Text>
          <Text style={styles.text}>• Manage orders in "Orders to Ship"</Text>
          <Text style={styles.text}>• Track revenue in your dashboard</Text>
          <Text style={styles.text}>• Relist expired items with one tap</Text>
        </View>

        <View style={styles.section}>
  <Text style={styles.sectionTitle}>💸 Revenue & Fees</Text>

  <Text style={styles.text}>📊 Commission & Processing:</Text>
  <Text style={styles.text}>• 8% commission on sales</Text>
  <Text style={styles.text}>• 3% payment processing fee</Text>
  <Text style={styles.text}>• Premium sellers pay only 5% commission ($19.99/month)</Text>

  <Text style={styles.text}>{"\n"}🚚 Buyer-Paid Shipping:</Text>
  <Text style={styles.text}>• Small (&lt;1 lb): $7.99</Text>
  <Text style={styles.text}>• Medium (1–5 lbs): $12.99</Text>
  <Text style={styles.text}>• Large (5–10 lbs): $18.99</Text>
  <Text style={styles.text}>• Oversized (10+ lbs): $29.99</Text>

  <Text style={styles.text}>{"\n"}🛡️ Optional Insurance:</Text>
  <Text style={styles.text}>• $0–$100: Free</Text>
  <Text style={styles.text}>• $101–$500: $2.99</Text>
  <Text style={styles.text}>• $501–$1,000: $4.99</Text>
  <Text style={styles.text}>• $1,001–$5,000: $9.99</Text>
  <Text style={styles.text}>• $5,000+: 1% of item value</Text>

  <Text style={styles.text}>{"\n"}🌟 Premium Features:</Text>
  <Text style={styles.text}>• Featured Listing: $10 (7 days homepage placement)</Text>
  <Text style={styles.text}>• Reserve Price: $3 (set minimum bid)</Text>
</View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          <Text style={styles.text}>Contact us at support@bidgoat.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 24,
    marginBottom: 8,
  },
});

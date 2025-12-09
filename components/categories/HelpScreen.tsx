import React from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';

export default function HelpScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🐐 BidGoat Help & Support</Text>
      <Text style={styles.section}>Getting Started</Text>
      <Text style={styles.text}>
        To list an item, tap the “Sell Something” button and follow the goat-guided prompts. Upload a photo, set your price, and let the barnyard bidding begin.
      </Text>
      <Text style={styles.section}>Profile & Avatar</Text>
      <Text style={styles.text}>
        You can update your username, password, and profile photo from the Edit Profile screen. Once uploaded, your goat face will persist across logins.
      </Text>
      <Text style={styles.section}>Auction Rituals</Text>
      <Text style={styles.text}>
        Auctions run on sparkle trails and bleat-powered timers. You’ll get notified when bids arrive, when your item sells, or when a goat celebrates your listing.
      </Text>
      <Text style={styles.section}>Troubleshooting</Text>
      <Text style={styles.text}>
        If something feels off—missing avatar, login issues, or a goat that won’t stop dancing—try logging out and back in. Still stuck? Reach out to support@bidgoat.com.
      </Text>
      <Text style={styles.section}>Barnyard Lore</Text>
      <Text style={styles.text}>
        BidGoat is powered by mascots, microinteractions, and multisensory joy. Every modal is a ritual. Every sparkle is earned. Welcome to the herd.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});

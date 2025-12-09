import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MascotOverlay from '../app/components/MascotOverlay';
import SparkleTrail from '../app/sparkletrail/SparkleTrail';
import type { MascotMood } from '@/types/goatmoods';
import { ListedItem } from '@/types/items';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playGoatSound } from '@/utils/GoatSound';

type BuyScreenProps = {
  item?: ListedItem;
};

export default function BuyScreen({ item }: Readonly<BuyScreenProps>) {
  const mood: MascotMood = 'Excited';

  const handleBuyNow = async () => {
  if (!item?.buy_it_now) {
    Alert.alert('Unavailable', 'Buy It Now option is not available for this item.');
    return;
  }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`http://10.0.0.170:5000/item/${item.id}/bid`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: item.buy_it_now }),
      })

      if (res.ok) {
        await playGoatSound('Victory Baa');
        Alert.alert('Success', `You bought ${item.name} for $${item.buy_it_now.toFixed(2)}!`);
      } else {
        const msg = await res.text();
        Alert.alert('Buy failed', msg);
      }
    } catch (err) {
      console.error('Buy error:', err);
      Alert.alert('Error', 'Could not complete purchase.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💍 Buy Bling</Text>
      <Text style={styles.subtitle}>
        The sparkle you seek is just a bid away. Let’s find your next treasure.
      </Text>

      {item?.buy_it_now ? (
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
          <Text style={styles.buyText}>
            Buy It Now for ${item.buy_it_now.toFixed(2)}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.unavailable}>Buy It Now is not available for this item.</Text>
      )}

      <Text style={styles.placeholder}>[✨ Listings will appear here ✨]</Text>

      <SparkleTrail mood={mood} milestoneLevel={1} />
      <MascotOverlay
        mood="Shimmer"
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
  buyButton: {
    marginTop: 8,
    backgroundColor: '#d69e2e',
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  unavailable: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from 'expo-router';
import CountdownTimer from '../../components/CountdownTimer';
import { playGoatSoundByName } from '@/assets/sounds/officialGoatSoundsSoundtrack';

const API_URL = 'http://10.0.0.170:5000';

export default function AuctionScreen() {
  const { auctionId, suggestedBid } = useLocalSearchParams();
  const [bidAmount, setBidAmount] = useState('');
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [endTime, setEndTime] = useState<string>('');
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);

  useEffect(() => {
    if (suggestedBid) setBidAmount(suggestedBid as string);
  }, [suggestedBid]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_URL}/auction/${auctionId}/status`)
        .then(res => res.json())
        .then(data => {
          setCurrentBid(data.current_bid);
          setEndTime(data.end_time);

          const hasEnded = data.time_remaining === 'Ended' || new Date(data.end_time) < new Date();
          setIsAuctionEnded(hasEnded);
        })
        .catch(err => console.error('Failed to fetch auction status:', err));
    }, 5000);
    return () => clearInterval(interval);
  }, [auctionId]);

  const placeBid = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    const res = await fetch(`${API_URL}/auction/${auctionId}/bid`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: bidAmount }),
    });

    if (res.ok) {
      await playGoatSoundByName('Victory Baa');
      Alert.alert('Success', `You bid $${bidAmount}`);
      setBidAmount('');
    } else {
      const msg = await res.text();
      Alert.alert('Bid Failed', msg);
    }
  };

  return (
    <View style={styles.container}>
      <CountdownTimer endTime={endTime} />
      <Text style={styles.currentBid}>💰 Current Bid: ${currentBid}</Text>

      <TextInput
        placeholder="Enter your bid"
        keyboardType="numeric"
        value={bidAmount}
        onChangeText={setBidAmount}
        style={styles.input}
        editable={!isAuctionEnded}
      />
      <Button title="Test Button" onPress={() => console.log('Pressed')} />

      <Button title="Place Bid" onPress={placeBid} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  currentBid: { fontSize: 18, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
  },
});

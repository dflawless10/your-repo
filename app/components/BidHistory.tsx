import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';

interface Bid {
  bid_id: number;
  avatar: string;
  username: string;
  amount: number;
}

interface BidHistoryProps {
  bids: Bid[];
}

export default function BidHistory({ bids }: BidHistoryProps) {
  return (
    <FlatList
      data={bids}
      keyExtractor={(item) => item.bid_id.toString()}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Text>{item.username}</Text>
          <Text style={styles.amount}>${item.amount}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  amount: { marginLeft: 'auto', fontWeight: 'bold' },
});
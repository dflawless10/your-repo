import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import UnTappedHeart from '../assets/unTappedHeart.svg';
import TappedHeart from '../assets/TappedHeart.svg';

type Auction = {
  auction_id: number;
  name: string;
  starting_bid: number;
  category: string;
  photo_url?: string;
  end_time?: string;
  auction_ends_at: string;
  buy_it_now?: number;
};

const API_URL = 'http://10.0.0.170:5000';

export default function AuctionsModule() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [tappedHearts, setTappedHearts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch(`${API_URL}/auctions`)
      .then(res => res.json())
      .then((data: Auction[]) => {
        console.log("Auction data:", data);
        setAuctions(data);
      })
      .catch(err => console.error("Auction fetch error:", err));
  }, []);

  const toggleHeart = (id: number) => {
    setTappedHearts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const grouped = auctions.reduce((acc, auction) => {
    const { category } = auction;
    if (!acc[category]) acc[category] = [];
    acc[category].push(auction);
    return acc;
  }, {} as Record<string, Auction[]>);

  const renderItem = ({ item }: { item: Auction }) => {
    const timeLeft = item.auction_ends_at
  ? formatDistanceToNow(new Date(item.auction_ends_at), { addSuffix: false })
  : 'Auction Ended';


    const isTapped = tappedHearts[item.auction_id];

    return (
      <View style={styles.card}>
        {/* Buy It Now Badge */}
        {item.buy_it_now && (
          <View style={styles.buyItNowBadge}>
            <Text style={styles.buyItNowText}>BUY NOW</Text>
          </View>
        )}

        <View style={styles.headerRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          <TouchableOpacity onPress={() => toggleHeart(item.auction_id)}>
            {isTapped ? (
              <TappedHeart width={24} height={24} />
            ) : (
              <UnTappedHeart width={24} height={24} />
            )}
          </TouchableOpacity>
        </View>
        <Text>${item.starting_bid}</Text>
        <Text style={styles.timer}>⏰ Time Left: {timeLeft}</Text>
        <Button title="Sell Now" onPress={() => console.log('Pressed')} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔨 Live Auctions by Category</Text>
      {Object.entries(grouped).map(([category, items]) => (
        <View key={category}>
          <Text style={styles.categoryTitle}>🗂️ {category}</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.auction_id.toString()}
            renderItem={renderItem}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  categoryTitle: { fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    position: 'relative',
  },
  itemName: { fontSize: 16, fontWeight: '500' },
  timer: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  buyItNowBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  buyItNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

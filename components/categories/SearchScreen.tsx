import React, { useCallback, useEffect, useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet } from 'react-native';
import { searchListings } from '@/utils/search';
import { AuctionPreviewCard } from '@/components/cards/AuctionPreviewCard'; // <-- named import
import { Audio } from 'expo-av';
import { debounce } from 'lodash';
import {DisplayItem} from "@/types/item";

export interface Listing {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  end_time: string;
}



const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Listing[]>([]);

  // 🐐 Sound trigger
  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/goat-bleat.wav') // ✅ Make sure this file exists
      );
      await sound.playAsync();
    } catch (error) {
      console.error('Sound playback error:', error);
    }
  };

  // 🧠 Debounced search
  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (!text.trim()) return setResults([]);
      try {
        const res = await searchListings(text);
        setResults(res);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300),
    []
  );

  const handleSearch = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  // 🐐 Bleat when results change
  useEffect(() => {
    if (results.length) playSound();
  }, [results]);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search for diamonds, styles, clarity..."
        value={query}
        onChangeText={handleSearch}
        style={styles.input}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AuctionPreviewCard preview={item} />
        )}
      />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: { padding: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 10,
    borderRadius: 8,
  },
});
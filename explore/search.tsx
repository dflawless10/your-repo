import {router, useLocalSearchParams} from 'expo-router';
import {useCallback, useEffect, useState} from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { searchListings } from '@/utils/search'; // Your backend/API query function
import AuctionPreviewCard from '@/components/cards/AuctionPreviewCard';
import React from 'react';
import {Listing} from "@/types/types";
import {debounce} from "lodash";
import {} from '@/assets/sounds/officialGoatSoundsSoundtrack';
import {triggerGoatAnimation} from "@/explore/Animated";





const showGoatAnimation = () => {
  console.log("✨ Showing goat animation!");
  // Add your animation logic here (e.g. Lottie, Reanimated, etc.)
};



const handleFocus = () => {
  triggerGoatAnimation(); // 🐐💥
};


const SearchScreen = () => {
  const { query } = useLocalSearchParams();
  const [results, setResults] = useState<Listing[]>([]);

  const handleSearch = (text: string) => {
  if (text.trim().length > 1) {
    router.push(`/explore/search?query=${encodeURIComponent(text)}`);
  }
};

const debouncedSearch = useCallback(debounce((query) => {
  console.log("Searching for:", query);
  // trigger search logic here
}, 300), []);


  useEffect(() => {
    const fetchResults = async () => {
      if (typeof query === 'string' && query.trim()) {
        const res = await searchListings(query);
        setResults(res);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AuctionPreviewCard preview={item} />
}
        ListEmptyComponent={<Text>No results for "{query}"</Text>}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
});
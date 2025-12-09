// components/PersistentSearchBar.tsx
import { useRouter } from 'expo-router';
import { View, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import React from 'react';

const PersistentSearchBar = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    router.push(`/explore/search?query=${encodeURIComponent(text)}`);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleSearch}
        placeholder="Search jewelry styles, clarity, metals..."
        returnKeyType="search"
      />
    </View>
  );
};

export default PersistentSearchBar;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
});

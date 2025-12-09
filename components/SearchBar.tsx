// components/SearchBar.tsx
import React from 'react';
import { View, TextInput, Image, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onSearch?: (text: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <Animated.View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image
          source={require('@/assets/images/goat-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessible
          accessibilityLabel="BidGoat Logo"
        />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search BidGoat"
            placeholderTextColor="#999"
            onChangeText={onSearch}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logoWrapper: {
    marginRight: 12,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  searchContainer: {
    flex: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
    padding: 0, // Remove default padding
  },
});
import { API_BASE_URL } from '@/config';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import MascotOverlay from '../app/components/MascotOverlay';
import SparkleTrail from '../app/sparkletrail/SparkleTrail';
import type { MascotMood } from '@/types/goatmoods';
import { Ionicons } from '@expo/vector-icons';

// Hardcoded watch data
const SAMPLE_WATCHES = [
  { brand: "Rolex", model: "Submariner", price: 12000, description: "Iconic dive watch", image: "submariner.jpg" },
  { brand: "Omega", model: "Speedmaster", price: 6000, description: "Moonwatch legend", image: "speedmaster.jpg" },
  { brand: "Bovet", model: "Amadeo Virtuoso V", price: 45000, description: "Artistic complication", image: "bovet.jpg" },
  { brand: "Blancpain", model: "Fifty Fathoms", price: 14000, description: "Deep dive classic", image: "fiftyfathoms.jpg" },
  { brand: "Benrus", model: "Sky Chief", price: 1800, description: "Vintage pilot watch", image: "skychief.jpg" },
  { brand: "Benzinger", model: "Regulateur", price: 2500, description: "Hand-engraved regulator", image: "benzinger.jpg" },
  { brand: "Bertolucci", model: "Vir Diver", price: 2200, description: "Italian diver", image: "virdiver.jpg" },
  { brand: "Bomberg", model: "Bolt-68", price: 900, description: "Bold modern design", image: "bolt68.jpg" }
];

type Watch = {
  brand: string;
  model: string;
  price: number;
  description: string;
  image: string;
};

export default function BrowseScreen() {
  const mood: MascotMood = 'Curious';
  const [watches, setWatches] = useState<Watch[]>(SAMPLE_WATCHES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch watches from API
  const fetchWatchesFromAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://10.0.0.170:5000/api/watches');
      const data = await response.json();
      // Combine with hardcoded watches or replace
      setWatches([...SAMPLE_WATCHES, ...data]);
    } catch (error) {
      console.error('Error fetching watches:', error);
      // Keep hardcoded watches if API fails
      setWatches(SAMPLE_WATCHES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchesFromAPI();
  }, []);

  // Filter watches based on search
  const filteredWatches = watches.filter(watch =>
    watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    watch.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWatchCard = ({ item }: { item: Watch }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Ionicons name="watch" size={60} color="#CBD5E0" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.brand}>⌚ {item.brand}</Text>
        <Text style={styles.model}>{item.model}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>${item.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Browse Watches</Text>
      <Text style={styles.subtitle}>
        The auction winds are stirring. Explore, bid, and let fate sparkle.
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#718096" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by brand or model..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Watch List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading watches...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWatches}
          renderItem={renderWatchCard}
          keyExtractor={(item, index) => `${item.brand}-${item.model}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <SparkleTrail mood={mood} milestoneLevel={1} />
      <MascotOverlay
        mood={mood}
        message="Found some treasures!"
        position="bottom"
        visible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7FAFC'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A202C'
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 16,
    color: '#4A5568'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A202C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardContent: {
    padding: 12,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  model: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
});

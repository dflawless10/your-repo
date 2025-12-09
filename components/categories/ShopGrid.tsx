import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

type ShopItem = {
  item_id: number;
  name: string;
  price: number;
  photo_url: string;
  category: string;
  tags: string[];
};

const API_URL = 'http://10.0.0.170:5000';

export default function ShopGridExpanded() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedRingType, setSelectedRingType] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedGemstone, setSelectedGemstone] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let url = `${API_URL}/shop-items?category=womens&tag=rings`;
    if (selectedRingType) url += `&ring_type=${selectedRingType}`;
    if (selectedMaterial) url += `&material=${selectedMaterial}`;
    if (selectedGemstone) url += `&gemstone=${selectedGemstone}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("Shop item error:", err));
  }, [selectedRingType, selectedMaterial, selectedGemstone]);

  const ringTypes = [
    "engagement", "wedding_band", "cocktail", "solitaire", "halo",
    "three_stone", "eternity", "stackable", "promise", "vintage",
    "designer", "gemstone", "diamond", "custom"
  ];

  const materials = [
    "platinum", "yellow_gold", "white_gold", "rose_gold",
    "sterling_silver", "mixed_metal"
  ];

  const gemstones = [
    "sapphire", "emerald", "ruby", "amethyst", "opal", "topaz", "diamond"
  ];

  const renderItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.photo_url }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💍 GoatRing Rituals</Text>

      {/* Category Selection */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => {
          setSelectedCategory('womens');
          setSelectedSubcategory('rings');
          setSelectedRingType(null);
          setSelectedMaterial(null);
          setSelectedGemstone(null);
        }}>
          <Text style={styles.link}>🧝‍♀️ Womens → Rings</Text>
        </TouchableOpacity>
      </View>

      {/* Ring Type Selection */}
      {selectedSubcategory === 'rings' && (
        <ScrollView horizontal style={styles.subNav}>
          {ringTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.subLink}
              onPress={() => {
                setSelectedRingType(type);
                setSelectedMaterial(null);
                setSelectedGemstone(null);
              }}
            >
              <Text>💍 {type.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Material Selection */}
      {selectedRingType && (
        <ScrollView horizontal style={styles.subNav}>
          {materials.map((mat) => (
            <TouchableOpacity
              key={mat}
              style={styles.subLink}
              onPress={() => {
                setSelectedMaterial(mat);
                setSelectedGemstone(null);
              }}
            >
              <Text>🪙 {mat.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Gemstone Selection */}
      {selectedMaterial && (
        <ScrollView horizontal style={styles.subNav}>
          {gemstones.map((gem) => (
            <TouchableOpacity
              key={gem}
              style={styles.subLink}
              onPress={() => setSelectedGemstone(gem)}
            >
              <Text>💎 {gem}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Item Grid */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.item_id.toString()}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<Text style={styles.empty}>No sparkle found 🐐</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  navRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  subNav: { marginBottom: 10 },
  link: { fontSize: 18, fontWeight: '600', color: '#4a148c' },
  subLink: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f3e5f5',
    borderRadius: 20,
  },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: '500' },
  price: { fontSize: 14, color: '#444' },
  empty: { textAlign: 'center', marginTop: 20, fontSize: 16 },
});

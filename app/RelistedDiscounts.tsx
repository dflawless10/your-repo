import React, { useRef } from "react";
import { Animated as RNAnimated, Text, View, Image, StyleSheet } from "react-native";
import { ListedItem } from "@/types/items";
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import ParallaxScrollView from '@/components/ParallaxScrollView';

interface Props {
  items: ListedItem[];
}

export default function RelistedDiscountsScreen({ items }: Props) {
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader
        scrollY={scrollY}
        title="Relisted & Reduced"
        subtitle="Great deals on relisted items"
      />

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#fff', dark: '#1a1a1a' }}
        scrollY={scrollY}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.heroTitle}>🔄 Relisted & Reduced</Text>

          {items.map(item => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.photo_url }} style={styles.image} />

              {item.original_price && item.original_price > item.price && (
                <View style={styles.ribbon}>
                  <Text style={styles.ribbonText}>
                    {Math.round(((item.original_price - item.price) / item.original_price) * 100)}% OFF
                  </Text>
                </View>
              )}

              {item.relist_count && item.relist_count > 0 && (
                <Text style={styles.relistBadge}>
                  🔄 Relisted {item.relist_count} times (last: {item.relisted_at})
                </Text>
              )}

              {item.status && (
                <Text style={styles.statusBadge}>
                  Status: {item.status}
                </Text>
              )}

              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
              <Text style={styles.originalPrice}>${item.original_price}</Text>
            </View>
          ))}
        </View>
      </ParallaxScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingTop: HEADER_MAX_HEIGHT + 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
  },
  card: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  ribbon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E53935',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ribbonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  relistBadge: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#1a1a1a',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    color: '#999',
    marginTop: 2,
  },
});

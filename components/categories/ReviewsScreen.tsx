import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { API_BASE_URL } from '@/config';

type Review = {
  id: number;
  reviewer_name: string;
  rating: number; // 1–5
  comment: string;
  mascot_mood?: string;
  avatar_url?: string;
};

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews`);
        const data = await res.json();
        setReviews(data.reviews ?? []);
      } catch (err) {
        console.error('Review fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (count: number) => {
    return '⭐'.repeat(count) + '🐐'.repeat(5 - count);
  };

  const renderItem = ({ item }: { item: Review }) => {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          {item.avatar_url && (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          )}
          <View style={styles.meta}>
            <Text style={styles.name}>{item.reviewer_name}</Text>
            <Text style={styles.rating}>{renderStars(item.rating)}</Text>
          </View>
        </View>
        <Text style={styles.comment}>{item.comment}</Text>
        {item.mascot_mood && (
          <Text style={styles.mood}>🐐 Mood: {item.mascot_mood}</Text>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Goat Reviews</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#d14" />
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>No bleats yet. Be the first to review!</Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  list: { paddingBottom: 40 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  meta: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  rating: { fontSize: 14, color: '#ff9900' },
  comment: { fontSize: 15, color: '#444', marginTop: 4 },
  mood: { fontSize: 13, fontStyle: 'italic', color: '#666', marginTop: 6 },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 40, color: '#888' },
});

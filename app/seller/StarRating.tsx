import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rating } from '@kolking/react-native-rating'; // or use react-native-ratings

export default function StarRating({ rating, count }: Readonly<{ rating: number; count: number }>) {
  return (
    <View style={styles.container}>
      <Rating
        size={24}
        rating={4.5}
        maxRating={5}
        fillColor={rating >= 4 ? '#FFD700' : rating >= 3 ? '#C0C0C0' : '#A0AEC0'}
        baseColor="#E2E8F0"
        onChange={() => {}}
        disabled
      />
      <Text style={styles.text}>{rating.toFixed(1)} out of 5 stars</Text>
      <Text style={styles.subText}>Based on {count} reviews</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 12 },
  text: { fontSize: 16, fontWeight: '600', color: '#2d3748' },
  subText: { fontSize: 14, color: '#718096' },
});

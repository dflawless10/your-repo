import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rating } from '@kolking/react-native-rating'; // or use react-native-ratings
import { useTheme } from '@/app/theme/ThemeContext';

export default function StarRating({ rating, count }: Readonly<{ rating: number; count: number }>) {
  const { theme, colors } = useTheme();

  return (
    <View style={styles.container}>
      <Rating
        size={24}
        rating={4.5}
        maxRating={5}
        fillColor={rating >= 4 ? '#FFD700' : rating >= 3 ? '#C0C0C0' : '#A0AEC0'}
        baseColor={theme === 'dark' ? '#3C3C3E' : '#E2E8F0'}
        onChange={() => {}}
        disabled
      />
      <Text style={[styles.text, { color: colors.textPrimary }]}>{rating.toFixed(1)} out of 5 stars</Text>
      <Text style={[styles.subText, { color: theme === 'dark' ? '#9CA3AF' : '#718096' }]}>Based on {count} reviews</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 12 },
  text: { fontSize: 16, fontWeight: '600' },
  subText: { fontSize: 14 },
});

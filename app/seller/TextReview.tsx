import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TextReview({ review }: Readonly<{ review: any }>) {
  return (
    <View style={styles.block}>
      <Text style={styles.header}>
        {review.reviewer_name} ({review.feedback_level}) — {review.rating} ⭐
      </Text>
      <Text style={styles.mood}>Mood: {review.mascot_mood || '🐐'}</Text>
      <Text style={styles.comment}>{review.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#edf2f7',
    borderRadius: 8,
  },
  header: {
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  mood: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  comment: {
    fontStyle: 'italic',
    color: '#4a5568',
  },
});

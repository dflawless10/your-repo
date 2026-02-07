import { API_BASE_URL } from '@/config';

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import StarRating from 'app/seller/StarRating';
import { validateContentQuick } from 'app/utils/contentModeration';
import { useTheme } from '@/app/theme/ThemeContext';


type Seller = { id: number };

const API_BASE = API_BASE_URL;

export default function BuyerReviewForm({ seller }: Readonly<{ seller: Seller }>) {
  const { theme, colors } = useTheme();
  const [review, setReview] = useState({
    reviewer_name: '',
    rating: 5,
    mascot_mood: '🐐',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!review.reviewer_name.trim() || !review.comment.trim()) {
      Alert.alert('Missing fields', 'Please enter your name and comment.');
      return;
    }

    // Content Moderation
    const nameModeration = validateContentQuick(review.reviewer_name, 'Reviewer name');
    if (!nameModeration.isValid) {
      Alert.alert('Content Policy Violation', nameModeration.errorMessage);
      return;
    }

    const commentModeration = validateContentQuick(review.comment, 'Review comment');
    if (!commentModeration.isValid) {
      Alert.alert('Content Policy Violation', commentModeration.errorMessage);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: seller.id,
          ...review,
        }),
      });

      if (response.ok) {
        Alert.alert('Review submitted', 'Goat bleated with gratitude!');
        setReview({ reviewer_name: '', rating: 5, mascot_mood: '🐐', comment: '' });
      } else {
        const msg = await response.text();
        Alert.alert('Error', msg || 'Goat tripped on the wire. Try again.');
      }
    } catch (err) {
      console.error('Review error:', err);
      Alert.alert('Error', 'Goat got lost in the cloud.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
      <Text style={[styles.header, { color: colors.textPrimary }]}>Leave a Review</Text>

      <Text style={[styles.label, { color: theme === 'dark' ? '#CCC' : '#4a5568' }]}>Your Rating</Text>
      <StarRating
        rating={review.rating}
        count={0}
        // @ts-ignore: StarRating onChange signature
        onChange={(newRating: number) => setReview((r) => ({ ...r, rating: newRating }))}
      />

      <Text style={[styles.label, { color: theme === 'dark' ? '#CCC' : '#4a5568' }]}>Your Name</Text>
      <TextInput
        placeholder="Your name"
        placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
        value={review.reviewer_name}
        onChangeText={(text) => setReview((r) => ({ ...r, reviewer_name: text }))}
        style={[styles.input, {
          backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fafafa',
          borderColor: theme === 'dark' ? '#3C3C3E' : '#d1d5db',
          color: colors.textPrimary
        }]}
        returnKeyType="next"
        blurOnSubmit={false}
      />

      <Text style={[styles.label, { color: theme === 'dark' ? '#CCC' : '#4a5568' }]}>Your Review</Text>
      <TextInput
        placeholder="Share your experience..."
        placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
        multiline
        numberOfLines={4}
        value={review.comment}
        onChangeText={(text) => setReview((r) => ({ ...r, comment: text }))}
        style={[styles.input, styles.multiline, {
          backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fafafa',
          borderColor: theme === 'dark' ? '#3C3C3E' : '#d1d5db',
          color: colors.textPrimary
        }]}
        returnKeyType="done"
        blurOnSubmit={true}
      />

      <Text style={[styles.label, { color: theme === 'dark' ? '#CCC' : '#4a5568' }]}>Mood</Text>
      <View style={styles.moodRow}>
        {['🐐', '😎', '🤔', '😡'].map((mood) => (
          <TouchableOpacity
            key={mood}
            onPress={() => setReview((r) => ({ ...r, mascot_mood: mood }))}
          >
            <Text style={[
              review.mascot_mood === mood ? styles.selectedMood : styles.mood,
              review.mascot_mood === mood && { backgroundColor: theme === 'dark' ? '#3C3C3E' : '#e2e8f0' }
            ]}>
              {mood}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleSubmitReview}
        style={[styles.submitButton, {
          backgroundColor: theme === 'dark' ? '#B794F4' : '#6A0DAD'
        }, submitting && { opacity: 0.7 }]}
        disabled={submitting}
      >
        <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Review'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 16, 
    backgroundColor: '#fff', 
    borderRadius: 12,
    marginBottom: 40,
    marginHorizontal: 16,
    marginTop: 16,
  },
  header: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#2d3748' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 6, color: '#4a5568' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    fontSize: 15,
  },
  multiline: { 
    minHeight: 100, 
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  mood: { fontSize: 24, padding: 6 },
  selectedMood: { fontSize: 24, padding: 6, backgroundColor: '#e2e8f0', borderRadius: 6 },
  submitButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  submitText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});

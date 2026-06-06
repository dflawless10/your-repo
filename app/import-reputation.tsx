import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/AuthContext';
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

const PLATFORMS = [
  { id: 'ebay', name: 'eBay', icon: '🛒', color: '#E53238' },
  { id: 'etsy', name: 'Etsy', icon: '🎨', color: '#F1641E' },
  { id: 'amazon', name: 'Amazon', icon: '📦', color: '#FF9900' },
  { id: 'mercari', name: 'Mercari', icon: '🛍️', color: '#FF0000' },
  { id: 'poshmark', name: 'Poshmark', icon: '👗', color: '#630F33' },
  { id: 'depop', name: 'Depop', icon: '👕', color: '#FF0000' },
  { id: 'other', name: 'Other', icon: '🌐', color: '#6B7280' },
];

export default function ImportReputationScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { theme, colors } = useTheme();

  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [platformUsername, setPlatformUsername] = useState('');
  const [platformProfileUrl, setPlatformProfileUrl] = useState('');
  const [totalReviews, setTotalReviews] = useState('');
  const [averageRating, setAverageRating] = useState('');
  const [positiveFeedback, setPositiveFeedback] = useState('');
  const [screenshotUri, setScreenshotUri] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickScreenshot = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedPlatform) {
      Alert.alert('Platform Required', 'Please select the platform you want to import from.');
      return;
    }
    if (!platformUsername) {
      Alert.alert('Username Required', 'Please enter your username on the platform.');
      return;
    }
    if (!totalReviews || parseInt(totalReviews) < 1) {
      Alert.alert('Reviews Required', 'Please enter your total number of reviews.');
      return;
    }
    if (!averageRating || parseFloat(averageRating) < 1 || parseFloat(averageRating) > 5) {
      Alert.alert('Rating Invalid', 'Please enter a valid rating between 1.0 and 5.0.');
      return;
    }
    if (!screenshotUri) {
      Alert.alert('Proof Required', 'Please upload a screenshot of your seller profile showing your ratings.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send as JSON with screenshot URI
      const payload: any = {
        platform: selectedPlatform.toLowerCase(),
        platform_username: platformUsername,
        platform_profile_url: platformProfileUrl,
        total_reviews: parseInt(totalReviews),
        average_rating: parseFloat(averageRating),
        verification_proof: screenshotUri, // Send URI for now
      };

      if (positiveFeedback) {
        payload.positive_feedback_percent = parseFloat(positiveFeedback);
      }

      const response = await fetch(`${API_BASE_URL}/api/ratings/import/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '🎉 Import Submitted!',
          `Your ${selectedPlatform.toUpperCase()} reputation is being verified!\n\n` +
          `✅ ${totalReviews} reviews\n` +
          `⭐ ${averageRating} avg rating\n\n` +
          `Once approved, you'll get:\n` +
          `💰 8% lifetime fee (vs 12-15% standard)\n` +
          `🔒 5% platform + 3% processing\n\n` +
          `We'll notify you within 24-48 hours!`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Submission Failed', data.error || 'Unable to submit your import request. Please try again.');
      }
    } catch (error) {
      console.error('Import submission error:', error);
      Alert.alert('Network Error', 'Unable to connect to server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff', borderBottomColor: theme === 'dark' ? '#3C3C3E' : '#E5E5E5' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#BB86FC' : '#6A0DAD'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Import Your Reputation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF5F2' }]}>
          <Text style={[styles.heroTitle, { color: theme === 'dark' ? '#FF8A65' : '#FF6B35' }]}>🎁 Special Offer: 8% Lifetime Fee</Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>
            Already selling on eBay, Etsy, or Amazon? Import your reputation and lock in an 8% lifetime fee (vs 12-15% standard)!
          </Text>
          <View style={[styles.feeComparison, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff' }]}>
            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Standard Fee:</Text>
              <Text style={[styles.feeValue, { color: '#E53E3E' }]}>12-15%</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Your Fee (Imported):</Text>
              <Text style={[styles.feeValue, { color: '#48BB78' }]}>8% 🔒</Text>
            </View>
            <Text style={[styles.feeBreakdown, { color: colors.textSecondary }]}>
              (5% platform + 3% processing)
            </Text>
          </View>
        </View>

        {/* Platform Selection */}
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>1️⃣ Select Platform</Text>
        <View style={styles.platformGrid}>
          {PLATFORMS.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                {
                  backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff',
                  borderColor: selectedPlatform === platform.id ? platform.color : (theme === 'dark' ? '#3C3C3E' : '#E2E8F0'),
                  borderWidth: selectedPlatform === platform.id ? 3 : 1,
                }
              ]}
              onPress={() => setSelectedPlatform(platform.id)}
            >
              <Text style={styles.platformIcon}>{platform.icon}</Text>
              <Text style={[styles.platformName, { color: colors.textPrimary }]}>{platform.name}</Text>
              {selectedPlatform === platform.id && (
                <View style={[styles.selectedBadge, { backgroundColor: platform.color }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Fields */}
        {selectedPlatform && (
          <>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>2️⃣ Your Platform Info</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Username on {PLATFORMS.find(p => p.id === selectedPlatform)?.name}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
              value={platformUsername}
              onChangeText={setPlatformUsername}
              placeholder="e.g., TheWanderingTrader"
              placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Profile URL (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
              value={platformProfileUrl}
              onChangeText={setPlatformProfileUrl}
              placeholder="https://ebay.com/usr/yourname"
              placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
              autoCapitalize="none"
            />

            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>3️⃣ Your Stats</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Total Reviews/Ratings</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
              value={totalReviews}
              onChangeText={setTotalReviews}
              placeholder="247"
              placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Average Rating (1.0 - 5.0)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
              value={averageRating}
              onChangeText={setAverageRating}
              placeholder="4.7"
              placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Positive Feedback % (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
              value={positiveFeedback}
              onChangeText={setPositiveFeedback}
              placeholder="98.5"
              placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>4️⃣ Verification Proof</Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Upload a screenshot of your seller profile showing your ratings. This helps us verify your reputation.
            </Text>

            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
              onPress={pickScreenshot}
            >
              {screenshotUri ? (
                <>
                  <Image source={{ uri: screenshotUri }} style={styles.screenshot} />
                  <Text style={[styles.uploadButtonText, { color: '#48BB78' }]}>✅ Screenshot Uploaded</Text>
                </>
              ) : (
                <>
                  <Ionicons name="camera-outline" size={48} color={theme === 'dark' ? '#666' : '#CBD5E0'} />
                  <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>📸 Upload Screenshot</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { opacity: isSubmitting ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '⏳ Submitting...' : '🚀 Submit for Verification'}
              </Text>
            </TouchableOpacity>

            {/* Legal Notice */}
            <View style={[styles.legalNotice, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF9E6' }]}>
              <Ionicons name="information-circle" size={20} color="#D97706" />
              <Text style={[styles.legalText, { color: theme === 'dark' ? '#FDB022' : '#D97706' }]}>
                By submitting, you confirm this information is accurate. False claims may result in account suspension.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  feeComparison: {
    borderRadius: 12,
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  feeBreakdown: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  platformCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  platformIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  screenshot: {
    width: 200,
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  legalNotice: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

// app/confirm-ownership/[itemId].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  confirmOwnership,
  generateHashCode,
  formatConfirmationTimestamp,
} from '@/api/confirmation';

export default function ConfirmOwnershipScreen() {
  const { itemId, itemName } = useLocalSearchParams<{ itemId: string; itemName?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [hashCode, setHashCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [generatedHash, setGeneratedHash] = useState('');

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        // Decode JWT to get user_id (simplified - in production use jwt-decode library)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.user_id);
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const handleGenerateHash = () => {
    if (!userId || !itemId) {
      Alert.alert('Error', 'Missing user or item information');
      return;
    }

    const hash = generateHashCode(Number(itemId), userId);
    setGeneratedHash(hash);
    setHashCode(hash);
  };

  const handleConfirm = async () => {
    if (!hashCode.trim()) {
      Alert.alert('Error', 'Please enter or generate a confirmation code');
      return;
    }

    setLoading(true);

    try {
      const result = await confirmOwnership(Number(itemId), hashCode);

      if (result?.success) {
        Alert.alert(
          'Success! 🎉',
          'Your ownership has been confirmed. This item is now verified in your collection.',
          [
            {
              text: 'View Collection',
              onPress: () => router.push('/purchases'),
            },
            {
              text: 'Done',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'Confirmation Failed',
          result?.message || 'Could not verify ownership. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error confirming ownership:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Ownership</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={48} color="#6A0DAD" />
        <Text style={styles.infoTitle}>Verify Your Purchase</Text>
        <Text style={styles.infoText}>
          Confirm ownership of your item to add it to your verified collection and unlock exclusive features.
        </Text>
      </View>

      {/* Item Info */}
      {!!itemName && (
        <View style={styles.itemCard}>
          <Text style={styles.itemLabel}>Item</Text>
          <Text style={styles.itemName}>{itemName}</Text>
          <Text style={styles.itemId}>ID: {itemId}</Text>
        </View>
      )}

      {/* Hash Generation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confirmation Code</Text>
        <Text style={styles.sectionDescription}>
          Generate a unique code or enter one provided by the seller
        </Text>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateHash}
          disabled={!userId}
        >
          <Ionicons name="key" size={20} color="#fff" />
          <Text style={styles.generateButtonText}>Generate Code</Text>
        </TouchableOpacity>

        {!!generatedHash && (
          <View style={styles.hashDisplay}>
            <Text style={styles.hashLabel}>Generated Code:</Text>
            <Text style={styles.hashCode}>{generatedHash}</Text>
            <Text style={styles.hashTimestamp}>
              {formatConfirmationTimestamp(new Date().toISOString())}
            </Text>
          </View>
        )}

        <Text style={styles.orText}>OR</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter confirmation code"
          placeholderTextColor="#999"
          value={hashCode}
          onChangeText={setHashCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={loading || !hashCode.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirm Ownership</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>Benefits of Verification</Text>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#38a169" />
          <Text style={styles.benefitText}>Verified badge on your item</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#38a169" />
          <Text style={styles.benefitText}>Increased buyer trust when reselling</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#38a169" />
          <Text style={styles.benefitText}>Access to ownership history</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#38a169" />
          <Text style={styles.benefitText}>Enhanced collection statistics</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  infoCard: {
    backgroundColor: '#f0f4ff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d9ff',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemId: {
    fontSize: 12,
    color: '#6c757d',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6A0DAD',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hashDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  hashLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  hashCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  hashTimestamp: {
    fontSize: 12,
    color: '#6c757d',
  },
  orText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38a169',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  benefitsSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#4a5568',
    flex: 1,
  },
});

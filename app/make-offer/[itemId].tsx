// app/make-offer/[itemId].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/config';
import { createOffer } from '@/api/offers';

interface ItemDetails {
  id: number;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  seller_username: string;
  reserve_price?: number;
}

export default function MakeOfferScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();
  const numericItemId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/items/${numericItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data);

        // Pre-populate with 70% of reserve (or starting price if no reserve)
        const basePrice = data.reserve_price || data.price;
        const suggestedOffer = (basePrice * 0.70).toFixed(2);
        setOfferAmount(suggestedOffer);
      } else {
        Alert.alert('Error', 'Failed to load item details');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('Error', 'Failed to load item');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (!item) return;

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid offer amount');
      return;
    }

    // Validate minimum offer (70% of reserve or starting price)
    const basePrice = item.reserve_price || item.price;
    const minOffer = basePrice * 0.70;
    if (amount < minOffer) {
      Alert.alert(
        'Offer Too Low',
        `Minimum offer is $${minOffer.toFixed(2)} (70% of ${item.reserve_price ? 'reserve' : 'starting'} price)`
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await createOffer({
        item_id: numericItemId,
        offer_amount: amount,
        message: offerMessage,
      });

      if (result) {
        Alert.alert(
          'Offer Submitted! 💎',
          `Your offer of $${amount.toFixed(2)} has been sent to ${item.seller_username}. You'll receive a notification when they respond.\n\nView your sent offers in the Buying section.`,
          [
            {
              text: 'View Sent Offers',
              onPress: () => router.replace('/buyer/sent-offers'),
            },
            {
              text: 'Back to My Bids',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit offer. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting offer:', error);

      // Handle specific error cases
      if (error.message?.includes('auto-bid')) {
        Alert.alert(
          'Auto-Bid Active',
          'You have an active auto-bid on this item. Disable it in My Bids first, then try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit offer. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#E53E3E" />
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  const basePrice = item.reserve_price || item.price;
  const minOffer = (basePrice * 0.70).toFixed(2);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make an Offer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Item Preview */}
        <View style={styles.itemCard}>
          <Image
            source={{ uri: item.photo_url }}
            style={styles.itemImage}
            contentFit="cover"
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.sellerName}>Seller: {item.seller_username}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {item.reserve_price ? 'Reserve Price:' : 'Starting Price:'}
              </Text>
              <Text style={styles.priceValue}>${basePrice.toFixed(2)}</Text>
            </View>
            <View style={styles.minOfferBadge}>
              <Ionicons name="information-circle" size={16} color="#6A0DAD" />
              <Text style={styles.minOfferText}>Min offer: ${minOffer}</Text>
            </View>
          </View>
        </View>

        {/* Second Chance Banner */}
        <View style={styles.secondChanceBanner}>
          <Ionicons name="diamond" size={24} color="#F59E0B" />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>💎 Second Chance Opportunity</Text>
            <Text style={styles.bannerText}>
              The reserve was&#39;t met, but the seller may still accept your offer!
            </Text>
          </View>
        </View>

        {/* Offer Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Offer Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>
          <Text style={styles.hint}>Minimum: ${minOffer} (70% of {item.reserve_price ? 'reserve' : 'starting price'})</Text>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message to Seller (Optional)</Text>
          <TextInput
            style={styles.messageInput}
            value={offerMessage}
            onChangeText={setOfferMessage}
            placeholder="Add a personal note to strengthen your offer..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>💡 Tip: Explain why you&#39;re interested or share your story!</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submittingButton]}
          onPress={handleSubmitOffer}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Offer</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ✅ All transactions processed securely through BidGoat
          </Text>
          <Text style={styles.disclaimerText}>
            📦 Shipping and buyer protection included
          </Text>
          <Text style={styles.disclaimerText}>
            ⏰ Offer expires in 48 hours if not accepted
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E53E3E',
    marginTop: 16,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  itemInfo: {
    padding: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  minOfferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  minOfferText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  secondChanceBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#6A0DAD',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A0DAD',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1A202C',
  },
  messageInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A202C',
    minHeight: 100,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6A0DAD',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submittingButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  disclaimer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
});

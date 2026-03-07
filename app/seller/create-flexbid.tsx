import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createFlexBid, calculateAuctionEndTime } from '@/api/flexbid';
import EnhancedHeader from '@/app/components/EnhancedHeader';

export default function CreateFlexBidScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [itemTitle, setItemTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [minimumPrice, setMinimumPrice] = useState('');
  const [softFloorPrice, setSoftFloorPrice] = useState('');
  const [durationHours, setDurationHours] = useState('48');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  const handleSubmit = async () => {
    // Validation
    if (!itemTitle.trim()) {
      Alert.alert('Error', 'Please enter an item title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!minimumPrice || parseFloat(minimumPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid minimum price');
      return;
    }

    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to create an auction');
        router.push('/login');
        return;
      }

      const auctionEndTime = calculateAuctionEndTime(parseInt(durationHours) || 48);

      await createFlexBid({
        item_title: itemTitle,
        description: description,
        photo_url: photoUrl || undefined,
        minimum_price: parseFloat(minimumPrice),
        soft_floor_price: softFloorPrice ? parseFloat(softFloorPrice) : undefined,
        auction_ends_at: auctionEndTime,
        seller_id: parseInt(userId),
      });

      Alert.alert(
        'Success',
        'Your FlexBid sealed reserve auction has been created!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/seller/flexbids'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating FlexBid:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <EnhancedHeader />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Create FlexBid Auction</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#FF6B35" />
          <Text style={styles.infoText}>
            FlexBid is a sealed reserve auction where bidders submit blind bids. The highest bid wins
            if it meets your minimum price. Optionally set a soft floor price for offers you'll review.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Item Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={itemTitle}
              onChangeText={setItemTitle}
              placeholder="Enter item title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your item in detail"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo URL</Text>
            <TextInput
              style={styles.input}
              value={photoUrl}
              onChangeText={setPhotoUrl}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor="#999"
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Minimum Price <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priceInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceField}
                value={minimumPrice}
                onChangeText={setMinimumPrice}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.helpText}>
              Bids below this amount will not be accepted
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Soft Floor Price (Optional)</Text>
            <View style={styles.priceInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceField}
                value={softFloorPrice}
                onChangeText={setSoftFloorPrice}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.helpText}>
              Bids between this and minimum price will be sent for your review
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Auction Duration (Hours)</Text>
            <TextInput
              style={styles.input}
              value={durationHours}
              onChangeText={setDurationHours}
              placeholder="48"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
            <Text style={styles.helpText}>Default: 48 hours (2 days)</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="hammer" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Create Auction</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#D32F2F',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  priceField: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

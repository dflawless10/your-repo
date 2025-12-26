import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';

const API_URL = 'http://10.0.0.170:5000';

export default function ReviewItemScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Refresh item data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchItem();
    }, [itemId])
  );

  useEffect(() => {
    if (item) {
      updateTimeRemaining(); // Call immediately when item loads
      const interval = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [item]);

  const fetchItem = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data);
      } else {
        Alert.alert('Error', 'Could not load item');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('Error', 'Could not load item');
      router.back();
    } finally {
      setLoading(false);
    }
  };


  const updateTimeRemaining = () => {
    if (!item?.review_ends_at) {
      setTimeRemaining('N/A');
      return;
    }

    const now = new Date();
    const reviewEnds = new Date(item.review_ends_at);
    const diffMs = reviewEnds.getTime() - now.getTime();

    if (diffMs <= 0) {
      setTimeRemaining('Publishing now...');
      setTimeout(fetchItem, 2000); // Refresh to see if published
      return;
    }

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    setTimeRemaining(`${minutes}m ${seconds}s`);
  };

  const handleEdit = () => {
    router.push(`/seller/item/${itemId}/edit`);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Item?',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const response = await fetch(`${API_URL}/item/${itemId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                Alert.alert('Deleted', 'Item removed successfully');
                router.replace('/(tabs)/MyAuctionScreen');
              } else {
                const error = await response.text();
                Alert.alert('Error', error);
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Could not delete item');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Header with Back Arrow */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Review Your Item</Text>
        </View>

      {/* Review Status Badge */}
      <View style={styles.reviewBanner}>
        <Ionicons name="hourglass-outline" size={24} color="#FF9800" />
        <View style={styles.reviewBannerText}>
          <Text style={styles.reviewTitle}>🔍 Under Review</Text>
          <Text style={styles.reviewSubtitle}>
            Goes live in {timeRemaining}
          </Text>
          <Text style={styles.reviewDescription}>
            Your item is being prepared for listing. You can edit or delete it during this time.
          </Text>
        </View>
      </View>

      {/* Item Preview */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Preview</Text>

        <Image
          source={{ uri: item.photo_url }}
          style={styles.itemImage}
          resizeMode="cover"
        />

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Starting Price:</Text>
            <Text style={styles.priceValue}>${item.price?.toFixed(2)}</Text>
          </View>

          {item.buy_it_now && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Buy It Now:</Text>
              <Text style={styles.priceValue}>${item.buy_it_now?.toFixed(2)}</Text>
            </View>
          )}

          {item.reserve_price && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Reserve Price:</Text>
              <Text style={styles.priceValue}>${item.reserve_price?.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Strategy:</Text>
            <Text style={styles.metaValue}>{item.selling_strategy || 'auction'}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Auction Ends:</Text>
            <Text style={styles.metaValue}>
              {item.auction_ends_at ? new Date(item.auction_ends_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Item</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#4A90E2" />
        <Text style={styles.infoText}>
          During the review period, your item is not visible to buyers. It will automatically go live after {timeRemaining}.
        </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#999',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  reviewBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  reviewBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  reviewDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  previewSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    padding: 16,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#999',
  },
  metaValue: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
});

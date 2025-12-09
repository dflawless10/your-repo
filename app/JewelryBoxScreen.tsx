import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.0.0.170:5000';

interface FavoriteItem {
  id: number;
  name: string;
  description: string;
  price: number;
  current_bid?: number;
  photo_url: string;
  auction_ends_at?: string;
  timeLeft?: string;
  status: 'active' | 'buy_now' | 'expired_unsold' | 'sold' | 'expired';
  is_sold: boolean;
  seller_id: number;
  seller_username: string;
  can_make_offer: boolean;
  pending_offers: number;
}

type TabType = 'active' | 'expired';

export default function JewelryBoxScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [activeItems, setActiveItems] = useState<FavoriteItem[]>([]);
  const [expiredItems, setExpiredItems] = useState<FavoriteItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Make Offer Modal State
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FavoriteItem | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.warn('No token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveItems(data.active || []);
        setExpiredItems(data.expired || []);
        console.log(`📦 Wishlist loaded: ${data.active?.length || 0} active, ${data.expired?.length || 0} expired`);
      } else {
        console.error('Failed to fetch wishlist:', response.status);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const handleMakeOffer = (item: FavoriteItem) => {
    setSelectedItem(item);
    const minOffer = (item.price * 0.70).toFixed(2);
    setOfferAmount(minOffer);
    setOfferMessage('');
    setOfferModalVisible(true);
  };

  const submitOffer = async () => {
    if (!selectedItem) return;

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid offer amount');
      return;
    }

    const minOffer = selectedItem.price * 0.70;
    if (amount < minOffer) {
      Alert.alert(
        'Offer Too Low',
        `Minimum offer is $${minOffer.toFixed(2)} (70% of original price)`
      );
      return;
    }

    setSubmittingOffer(true);

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          offer_amount: amount,
          message: offerMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Offer Submitted! 🎉',
          `Your offer of $${amount.toFixed(2)} has been sent to the seller. You'll be notified when they respond.`,
          [{ text: 'OK', onPress: () => {
            setOfferModalVisible(false);
            fetchWishlist(); // Refresh to show pending offer count
          }}]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to submit offer');
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      Alert.alert('Error', 'Failed to submit offer. Please try again.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const renderActiveItem = ({ item }: { item: FavoriteItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => router.push(`/item/${item.id}`)}
    >
      <Image
        source={{ uri: item.photo_url }}
        style={styles.itemImage}
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>
          ${item.current_bid || item.price}
        </Text>
        {item.timeLeft && (
          <View style={styles.timeLeftBadge}>
            <Ionicons name="time-outline" size={12} color="#FF6B35" />
            <Text style={styles.timeLeftText}>{item.timeLeft}</Text>
          </View>
        )}
        {item.status === 'buy_now' && (
          <View style={styles.buyNowBadge}>
            <Text style={styles.buyNowText}>Buy It Now</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderExpiredItem = ({ item }: { item: FavoriteItem }) => (
    <View style={styles.expiredCard}>
      <TouchableOpacity
        style={styles.expiredCardContent}
        onPress={() => router.push(`/item/${item.id}`)}
      >
        <Image
          source={{ uri: item.photo_url }}
          style={styles.expiredImage}
          contentFit="cover"
        />
        <View style={styles.expiredInfo}>
          <Text style={styles.expiredName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.originalPrice}>
            Original: ${item.price}
          </Text>

          {item.is_sold ? (
            <View style={styles.soldBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#38a169" />
              <Text style={styles.soldText}>Sold</Text>
            </View>
          ) : (
            <View style={styles.unsoldBadge}>
              <Ionicons name="close-circle" size={16} color="#e53e3e" />
              <Text style={styles.unsoldText}>Didn't Sell</Text>
            </View>
          )}

          {item.pending_offers > 0 && (
            <Text style={styles.pendingOffersText}>
              {item.pending_offers} pending offer{item.pending_offers > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {item.can_make_offer && (
        <TouchableOpacity
          style={styles.makeOfferButton}
          onPress={() => handleMakeOffer(item)}
        >
          <Ionicons name="cash-outline" size={20} color="#FFF" />
          <Text style={styles.makeOfferText}>Make Offer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyActive = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No Active Favorites</Text>
      <Text style={styles.emptySubtext}>
        Items you favorite will appear here
      </Text>
    </View>
  );

  const renderEmptyExpired = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No Expired Items</Text>
      <Text style={styles.emptySubtext}>
        Expired items from your favorites will appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}
          >
            Active ({activeItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
          onPress={() => setActiveTab('expired')}
        >
          <Text
            style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}
          >
            Expired ({expiredItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'active' ? (
        <FlatList
          data={activeItems}
          renderItem={renderActiveItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={renderEmptyActive}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <FlatList
          data={expiredItems}
          renderItem={renderExpiredItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyExpired}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Make Offer Modal */}
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make an Offer</Text>
              <TouchableOpacity onPress={() => setOfferModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={styles.modalItemInfo}>
                  <Image
                    source={{ uri: selectedItem.photo_url }}
                    style={styles.modalItemImage}
                    contentFit="cover"
                  />
                  <View>
                    <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                    <Text style={styles.modalItemPrice}>
                      Original: ${selectedItem.price}
                    </Text>
                    <Text style={styles.modalMinOffer}>
                      Min offer: ${(selectedItem.price * 0.70).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Your Offer Amount</Text>
                <TextInput
                  style={styles.input}
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                />

                <Text style={styles.inputLabel}>Message to Seller (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.messageInput]}
                  value={offerMessage}
                  onChangeText={setOfferMessage}
                  placeholder="Add a note to your offer..."
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setOfferModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      submittingOffer && styles.submittingButton,
                    ]}
                    onPress={submitOffer}
                    disabled={submittingOffer}
                  >
                    <Ionicons name="cash-outline" size={20} color="#FFF" />
                    <Text style={styles.submitButtonText}>
                      {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                  ✅ All transactions processed through BidGoat{'\n'}
                  📦 Shipping and buyer protection included
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6A0DAD',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#6A0DAD',
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 4,
  },
  timeLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLeftText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '600',
  },
  buyNowBadge: {
    backgroundColor: '#38a169',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  buyNowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  expiredCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  expiredCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  expiredImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  expiredInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  expiredName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  soldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soldText: {
    fontSize: 12,
    color: '#38a169',
    fontWeight: '600',
  },
  unsoldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unsoldText: {
    fontSize: 12,
    color: '#e53e3e',
    fontWeight: '600',
  },
  pendingOffersText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  makeOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6A0DAD',
    paddingVertical: 12,
    gap: 8,
  },
  makeOfferText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
  },
  modalItemInfo: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
    marginLeft: 12,
  },
  modalItemPrice: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  modalMinOffer: {
    fontSize: 12,
    color: '#6A0DAD',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6A0DAD',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submittingButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  disclaimer: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

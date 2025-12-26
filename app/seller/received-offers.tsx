import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import {
  getReceivedOffers,
  acceptOffer,
  declineOffer,
  getOfferTimeRemaining,
  getOfferStatusColor,
  getOfferStatusLabel,
  Offer,
} from '@/api/offers';

export default function ReceivedOffersScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingOfferId, setProcessingOfferId] = useState<number | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const data = await getReceivedOffers();
    if (data) {
      setOffers(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const handleAcceptOffer = (offer: Offer) => {
    Alert.alert(
      'Accept Offer',
      `Accept offer of $${offer.offer_amount.toFixed(2)} from ${offer.buyer_username}?\n\nThis will create an order and mark the item as sold.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setProcessingOfferId(offer.id);
            const result = await acceptOffer(offer.id);
            setProcessingOfferId(null);

            if (result.success) {
              Alert.alert(
                'Offer Accepted! 🎉',
                `Order #${result.order_id} has been created. The buyer will be notified.`,
                [{ text: 'OK', onPress: fetchOffers }]
              );
            } else {
              Alert.alert('Error', result.error || 'Failed to accept offer');
            }
          },
        },
      ]
    );
  };

  const handleDeclineOffer = (offer: Offer) => {
    Alert.alert(
      'Decline Offer',
      `Decline offer of $${offer.offer_amount.toFixed(2)} from ${offer.buyer_username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingOfferId(offer.id);
            const result = await declineOffer(offer.id);
            setProcessingOfferId(null);

            if (result.success) {
              Alert.alert('Offer Declined', 'The buyer will be notified.', [
                { text: 'OK', onPress: fetchOffers },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to decline offer');
            }
          },
        },
      ]
    );
  };

  const renderOfferCard = ({ item }: { item: Offer }) => {
    const timeRemaining = getOfferTimeRemaining(item.expires_at);
    const statusColor = getOfferStatusColor(item.status);
    const isProcessing = processingOfferId === item.id;
    const isPending = item.status === 'pending';

    return (
      <View style={styles.offerCard}>
        {/* Item Info */}
        <View style={styles.offerHeader}>
          <Image source={{ uri: item.photo_url }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.item_name}
            </Text>
            <Text style={styles.buyerName}>From: {item.buyer_username}</Text>
          </View>
        </View>

        {/* Offer Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Offer Amount</Text>
          <Text style={styles.amountValue}>${item.offer_amount.toFixed(2)}</Text>
        </View>

        {/* Message */}
        {item.message && (
          <View style={styles.messageContainer}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {/* Status & Time */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getOfferStatusLabel(item.status)}</Text>
          </View>
          {isPending && (
            <Text style={styles.timeRemaining}>{timeRemaining}</Text>
          )}
        </View>

        {/* Action Buttons (only for pending offers) */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineOffer(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptOffer(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Created Date */}
        <Text style={styles.createdDate}>
          Received {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Received Offers</Text>
          <Text style={styles.headerSubtitle}>Manage offers from buyers</Text>
        </View>
        <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>💰 Received Offers</Text>
        <Text style={styles.headerSubtitle}>Manage offers from buyers</Text>
      </View>

      <Animated.FlatList
        data={offers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No offers received yet</Text>
            <Text style={styles.emptySubtext}>
              Offers will appear here when buyers make offers on your expired items
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  listContent: {
    paddingTop: 140,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  offerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 6,
  },
  buyerName: {
    fontSize: 14,
    color: '#718096',
  },
  amountContainer: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#2C5282',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  timeRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  createdDate: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});

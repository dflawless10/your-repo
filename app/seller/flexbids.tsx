import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { format, parseISO } from 'date-fns';
import { getSellerFlexBids, FlexBidAuction } from '@/api/flexbid';
import EnhancedHeader from '@/app/components/EnhancedHeader';

export default function SellerFlexBidsScreen() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<FlexBidAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAuctions = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getSellerFlexBids();
      setAuctions(data);
    } catch (error) {
      console.error('Error loading FlexBid auctions:', error);
      Alert.alert('Error', 'Failed to load your FlexBid auctions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAuctions();
    }, [])
  );

  const onRefresh = () => {
    loadAuctions(true);
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  const renderAuctionCard = ({ item }: { item: FlexBidAuction }) => {
    const isActive = item.is_active;
    const hasPhoto = item.photo_url && item.photo_url !== 'null';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          // Future: navigate to auction detail screen
          Alert.alert('Auction Details', `Auction ID: ${item.id}\nBids: ${item.bid_count}`);
        }}
      >
        <View style={styles.cardContent}>
          {hasPhoto && (
            <Image
              source={{ uri: item.photo_url }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          )}

          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={styles.statusText}>{isActive ? 'Active' : 'Closed'}</Text>
              </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.priceRow}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Minimum</Text>
                <Text style={styles.priceValue}>${item.minimum_price.toLocaleString()}</Text>
              </View>
              {item.soft_floor_price && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Soft Floor</Text>
                  <Text style={styles.priceValue}>${item.soft_floor_price.toLocaleString()}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.metaRow}>
                <Ionicons name="hammer" size={16} color="#666" />
                <Text style={styles.metaText}>{item.bid_count} bids</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{formatDate(item.auction_ends_at)}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No FlexBid Auctions</Text>
      <Text style={styles.emptyText}>
        You haven't created any FlexBid sealed reserve auctions yet.
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/seller/create-flexbid')}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Your First Auction</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <EnhancedHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading your auctions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EnhancedHeader />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My FlexBid Auctions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/seller/create-flexbid')}
        >
          <Ionicons name="add" size={28} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={auctions}
        renderItem={renderAuctionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={auctions.length === 0 ? styles.emptyListContent : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#999',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priceItem: {
    marginRight: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

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
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  getMyPurchases,
  PurchasedItem,
  CollectionStats,
  formatPurchaseDate,
  getRarityColor,
  getOrderStatusColor,
} from '@/api/purchases';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';

export default function MyPurchasesScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  const loadPurchases = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getMyPurchases();

      if (data) {
        setItems(data.items);
        setStats(data.stats);
      } else {
        Alert.alert('Error', 'Failed to load your purchases');
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      Alert.alert('Error', 'An error occurred while loading your purchases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPurchases();
    }, [])
  );

  const onRefresh = () => {
    loadPurchases(true);
  };

  const renderHeader = () => {
    return (
      <>
        {/* Title with Back Arrow */}
        <View style={[styles.titleContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backArrow}
          >
            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>My Collection</Text>
        </View>

        {/* Stats Card */}
        {stats && (
          <View style={[styles.statsCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>Your Collection</Text>
            <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="diamond-outline" size={32} color="#FF6B35" />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.total_items}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Items</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={32} color="#4CAF50" />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>${stats.total_value.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Total Value</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={32} color="#2196F3" />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>${stats.avg_item_value.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Avg Value</Text>
          </View>
        </View>
          </View>
        )}
      </>
    );
  };

  const renderPurchaseCard = ({ item }: { item: PurchasedItem }) => {
    const rarityColor = getRarityColor(item.rarity);
    const statusColor = getOrderStatusColor(item.order_status);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
        activeOpacity={0.7}
        onPress={() => router.push(`/item/${item.id}`)}
      >
        <Image
          source={{ uri: item.photo_url }}
          style={styles.itemImage}
          contentFit="cover"
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityText}>{item.rarity}</Text>
            </View>
          </View>

          {item.description && (
            <Text style={[styles.itemDescription, { color: theme === 'dark' ? '#999' : '#666' }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Purchase Price</Text>
              <Text style={styles.purchasePrice}>${item.purchase_price.toLocaleString()}</Text>
            </View>
            {item.original_price !== item.purchase_price && (
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Original Price</Text>
                <Text style={styles.originalPrice}>${item.original_price.toLocaleString()}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={theme === 'dark' ? '#999' : '#666'} />
              <Text style={[styles.metaText, { color: theme === 'dark' ? '#999' : '#666' }]}>{formatPurchaseDate(item.purchase_date)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.order_status}</Text>
            </View>
          </View>

          {item.seller && (
            <View style={styles.sellerRow}>
              <Ionicons name="person-outline" size={16} color="#999" />
              <Text style={[styles.sellerText, { color: theme === 'dark' ? '#999' : '#666' }]}>Seller: {item.seller.username}</Text>
            </View>
          )}

          {/* Verify Ownership Button - Only show if not verified */}
          {!item.ownership_confirmed && item.order_status === 'delivered' && (
            <TouchableOpacity
              style={[styles.verifyButton, {
                backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F3E8FF',
                borderColor: theme === 'dark' ? '#B794F4' : '#6A0DAD'
              }]}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/confirm-ownership/${item.id}?itemName=${encodeURIComponent(item.name)}`);
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
              <Text style={[styles.verifyButtonText, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>Verify Ownership</Text>
            </TouchableOpacity>
          )}

          {/* Verified Badge */}
          {item.ownership_confirmed && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme === 'dark' ? 'rgba(56, 161, 105, 0.2)' : '#e6fffa' }]}>
              <Ionicons name="shield-checkmark" size={16} color="#38a169" />
              <Text style={styles.verifiedText}>Ownership Verified</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cart-outline" size={64} color={theme === 'dark' ? '#666' : '#ccc'} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Purchases Yet</Text>
      <Text style={[styles.emptyText, { color: theme === 'dark' ? '#999' : '#666' }]}>
        Start bidding and winning auctions to build your jewelry collection!
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/')}
      >
        <Ionicons name="search" size={20} color="#fff" />
        <Text style={styles.exploreButtonText}>Explore Auctions</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.loadingText, { color: theme === 'dark' ? '#999' : '#666' }]}>Loading your collection...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

      <Animated.FlatList
        style={{ backgroundColor: colors.background }}
        data={items}
        renderItem={renderPurchaseCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={items.length === 0 ? { ...styles.emptyListContent, paddingTop: HEADER_MAX_HEIGHT, backgroundColor: colors.background } : { ...styles.listContent, paddingTop: HEADER_MAX_HEIGHT, backgroundColor: colors.background }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      />
      <GlobalFooter />
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
  listContent: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
    marginTop: 24,
  },
  backArrow: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 68,
    left: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6A0DAD',
    fontWeight: '600',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  purchasePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sellerText: {
    fontSize: 12,
    color: '#999',
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
  exploreButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#6A0DAD',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#38a169',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
});

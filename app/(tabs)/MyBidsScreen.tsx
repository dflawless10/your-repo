import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  View,
  Image,
  FlatList,
  ScrollView,
  Modal,
  Alert,
  Switch,
  TextInput,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';

interface BidItem {
  bid_id: number;
  item_id: number;
  item_name: string;
  item_image: string;
  my_bid_amount: number;
  current_highest_bid: number;
  total_bids: number;
  my_total_bids_on_item: number;
  auction_ends_at: string;
  status: 'active' | 'won' | 'lost' | 'outbid';
  is_winning: boolean;
  final_price?: number;
  auto_bid_enabled?: boolean;
  auto_bid_max?: number;
  auto_bid_strategy?: 'aggressive' | 'moderate' | 'passive';
}

type TabType = 'active' | 'won' | 'lost';

export default function MyBidsScreen() {
  const router = useRouter();
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [bids, setBids] = useState<BidItem[]>([]);
  const [showAutoBidModal, setShowAutoBidModal] = useState(false);
  const [selectedBidItem, setSelectedBidItem] = useState<BidItem | null>(null);

  // Auto-bid settings
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState('');
  const [autoBidStrategy, setAutoBidStrategy] = useState<'aggressive' | 'moderate' | 'passive'>('moderate');

  useFocusEffect(
    useCallback(() => {
      fetchMyBids();
    }, [])
  );

  const fetchMyBids = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://10.0.0.170:5000/api/my-bids', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBids(data.bids || data.results || []);

      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupAutoBid = (item: BidItem) => {
    setSelectedBidItem(item);
    setAutoBidEnabled(item.auto_bid_enabled || false);
    setAutoBidMax(item.auto_bid_max?.toString() || '');
    setAutoBidStrategy(item.auto_bid_strategy || 'moderate');
    setShowAutoBidModal(true);
  };

  const saveAutoBidSettings = async () => {
    if (!selectedBidItem) return;

    const maxBid = Number.parseFloat(autoBidMax);
if (Number.isNaN(maxBid) || maxBid <= selectedBidItem.current_highest_bid) {
  Alert.alert('Invalid Amount', 'Max bid must be greater than current highest bid');
  return;
}



    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch('http://10.0.0.170:5000/api/auto-bid/setup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: selectedBidItem.item_id,
          enabled: autoBidEnabled,
          max_bid: maxBid,
          strategy: autoBidStrategy,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Auto-bid settings saved!');
        setShowAutoBidModal(false);
        await fetchMyBids(); // Refresh
      }
    } catch (error) {
      console.error('Failed to save auto-bid:', error);
      Alert.alert('Error', 'Failed to save auto-bid settings');
    }
  };

  const disableAutoBid = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`http://10.0.0.170:5000/api/auto-bid/disable/${itemId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Auto-bid disabled');
        await fetchMyBids(); // Refresh
      } else {
        Alert.alert('Error', 'Failed to disable auto-bid');
      }
    } catch (error) {
      console.error('Failed to disable auto-bid:', error);
      Alert.alert('Error', 'Failed to disable auto-bid');
    }
  };

  const filteredBids = bids.filter(bid => {
    if (activeTab === 'active') return bid.status === 'active' || bid.status === 'outbid';
    if (activeTab === 'won') return bid.status === 'won';
    if (activeTab === 'lost') return bid.status === 'lost';
    return false;
  });

  const renderBidCard = ({ item }: { item: BidItem }) => {
    const isWinning = item.is_winning;
    const timeRemaining = getTimeRemaining(item.auction_ends_at);
    const timeColor = getTimeRemainingColor(item.auction_ends_at);

    const pluralize = (count: number) => (count === 1 ? '' : 's');

    return (
      <TouchableOpacity
        style={styles.bidCard}
        onPress={() => router.push(`/item/${item.item_id}`)}
      >
        {/* Item Image */}
        <Image source={{ uri: item.item_image }} style={styles.itemImage} />

        {/* Content */}
        <View style={styles.bidContent}>
          {/* Item Name */}
          <Text style={styles.itemName} numberOfLines={2}>
            {item.item_name}
          </Text>

          {/* Status Badge */}
          <View style={styles.statusRow}>
            {item.status === 'active' && (
              <View style={[styles.statusBadge, isWinning ? styles.winningBadge : styles.outbidBadge]}>
                <Text style={styles.statusText}>
                  {isWinning ? '🏆 WINNING' : '⚠️ OUTBID'}
                </Text>
              </View>
            )}
            {item.status === 'won' && (
              <View style={[styles.statusBadge, styles.wonBadge]}>
                <Text style={styles.statusText}>✅ WON</Text>
              </View>
            )}
            {item.status === 'lost' && (
              <View style={[styles.statusBadge, styles.lostBadge]}>
                <Text style={styles.statusText}>❌ LOST</Text>
              </View>
            )}
          </View>

          {/* Bid Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>My Bid</Text>
              <Text style={styles.myBidAmount}>${item.my_bid_amount.toFixed(2)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Current High</Text>
              <Text style={styles.currentBidAmount}>${item.current_highest_bid.toFixed(2)}</Text>
            </View>
          </View>

          {/* Bid Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="hammer" size={14} color="#666" />
              <Text style={styles.statText}>{item.total_bids} total bids</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="repeat" size={14} color="#666" />
             <Text style={styles.statText}>
  My {item.my_total_bids_on_item} bid{pluralize(item.my_total_bids_on_item)}
</Text>
            </View>
          </View>

          {/* Time Remaining or Final Price */}
          {item.status === 'active' || item.status === 'outbid' ? (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color={timeColor} />
              <Text style={[styles.timeText, { color: timeColor }]}>{timeRemaining}</Text>
            </View>
          ) : (
            item.final_price && (
              <View style={styles.finalPriceRow}>
                <Text style={styles.finalPriceLabel}>Final Price:</Text>
                <Text style={styles.finalPriceAmount}>${item.final_price.toFixed(2)}</Text>
              </View>
            )
          )}

          {/* Auto-Bid Indicator */}
          {item.auto_bid_enabled && (
            <View style={styles.autoBidIndicator}>
              <View style={styles.autoBidInfo}>
                <Ionicons name="flash" size={14} color="#FFA500" />
                <Text style={styles.autoBidText}>
                  Auto-bid ON (Max: ${item.auto_bid_max}) • {item.auto_bid_strategy}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.disableAutoBidButton}
                onPress={(e) => {
                  e.stopPropagation();
                  Alert.alert(
                    'Disable Auto-Bid',
                    'Are you sure you want to disable auto-bidding for this item?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: () => disableAutoBid(item.item_id),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="close-circle" size={18} color="#F57C00" />
              </TouchableOpacity>
            </View>
          )}

          {/* Actions for Active Bids */}
          {(item.status === 'active' || item.status === 'outbid') && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/item/${item.item_id}`)}
              >
                <Text style={styles.actionButtonText}>Place Bid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.autoBidButton]}
                onPress={() => setupAutoBid(item)}
              >
                <Ionicons name="flash" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Auto-Bid</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const getTimeRemainingColor = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours <= 2) return '#FF6B6B'; // Red for <= 2 hours
    if (hours <= 24) return '#FFA500'; // Orange for <= 24 hours
    return '#4CAF50'; // Green for > 24 hours (48+ hours)
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Bids</Text>
          <Text style={styles.headerSubtitle}>Track your auction activity</Text>
        </View>
        <ActivityIndicator size="large" color="#6A0DAD" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <View style={styles.headerTitleRow}>
          <View style={styles.titleWithArrow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backArrow}
            >
              <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>My Bids</Text>
              <Text style={styles.headerSubtitle}>Track your auction activity</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => router.push('/auto-bid-stats')}
          >
            <Ionicons name="stats-chart" size={20} color="#6A0DAD" />
            <Text style={styles.statsButtonText}>Stats</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['active', 'won', 'lost'] as TabType[]).map((tab) => {
          const count = bids.filter(b => {
            if (tab === 'active') return b.status === 'active' || b.status === 'outbid';
            return b.status === tab;
          }).length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bids List */}
      {filteredBids.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="hammer-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>
            {activeTab === 'active' && 'No active bids yet'}
            {activeTab === 'won' && 'No won auctions yet'}
            {activeTab === 'lost' && 'No lost auctions yet'}
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.exploreButtonText}>Explore Auctions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <RNAnimated.FlatList
          data={filteredBids}
          renderItem={renderBidCard}
          keyExtractor={(item) => `${item.bid_id}-${item.item_id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={RNAnimated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* Auto-Bid Setup Modal */}
      <Modal
        visible={showAutoBidModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAutoBidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Auto-Bid Setup</Text>
              <TouchableOpacity onPress={() => setShowAutoBidModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {selectedBidItem && (
                <>
                  {/* Item Info */}
                  <View style={styles.modalItemInfo}>
                    <Image source={{ uri: selectedBidItem.item_image }} style={styles.modalItemImage} />
                    <Text style={styles.modalItemName}>{selectedBidItem.item_name}</Text>
                    <Text style={styles.modalItemPrice}>Current: ${selectedBidItem.current_highest_bid.toFixed(2)}</Text>
                  </View>

                  {/* Enable/Disable Toggle */}
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Enable Auto-Bid</Text>
                    <Switch
                      value={autoBidEnabled}
                      onValueChange={setAutoBidEnabled}
                      trackColor={{ false: '#CCC', true: '#6A0DAD' }}
                    />
                  </View>

                  {autoBidEnabled && (
                    <>
                      {/* Max Bid Input */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Maximum Bid Amount</Text>
                        <View style={styles.inputWrapper}>
                          <Text style={styles.dollarSign}>$</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={autoBidMax}
                            onChangeText={setAutoBidMax}
                            placeholder="0.00"
                            style={styles.input}
                           />

                        </View>
                        <Text style={styles.inputHint}>
                          Must be higher than current bid (${selectedBidItem.current_highest_bid.toFixed(2)})
                        </Text>
                      </View>

                      {/* Strategy Selection */}
                      <View style={styles.strategyContainer}>
                        <Text style={styles.strategyTitle}>Bidding Strategy</Text>

                        <TouchableOpacity
                          style={[styles.strategyCard, autoBidStrategy === 'aggressive' && styles.strategyCardActive]}
                          onPress={() => setAutoBidStrategy('aggressive')}
                        >
                          <View style={styles.strategyHeader}>
                            <Ionicons name="flash" size={24} color={autoBidStrategy === 'aggressive' ? '#FF6B6B' : '#666'} />
                            <Text style={[styles.strategyName, autoBidStrategy === 'aggressive' && styles.strategyNameActive]}>
                              AGGRESSIVE
                            </Text>
                          </View>
                          <Text style={styles.strategyDesc}>Waits until last 2 minutes, then bids every 30 seconds. Best for high-competition items.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.strategyCard, autoBidStrategy === 'moderate' && styles.strategyCardActive]}
                          onPress={() => setAutoBidStrategy('moderate')}
                        >
                          <View style={styles.strategyHeader}>
                            <Ionicons name="pulse" size={24} color={autoBidStrategy === 'moderate' ? '#6A0DAD' : '#666'} />
                            <Text style={[styles.strategyName, autoBidStrategy === 'moderate' && styles.strategyNameActive]}>
                              MODERATE
                            </Text>
                          </View>
                          <Text style={styles.strategyDesc}>Bids every 5 minutes when outbid. Balanced approach for most auctions.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.strategyCard, autoBidStrategy === 'passive' && styles.strategyCardActive]}
                          onPress={() => setAutoBidStrategy('passive')}
                        >
                          <View style={styles.strategyHeader}>
                            <Ionicons name="moon" size={24} color={autoBidStrategy === 'passive' ? '#4CAF50' : '#666'} />
                            <Text style={[styles.strategyName, autoBidStrategy === 'passive' && styles.strategyNameActive]}>
                              PASSIVE
                            </Text>
                          </View>
                          <Text style={styles.strategyDesc}>Only bids in final 30 minutes every 10 minutes. Stays under radar.</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Save Button */}
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveAutoBidSettings}
                  >
                    <Text style={styles.saveButtonText}>Save Auto-Bid Settings</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 48,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 12,
    padding: 4,
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
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  tabsContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 130,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 99,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#6A0DAD',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 300,
  },
  bidCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  itemImage: {
    width: 120,
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  bidContent: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  statusRow: {
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  winningBadge: {
    backgroundColor: '#4CAF50',
  },
  outbidBadge: {
    backgroundColor: '#FF9800',
  },
  wonBadge: {
    backgroundColor: '#4CAF50',
  },
  lostBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  myBidAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  currentBidAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  finalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  finalPriceLabel: {
    fontSize: 13,
    color: '#666',
  },
  finalPriceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  autoBidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  autoBidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  autoBidText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
  },
  disableAutoBidButton: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBidButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#6A0DAD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalItemInfo: {
    alignItems: 'center',
    padding: 16,
  },
  modalItemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    // ❌ remove border / outline
    // ✅ use React Native props instead:
    borderWidth: 0,          // remove border
    // outline is not supported in RN — just omit it
  },

  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  strategyContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  strategyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  strategyCardActive: {
    borderColor: '#6A0DAD',
    backgroundColor: '#F3E5F5',
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  strategyNameActive: {
    color: '#6A0DAD',
  },
  strategyDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  saveButton: {
    margin: 16,
    backgroundColor: '#6A0DAD',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});



import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import {
  getSentOffers,
  getOfferTimeRemaining,
  getOfferStatusColor,
  getOfferStatusLabel,
  Offer,
} from '@/api/offers';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';



export default function SentOffersScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fade in header title and arrow - wait for screen to fully render first
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000, // 2 seconds - slow and dramatic
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500); // 500ms delay - let screen render fully first

    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const data = await getSentOffers();
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

  const handleOfferPress = (offer: Offer) => {
    router.push(`/item/${offer.item_id}`);
  };

  const renderOfferCard = ({ item }: { item: Offer }) => {
    const timeRemaining = getOfferTimeRemaining(item.expires_at);
    const statusColor = getOfferStatusColor(item.status);
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity
        style={[styles.offerCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
        onPress={() => handleOfferPress(item)}
        activeOpacity={0.7}
      >
        {/* Item Info */}
        <View style={styles.offerHeader}>
          <Image source={{ uri: item.photo_url }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.item_name}
            </Text>
            <Text style={[styles.sellerName, { color: theme === 'dark' ? '#999' : '#666' }]}>Seller: {item.seller_username}</Text>
          </View>
        </View>

        {/* Offer Amount */}
        <View style={[styles.amountContainer, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
          <Text style={[styles.amountLabel, { color: theme === 'dark' ? '#999' : '#666' }]}>Your Offer</Text>
          <Text style={styles.amountValue}>${item.offer_amount.toFixed(2)}</Text>
        </View>

        {/* Message */}
        {item.message && (
          <View style={[styles.messageContainer, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#EBF8FF' }]}>
            <Ionicons name="chatbubble-outline" size={16} color={theme === 'dark' ? '#999' : '#666'} />
            <Text style={[styles.messageText, { color: theme === 'dark' ? '#CCC' : '#2C5282' }]}>{item.message}</Text>
          </View>
        )}

        {/* Status & Time */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getOfferStatusLabel(item.status)}</Text>
          </View>
          {isPending && (
            <Text style={[styles.timeRemaining, { color: '#FF6B6B' }]}>{timeRemaining}</Text>
          )}
        </View>

        {/* Status Messages */}
        {item.status === 'accepted' && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.successMessageText}>
              Offer accepted! Check your orders.
            </Text>
          </View>
        )}

        {item.status === 'declined' && (
          <View style={styles.declinedMessage}>
            <Ionicons name="close-circle" size={20} color="#F44336" />
            <Text style={styles.declinedMessageText}>
              Seller declined this offer
            </Text>
          </View>
        )}

        {item.status === 'expired' && (
          <View style={styles.expiredMessage}>
            <Ionicons name="time-outline" size={20} color="#9E9E9E" />
            <Text style={styles.expiredMessageText}>
              Offer expired without response
            </Text>
          </View>
        )}

        {/* Created Date */}
        <Text style={styles.createdDate}>
          Sent {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} />

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
        ListHeaderComponent={
          <Animated.View style={[
            styles.pageHeader,
            {
              opacity: headerOpacity,
              transform: [{ scale: headerScale }],
              backgroundColor: colors.background,
              borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5'
            }
          ]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
               <Ionicons name="arrow-back" size={28} color="#B794F4"  />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Sent Offers</Text>
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="paper-plane-outline" size={64} color={theme === 'dark' ? '#666' : '#CCC'} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No offers sent yet</Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#666' }]}>
              Make offers on expired items to negotiate with sellers
            </Text>
          </View>
        }
      />
      <GlobalFooter />

    </View>
  );
}

const createStyles = (isDark: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
    paddingTop: 60,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  listContent: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  offerCard: {
    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
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
    marginBottom: 6,
  },
  sellerName: {
    fontSize: 14,
  },
  amountContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
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
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F7ED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  successMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D7A4F',
  },
  declinedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  declinedMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
  },
  expiredMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  expiredMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

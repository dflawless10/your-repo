import React from 'react';
import { View, Text, Image, Button, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { AuctionItem } from '@/types/items';
import {Ionicons} from '@expo/vector-icons';
import {formatTimeWithSeconds} from '@/utils/time';
import {router} from 'expo-router';

type FavoriteCardProps = {
  item: AuctionItem;
  handleBid: () => void;
  handleUnfavorite: () => void;
};

const FavoriteCard: React.FC<FavoriteCardProps> = ({ item, handleBid, handleUnfavorite }) => {
  const sparkle = useSharedValue(1);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }],
  }));

  const triggerSparkle = () => {
    sparkle.value = withRepeat(withTiming(1.5, { duration: 150 }), 2, true);
  };

  const playBleat = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./assets/bleat.mp3'));
      await sound.playAsync();
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Failed to play goat bleat:', error);
    }
  };

  const onDiamondPress = async () => {
    triggerSparkle();
    await playBleat();
  };

  const showGoatBadge = item.isFavorite && (item.mascot?.emoji || '🐐');
  const isMustSell = item.is_must_sell === 1 || item.selling_strategy === 'must_sell';
  const hasBuyNow = Boolean(item.buy_it_now);
  const hasPriceDrop = item.original_price && item.original_price > item.price;

  return (
    <View style={styles.card} testID={`favorite-card-${item.id}`}>
      <View style={styles.imageWrapper}>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        )}

        {/* Strategy Badges */}
        {isMustSell && (
          <View style={styles.mustSellBadge}>
            <Ionicons name="flash" size={10} color="#FFF" />
            <Text style={styles.badgeText}>MUST SELL</Text>
          </View>
        )}
        {!isMustSell && hasBuyNow && (
          <View style={styles.buyNowBadge}>
            <Text style={styles.badgeText}>BUY NOW</Text>
          </View>
        )}
        {!isMustSell && !hasBuyNow && hasPriceDrop && (
          <View style={styles.priceDropBadge}>
            <Ionicons name="trending-down" size={10} color="#FFF" />
            <Text style={styles.badgeText}>PRICE DROP</Text>
          </View>
        )}

        {showGoatBadge && (
          <Text style={styles.goatBadge} accessibilityLabel="Favorite Goat Badge">
            {item.mascot?.emoji || '🐐'}
          </Text>
        )}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{item.title || item.name || 'Untitled Item'}</Text>
        <Animated.View style={sparkleStyle}>
          <Text
            style={styles.diamond}
            onPress={onDiamondPress}
            accessibilityLabel="Tap to sparkle and bleat"
          >
            💎
          </Text>
        </Animated.View>
      </View>

      <Text style={styles.description}>
        {item.description || 'No description available.'}
      </Text>

      {/* Time Remaining */}
      {item.auction_ends_at && (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.timeText}>
            {formatTimeWithSeconds(item.auction_ends_at, Date.now())}
          </Text>
        </View>
      )}

      {/* Seller Info with Rating */}
      {item.seller && (
        <TouchableOpacity
          style={styles.sellerRow}
          onPress={(e) => {
            e.stopPropagation();
            if (item.seller?.id) {
              router.push(`/seller/${item.seller.id}` as any);
            }
          }}
        >
          {item.seller.avatar && (
            <Image source={{ uri: item.seller.avatar }} style={styles.sellerAvatar} />
          )}
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.seller.username}
            </Text>
            {typeof item.seller.avg_rating === 'number' && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {item.seller.avg_rating.toFixed(1)}{' '}
                </Text>
                <Text style={styles.reviewCount}>
                  ({item.seller.total_reviews || 0})
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <Button title="Place Bid" onPress={handleBid} />
        <Button title="Remove Favorite" onPress={handleUnfavorite} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
  },
  diamond: {
    fontSize: 24,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  goatBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 24,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mustSellBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E53E3E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  buyNowBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  priceDropBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  sellerInfo: {
    flex: 1,
    gap: 2,
  },
  sellerName: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 11,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default FavoriteCard;

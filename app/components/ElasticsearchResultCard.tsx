 import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNowStrict } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

type SearchResultItem = {
  item_id: number;
  name?: string;
  description?: string;
  photo_url?: string;
  price: number;
  highest_bid?: number;
  bid_count?: number;
  category?: string;
  rarity?: 'common' | 'rare' | 'legendary';
  auction_ends_at?: string;
  selling_strategy?: string;
  buy_it_now?: number;
  is_must_sell?: number;
  _score?: number;
};

type Props = {
  item: SearchResultItem;
  onPress?: (itemId: number) => void;
  onHeartPress?: (itemId: number) => void;
  isFavorited?: boolean;
  showRelevanceScore?: boolean;
};

export const ElasticsearchResultCard: React.FC<Props> = ({
  item,
  onPress,
  onHeartPress,
  isFavorited = false,
  showRelevanceScore = false,
}) => {
  const router = useRouter();
  const placeholder = require('../../assets/goat-icon.png');

  // Track favorite state internally
  const [isLocalFavorited, setIsLocalFavorited] = useState(isFavorited);

  const displayName =
    item.name?.trim() ||
    (item as any).title?.trim() ||
    `Item #${item.item_id}`;

  const isMustSell = item.selling_strategy === 'must_sell' || Number(item.is_must_sell) === 1;
  const hasBuyNow = Boolean(item.buy_it_now);
  const isBuyNow = item.selling_strategy === 'buy_it_now';

  // Calculate display price based on selling strategy
  let displayPrice = 0;
  let priceLabel = 'CURRENT';

  if (isBuyNow && item.buy_it_now) {
    // Buy It Now items: show buy_it_now price
    displayPrice = item.buy_it_now;
    priceLabel = 'BUY NOW';
  } else if (isMustSell) {
    // Must Sell items: show highest bid if available, otherwise "BEST OFFER"
    if (item.highest_bid && item.highest_bid > 0) {
      displayPrice = item.highest_bid;
      priceLabel = 'CURRENT BID';
    } else if (item.price && item.price > 0) {
      displayPrice = item.price;
      priceLabel = 'STARTING BID';
    } else {
      displayPrice = 0;
      priceLabel = 'BEST OFFER';
    }
  } else {
    // Regular auctions: show the highest bid or starting price
    displayPrice = item.highest_bid ?? item.price ?? 0;
    priceLabel = item.highest_bid ? 'CURRENT BID' : 'STARTING BID';
  }

  // Rarity configuration
  type RarityKey = 'legendary' | 'rare' | 'common';

  interface RarityConfigEntry {
    gradient: readonly [string, string];
    borderColor: string;
    shadowColor: string;
    icon: string;
    label: string;
    glowColor: string;
  }

  const rarityConfig: Record<RarityKey, RarityConfigEntry> = {
    legendary: {
      gradient: ['#FFD700', '#FFA500'],
      borderColor: '#FFD700',
      shadowColor: '#FFD700',
      icon: '💎',
      label: 'Legendary',
      glowColor: 'rgba(255, 215, 0, 0.3)',
    },
    rare: {
      gradient: ['#9B59B6', '#8E44AD'],
      borderColor: '#9B59B6',
      shadowColor: '#9B59B6',
      icon: '✨',
      label: 'Rare',
      glowColor: 'rgba(155, 89, 182, 0.3)',
    },
    common: {
      gradient: ['#95a5a6', '#7f8c8d'],
      borderColor: '#95a5a6',
      shadowColor: '#000',
      icon: '🌾',
      label: 'Common',
      glowColor: 'rgba(149, 165, 166, 0.2)',
    },
  };

  const normalizeRarity = (value: unknown): RarityKey => {
    return value === 'legendary' || value === 'rare' || value === 'common' ? value : 'common';
  };

  const rarity = normalizeRarity(item.rarity);
  const config = rarityConfig[rarity];

  // Time urgency color
  const getTimeColor = (): { color: string; fontWeight: '600' | 'bold' } => {
    if (!item.auction_ends_at) return { color: '#666', fontWeight: '600' };

    const now = Date.now();
    const end = new Date(item.auction_ends_at).getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);

    if (diffHours <= 2) {
      return { color: '#E53E3E', fontWeight: 'bold' };
    } else if (diffHours <= 24) {
      return { color: '#c53030', fontWeight: '600' };
    }
    return { color: '#38a169', fontWeight: '600' };
  };

  const timeStyle = getTimeColor();
  const timeRemaining = item.auction_ends_at
    ? formatDistanceToNowStrict(new Date(item.auction_ends_at), { addSuffix: false })
    : null;

  const handlePress = () => {
    if (onPress) {
      onPress(item.item_id);
    } else {
      router.push(`/item/${item.item_id}`);
    }
  };

  const handleHeartPress = async (e: any) => {
    e.stopPropagation();

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.warn('🐐 ElasticsearchCard: No token found');
        return;
      }

      // Toggle favorite in backend
      const newFavoriteStatus = !isLocalFavorited;

      // Add or Remove from favorites
      const fetchUrl = newFavoriteStatus
        ? `${API_BASE_URL}/api/favorites`
        : `${API_BASE_URL}/api/favorites/${item.item_id}`;
      const fetchMethod = newFavoriteStatus ? 'POST' : 'DELETE';

      await fetch(fetchUrl, {
        method: fetchMethod,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: newFavoriteStatus ? JSON.stringify({ item_id: item.item_id }) : null,
      });

      console.log(`🐐 ElasticsearchCard: Item ${item.item_id} ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`);

      // Call parent handler to update state and local state
      setIsLocalFavorited(newFavoriteStatus);
      if (onHeartPress) {
        onHeartPress(item.item_id);
      }
    } catch (err) {
      console.error('🐐 ElasticsearchCard: Failed to toggle favorite:', err);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.95}
      style={[
        styles.cardContainer,
        rarity !== 'common' && {
          borderColor: config.borderColor,
          borderWidth: 2,
          shadowColor: config.shadowColor,
        },
      ]}
    >
      {/* Rarity Glow Effect */}
      {rarity !== 'common' && (
        <View style={[styles.glowEffect, { backgroundColor: config.glowColor }]} />
      )}

      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={item.photo_url ? { uri: item.photo_url } : placeholder}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Image Overlay Gradient */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.imageGradient} />

        {/* Top Badges Row */}
        <View style={styles.topBadgesRow}>
          {/* Rarity Badge */}
          {rarity !== 'common' && (
            <LinearGradient
              colors={['#FF6B35', '#FFB347']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rarityBadge}
            >
              <Text style={styles.rarityIcon}>{config.icon}</Text>
              <Text style={styles.rarityText}>{config.label}</Text>
            </LinearGradient>
          )}

          {/* Must Sell Badge */}
          {isMustSell && (
            <View style={styles.mustSellBadge}>
              <MaterialCommunityIcons name="fire" size={12} color="#fff" />
              <Text style={styles.mustSellText}>MUST SELL</Text>
            </View>
          )}

          {/* Buy Now Badge */}
          {hasBuyNow && !isMustSell && (
            <View style={styles.buyNowBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#fff" />
              <Text style={styles.buyNowText}>BUY NOW</Text>
            </View>
          )}
        </View>

        {/* Heart Icon */}
        {onHeartPress && (
          <TouchableOpacity
            onPress={handleHeartPress}
            style={styles.heartButton}
            activeOpacity={0.8}
          >
            <View style={styles.heartBackground}>
              <Ionicons
                name={isLocalFavorited ? 'heart' : 'heart-outline'}
                size={22}
                color={isLocalFavorited ? '#FF6B6B' : '#666'}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Relevance Score (Debug Mode) */}
        {showRelevanceScore && item._score && (
          <View style={styles.scoreBadge}>
            <MaterialCommunityIcons name="chart-line" size={10} color="#fff" />
            <Text style={styles.scoreText}>{item._score.toFixed(1)}</Text>
          </View>
        )}

        {/* Price Overlay on Image */}
        <View style={styles.priceOverlay}>
          <LinearGradient
            colors={
              isBuyNow
                ? ['rgba(16, 185, 129, 0.95)', 'rgba(5, 150, 105, 0.95)']
                : isMustSell
                ? ['rgba(239, 68, 68, 0.95)', 'rgba(220, 38, 38, 0.95)']
                : ['rgba(106, 13, 173, 0.95)', 'rgba(88, 10, 143, 0.95)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priceGradient}
          >
            <Text style={styles.priceLabel}>{priceLabel}</Text>
            {displayPrice > 0 ? (
              <Text style={styles.priceAmount}>${displayPrice.toFixed(2)}</Text>
            ) : (
              <Text style={[styles.priceAmount, { fontSize: 16 }]}>Send Offer</Text>
            )}
          </LinearGradient>
        </View>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {displayName}
        </Text>

        {/* Description */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Bid Count */}
          {(item.bid_count ?? 0) > 0 && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="gavel" size={14} color="#6A0DAD" />
              <Text style={styles.statText}>{item.bid_count} bids</Text>
            </View>
          )}

          {/* Category */}
          {item.category && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="tag-outline" size={14} color="#666" />
              <Text style={styles.statText}>{item.category}</Text>
            </View>
          )}

          {/* Time Remaining */}
          {timeRemaining && (
            <View style={[styles.statItem, styles.timeItem]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={timeStyle.color} />
              <Text style={[styles.statText, { color: timeStyle.color, fontWeight: timeStyle.fontWeight }]}>
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>

        {/* Search Match Indicator */}
        <View style={styles.matchIndicator}>
          <MaterialCommunityIcons name="magnify" size={12} color="#6A0DAD" />
          <Text style={styles.matchText}>Search Match</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    zIndex: -1,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  topBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 2,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  rarityIcon: {
    fontSize: 12,
  },
  rarityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mustSellBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  mustSellText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  buyNowText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  heartBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    overflow: 'hidden',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  priceGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  priceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  priceAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 23,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeItem: {
    marginLeft: 'auto',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  matchText: {
    fontSize: 11,
    color: '#6A0DAD',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default ElasticsearchResultCard;

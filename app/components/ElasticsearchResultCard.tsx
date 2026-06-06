import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatTimeWithSeconds, normalizeTimestamp } from '@/utils/time';
import { useTheme } from '@/app/theme/ThemeContext';



// Card width is now calculated reactively in the component

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
  appraised_price?: number;
  _score?: number;
};

type Props = {
  item: SearchResultItem;
  onPress?: (itemId: number) => void;
  showRelevanceScore?: boolean;
};


export const ElasticsearchResultCard: React.FC<Props> = ({
  item,
  onPress,
  showRelevanceScore = false,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const placeholder = require('../../assets/goat-icon.png');

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
    // Must Sell items: show the highest bid if available, otherwise "BEST OFFER"
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

  // Normalize space-format dates from ES ("2024-01-15 10:30:00") to ISO UTC
  const normalizeEndDate = (raw: string): Date => {
    const hasTZ = raw.includes('T') || raw.endsWith('Z') || raw.includes('+');
    return new Date(hasTZ ? raw : raw.replace(' ', 'T') + 'Z');
  };

  // Time urgency color — expired items show gray, ≤2h red+bold, ≤24h red, >24h green
  const getTimeColor = (): { color: string; fontWeight: '600' | 'bold' } => {
    if (!item.auction_ends_at) return { color: '#666', fontWeight: '600' };

    const now = Date.now();
    const end = normalizeEndDate(item.auction_ends_at).getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);

    if (diffHours <= 0) return { color: '#666', fontWeight: '600' }; // expired
    if (diffHours <= 2) return { color: '#E53E3E', fontWeight: 'bold' };
    if (diffHours <= 24) return { color: '#DD6B20', fontWeight: '600' };
    return { color: '#38A169', fontWeight: '600' };
  };

  const timeStyle = getTimeColor();
  const normalizedEndsAt = item.auction_ends_at
  ? normalizeTimestamp(item.auction_ends_at)
  : null;
  const isExpired = normalizedEndsAt ? new Date(normalizedEndsAt).getTime() <= Date.now() : false;
  const timeRemaining = normalizedEndsAt && !isExpired
    ? formatTimeWithSeconds(normalizedEndsAt, Date.now())
    : null;

  console.log('⏰ TIME DEBUG', {
  id: item.item_id,
  auction_ends_at: item.auction_ends_at,
  end_time: (item as any).end_time,
  expires_at: (item as any).expires_at,
});


  const handlePress = () => {
    if (onPress) {
      onPress(item.item_id);
    } else {
      router.push(`/item/${item.item_id}`);
    }
  };

  const handleSharePress = async (e: any) => {
    e.stopPropagation();

    try {
      const shareUrl = `https://bidgoat.com/listing/${item.item_id}`;
      const message = `Check out this ${displayName} on BidGoat!\n\nPrice: $${displayPrice.toFixed(2)}\n\nView: ${shareUrl}`;

      const result = await Share.share({
        message,
        title: displayName,
        url: shareUrl,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Shared!', 'Thanks for spreading the word!');
      }
    } catch (err) {
      console.error('🐐 ElasticsearchCard: Failed to share:', err);
      Alert.alert('Error', 'Could not share this item');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.95}
      style={[
        styles.cardContainer,
        { backgroundColor: colors.surface },
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
              <MaterialCommunityIcons name="fire" size={10} color="#fff" />
              <Text style={styles.mustSellText}>MUST SELL</Text>
            </View>
          )}

          {/* Buy Now Badge */}
          {hasBuyNow && !isMustSell && (
            <View style={styles.buyNowBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={10} color="#fff" />
              <Text style={styles.buyNowText}>BUY NOW</Text>
            </View>
          )}
        </View>

        {/* Share Button */}
        <TouchableOpacity
          onPress={handleSharePress}
          style={styles.shareButton}
          activeOpacity={0.8}
        >
          <View style={styles.shareBackground}>
            <Ionicons
              name="share-social-outline"
              size={22}
              color="#6A0DAD"
            />
          </View>
        </TouchableOpacity>

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
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2} ellipsizeMode="tail">
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
              <MaterialCommunityIcons name="gavel" size={14} color="#4CAF50" />
              <Text style={styles.statText}>{item.bid_count} bids</Text>
            </View>
          )}

          {/* Category */}
          {item.category && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="tag-outline" size={14} color="#e53e3e" />
              <Text style={styles.statText}>{item.category}</Text>
            </View>
          )}

          {/* Time Remaining */}
          {timeRemaining && (
            <View style={[styles.statItem, styles.timeItem]}>
              <Ionicons name="time-outline" size={14} color={timeStyle.color} />
              <Text style={[styles.statText, { color: timeStyle.color, fontWeight: timeStyle.fontWeight }]}>
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>

        {/* Appraised Value — Must Sell only */}
        {isMustSell && item.appraised_price && item.appraised_price > 0 && (
          <View style={styles.appraisalRow}>
            <MaterialCommunityIcons name="certificate-outline" size={13} color="#D97706" />
            <Text style={styles.appraisalText}>
              WoW! Appraised at ${item.appraised_price!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}

        {/* Search Match Indicator */}
        <View style={styles.matchIndicator}>
          <MaterialCommunityIcons name="magnify" size={16} color="#6A0DAD" />
          <Text style={styles.matchText}>Search Match</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 16,
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
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  mustSellText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  buyNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shareButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  shareBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  priceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  priceAmount: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
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
    lineHeight: 23,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#718096',
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
    color: '#FF6B35',
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
    color: '#10B981',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  appraisalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  appraisalText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
    flexShrink: 1,
  },
});

export default ElasticsearchResultCard;

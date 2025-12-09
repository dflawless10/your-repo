import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import UnTappedHeart from '../assets/unTappedHeart.svg';
import TappedHeart from '../assets/TappedHeart.svg';

export type HybridAuctionItem = {
  id: string | number;
  auction_id?: number;
  item_id?: number;
  name: string;
  title?: string;
  description?: string;
  price: number;
  starting_bid?: number;
  highest_bid?: number;
  current_bid?: number;
  buy_it_now?: number;
  original_price?: number;
  photo_url?: string;
  imageUrl?: string;
  auction_ends_at?: string;
  end_time?: string;
  category?: string;
  tags?: string;
  rarity?: 'common' | 'rare' | 'legendary';
  is_sold?: number | boolean;
  status?: 'active' | 'sold' | 'deleted' | 'closed';
  is_must_sell?: number | boolean;
  mustSell?: string | boolean;
  is_super_deal?: boolean;
  seller?: {
    username?: string;
    name?: string;
  };
  seller_username?: string;
};

type Props = {
  item: HybridAuctionItem;
  layout?: 'vertical' | 'horizontal';
  onPress?: () => void;
  onHeartPress?: (id: string | number) => void;
  isFavorited?: boolean;
  showBadges?: boolean;
  showRarity?: boolean;
  showTags?: boolean;
};

export const getRarityBadge = (rarity?: 'common' | 'rare' | 'legendary') => {
  switch (rarity) {
    case 'legendary':
      return '💎 Legendary';
    case 'rare':
      return '✨ Rare';
    case 'common':
      return '🌾 Common';
    default:
      return null;
  }
};

export const HybridAuctionCard: React.FC<Props> = ({
  item,
  layout = 'vertical',
  onPress,
  onHeartPress,
  isFavorited = false,
  showBadges = true,
  showRarity = true,
  showTags = true,
}) => {
  // Normalize data from different sources
  const itemId = item.id || item.auction_id || item.item_id;
  const title = item.name || item.title || 'Unnamed Item';
  const imageUrl = item.photo_url || item.imageUrl || 'https://your-image-url.com/goat.png';
  const displayPrice = item.highest_bid || item.current_bid || item.price || item.starting_bid || 0;
  const auctionEnds = item.auction_ends_at || item.end_time;
  const sellerName = item.seller?.username || item.seller?.name || item.seller_username;

  // Calculate states
  const isSold = item.status === 'sold' || item.is_sold === 1 || item.is_sold === true;
  const isMustSell = item.is_must_sell === 1 || item.is_must_sell === true || item.mustSell;
  const hasBuyItNow = Boolean(item.buy_it_now);
  const hasDiscount = item.original_price && item.original_price > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((item.original_price! - displayPrice) / item.original_price!) * 100)
    : 0;

  // Rarity styling
  const rarityStyles = item.rarity
    ? {
        common: { borderColor: '#ccc' },
        rare: { borderColor: '#6a0dad', borderWidth: 2 },
        legendary: {
          borderColor: '#ffd700',
          borderWidth: 3,
          shadowColor: '#ffd700',
          shadowOpacity: 0.5,
        },
      }[item.rarity]
    : null;

  const rarityColorMap = {
    common: '#666',
    rare: '#6a0dad',
    legendary: '#ffd700',
  };

  const timeColor = item.rarity ? rarityColorMap[item.rarity] : '#666';

  // Time remaining
  const timeLeft = auctionEnds
    ? formatDistanceToNow(new Date(auctionEnds), { addSuffix: true })
    : null;

  // Tags
  const tagList = item.tags
    ?.split(',')
    .map((tag: string) => tag.trim())
    .filter(Boolean)
    .slice(0, 3) || [];

  const cardStyle = [
    layout === 'vertical' ? styles.cardVertical : styles.cardHorizontal,
    rarityStyles,
    isSold && styles.soldCard,
  ];

  return (
    <TouchableOpacity onPress={onPress} style={cardStyle} activeOpacity={0.9}>
      {/* Image Container */}
      <View style={layout === 'vertical' ? styles.imageContainerVertical : styles.imageContainerHorizontal}>
        <Image
          source={{ uri: imageUrl }}
          style={[
            layout === 'vertical' ? styles.imageVertical : styles.imageHorizontal,
            isSold && styles.soldImage,
          ]}
          resizeMode="cover"
        />

        {/* Heart Icon - Top Right of Image */}
        {onHeartPress && itemId !== undefined && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onHeartPress(itemId);
            }}
            style={styles.heartIcon}
            activeOpacity={0.7}
          >
            {isFavorited ? (
              <TappedHeart width={24} height={24} />
            ) : (
              <UnTappedHeart width={24} height={24} />
            )}
          </TouchableOpacity>
        )}

        {/* Badges on Image */}
        {showBadges && (
          <>
            {/* Sold Badge */}
            {isSold && (
              <View style={styles.soldBadge}>
                <Text style={styles.soldBadgeText}>SOLD</Text>
              </View>
            )}

            {/* Must Sell Badge */}
            {!isSold && isMustSell && (
              <View style={styles.mustSellBadge}>
                <Text style={styles.mustSellText}>MUST SELL</Text>
              </View>
            )}

            {/* Buy It Now Badge */}
            {!isSold && !isMustSell && hasBuyItNow && (
              <View style={[styles.buyItNowBadge, layout === 'horizontal' && { top: 4, left: 4 }]}>
                <Text style={styles.buyItNowText}>BUY NOW</Text>
              </View>
            )}

            {/* Discount Badge */}
            {!isSold && !isMustSell && !hasBuyItNow && hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Content Container */}
      <View style={layout === 'vertical' ? styles.contentVertical : styles.contentHorizontal}>
        {/* Rarity Badge */}
        {showRarity && item.rarity && layout === 'vertical' && (
          <View style={styles.rarityBadgeContainer}>
            <Text style={styles.rarityBadgeText}>{getRarityBadge(item.rarity)}</Text>
          </View>
        )}

        {/* Title */}
        <Text
          style={[styles.title, isSold && styles.soldText, layout === 'horizontal' && styles.titleHorizontal]}
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* Description (only in horizontal layout) */}
        {layout === 'horizontal' && item.description && (
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {item.description.length > 120
              ? item.description.substring(0, 117).trim() + '...'
              : item.description}
          </Text>
        )}

        {/* Price */}
        <Text style={[styles.price, layout === 'horizontal' && styles.priceHorizontal]}>
          {isMustSell && displayPrice === 0
            ? 'Best Offer'
            : `$${displayPrice.toFixed(2)}`}
        </Text>

        {/* Seller Info */}
        {sellerName && (
          <Text style={styles.seller} numberOfLines={1}>
            by {sellerName}
          </Text>
        )}

        {/* Time Left */}
        {timeLeft && !isSold && (
          <Text
            style={[
              styles.timeLeft,
              {
                color: timeColor,
                textShadowColor: item.rarity === 'legendary' ? '#ffd700' : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: item.rarity === 'legendary' ? 6 : 0,
              },
            ]}
          >
            ⏰ {timeLeft}
          </Text>
        )}

        {/* Tags */}
        {showTags && tagList.length > 0 && (
          <View style={styles.tagContainer}>
            {tagList.map((tag: string, index: number) => (
              <View key={`${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Vertical Layout (like AuctionCard)
  cardVertical: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  imageContainerVertical: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
    marginBottom: 12,
  },
  imageVertical: {
    width: '100%',
    height: '100%',
  },
  contentVertical: {
    width: '100%',
    alignItems: 'center',
  },

  // Horizontal Layout (like CardContent)
  cardHorizontal: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  imageContainerHorizontal: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
  },
  imageHorizontal: {
    width: '100%',
    height: '100%',
  },
  contentHorizontal: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'flex-start',
  },

  // Common Styles
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  titleHorizontal: {
    textAlign: 'left',
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
    color: '#444',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A0DAD',
    marginTop: 4,
  },
  priceHorizontal: {
    fontSize: 18,
  },
  seller: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  timeLeft: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Badges
  soldBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -15 }],
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 2,
  },
  soldBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mustSellBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  mustSellText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyItNowBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  buyItNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rarityBadgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  rarityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // Tags
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#444',
    fontSize: 11,
    fontWeight: '500',
  },

  // Sold State
  soldCard: {
    opacity: 0.7,
    backgroundColor: '#f5f5f5',
  },
  soldImage: {
    opacity: 0.5,
  },
  soldText: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
});

export default HybridAuctionCard;

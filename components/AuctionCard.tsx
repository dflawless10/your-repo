import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';

type DisplayItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  end_time: string;
  rarity?: 'common' | 'rare' | 'legendary';
};

export type AuctionPreview = {
  id: string;
  item?: DisplayItem;
  rarity?: 'common' | 'rare' | 'legendary';
  title?: string;
  price?: number;
  currentBid?: number;
  description?: string;
  auction_ends_at: string; // ✅ Canonical field
  imageUrl?: string;
  buy_it_now?: number;
  seller?: {
    id: number | string;
    username?: string;
    avatar?: string;
    avg_rating?: number;
    total_reviews?: number;
  };
  is_must_sell?: boolean | number;
  selling_strategy?: string;
};


type Props = {
  preview: AuctionPreview;
  onGoatTap?: () => Promise<void>;
  Item?: any;
  rarity?: 'common' | 'rare' | 'legendary';
  imageUrl?: string;
};


export const getRarityBadge = (rarity?: DisplayItem['rarity']) => {
  switch (rarity) {
    case 'legendary':
      return '💎 Legendary Sparkle';
    case 'rare':
      return '✨ Rare Shine';
    case 'common':
      return '🌾 Common Charm';
    default:
      return '❔ Unknown Rarity';
  }
};

export const AuctionCard: React.FC<Props> = ({ preview, onGoatTap, Item, rarity }) => {
  const itemRarity = rarity || preview.rarity || preview.item?.rarity;

  const rarityStyles = {
    common: { borderColor: '#ccc' },
    rare: { borderColor: '#6a0dad', borderWidth: 2 },
    legendary: {
      borderColor: '#ffd700',
      borderWidth: 3,
      shadowColor: '#ffd700',
      shadowOpacity: 0.5,
    },
  };

  const cardStyle = [styles.card, itemRarity ? rarityStyles[itemRarity] : null];

  const title =
    preview?.item?.title ?? preview?.title ?? Item?.title ?? 'Unnamed Item';

  const imageUrl =
    preview?.item?.imageUrl ?? preview?.imageUrl ?? 'https://your-image-url.com/goat.png';

  const rarityColorMap = {
    common: '#666',
    rare: '#6a0dad',
    legendary: '#ffd700',
  };

  // Dynamic time coloring based on urgency
  const getTimeColor = (): string => {
    if (!preview?.auction_ends_at) return rarityColorMap[itemRarity ?? 'common'];

    const now = Date.now();
    const end = new Date(preview.auction_ends_at).getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);

    if (diffHours <= 2) {
      return '#E53E3E'; // Bright red if ≤2h
    } else if (diffHours <= 24) {
      return '#c53030'; // Red if ≤24h
    }
    // Use rarity color for non-urgent items
    return rarityColorMap[itemRarity ?? 'common'];
  };

  const timeColor = getTimeColor();

  const timeLeft = preview?.auction_ends_at
    ? formatDistanceToNow(new Date(preview.auction_ends_at), { addSuffix: true })
    : 'Unknown';

  const formattedEndTime = preview?.auction_ends_at
    ? new Date(preview.auction_ends_at).toLocaleString()
    : 'Unknown';

  return (
    <TouchableOpacity onPress={onGoatTap} style={cardStyle}>
      {/* 🧬 Rarity Badge */}
      {itemRarity && (
        <View style={styles.rarityBadge}>
          <Text>{getRarityBadge(itemRarity)}</Text>
        </View>
      )}

      {/* 💰 Buy It Now Badge */}
      {preview?.buy_it_now && (
        <View style={styles.buyItNowBadge}>
          <Text style={styles.buyItNowText}>BUY NOW</Text>
        </View>
      )}

      {/* ⚡ Must Sell Badge */}
      {(preview?.is_must_sell === 1 || preview?.selling_strategy === 'must_sell') && (
        <View style={styles.mustSellBadge}>
          <Ionicons name="flash" size={10} color="#FFF" />
          <Text style={styles.mustSellText}>MUST SELL</Text>
        </View>
      )}

      {/* 🖼️ Item Image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* 🏷️ Item Title */}
      <Text style={styles.h3}>{title}</Text>

      {/* ⏳ Auction Countdown */}
      {Boolean(preview?.auction_ends_at) && (
        <Text
          style={[
            styles.timeLeft,
            {
              color: timeColor,
              textShadowColor: itemRarity === 'legendary' ? '#ffd700' : 'transparent',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: itemRarity === 'legendary' ? 6 : 0,
            },
          ]}
        >
          ⏳ {timeLeft}
        </Text>
      )}

      {/* Seller Info */}
      {preview?.seller && (
        <TouchableOpacity
          style={styles.sellerRow}
          onPress={(e) => {
            e.stopPropagation();
            if (preview.seller?.id) {
              router.push(`/seller/${preview.seller.id}` as any);
            }
          }}
        >
          {preview.seller.avatar && (
            <Image source={{ uri: preview.seller.avatar }} style={styles.sellerAvatar} />
          )}
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {preview.seller.username}
            </Text>
            {typeof preview.seller.avg_rating === 'number' && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {preview.seller.avg_rating.toFixed(1)}{' '}
                </Text>
                <Text style={styles.reviewCount}>
                  ({preview.seller.total_reviews || 0})
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  image: {
    width: 100,
    height: 100,
    marginBottom: 12,
    borderRadius: 8,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 1,
  },
  buyItNowBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#10B981',
    zIndex: 1,
  },
  buyItNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeLeft: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mustSellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E53E3E',
    zIndex: 2,
  },
  mustSellText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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

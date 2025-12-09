import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';

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

  const timeColor = rarityColorMap[itemRarity ?? 'common'];

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
});

import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  View,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 32 - COLUMN_GAP) / NUM_COLUMNS;
import Animated, {FadeIn, FadeInDown} from 'react-native-reanimated';
import WinkingGoat from '../assets/winkingGoat.svg';
import DiamondIcon from '../assets/diamond.svg';
import { formatTimeWithSeconds } from '@/utils/time';
import { useAppDispatch } from '@/hooks/reduxHooks';
import {ListedItem, WishlistItem} from '@/types/items';
import { addToWishlist } from 'app/wishlistslice';
import { Ionicons } from '@expo/vector-icons';

import wishlist from 'app/wishlist';

type Props = {
  item: {
    id: number;
    item_id?: number;
    AuctionId?: number;
    Auction_id?: number;
    name: string;
    price: number;
    AuctionItem?: {
      id: number;
    }
    photo_url: string;
    quantity_available?: number;
    listed_at?: string;
    auction_ends_at?: string;
    auction_id?: number;
    bidCount?: number;
    description?: string;
    registration_time?: string;
    timeLeft: string;
  };
  onTap: (id: number) => void;
  onCardPress?: (id: number) => void;
  animatedStyle: any;
  onWishlistTap?: (item: Props['item']) => void;
  isWishlisted?: boolean;
};

function FavoriteCarouselCard({
  item,
  onTap,
  onCardPress,
  animatedStyle,
  onWishlistTap,
  isWishlisted,
}: Readonly<Props>) {
  const dispatch = useAppDispatch();

  const handleWishlistTap = async (item: ListedItem) => {
  try {
    const wishlistItem = {
      id: String(item.id),
      name: item.name,
      price: item.price ?? 0,
      image: item.photo_url ?? '',
      isWishlisted: true,
    };

    dispatch(addToWishlist(wishlistItem));
    // ... server sync ...
  } catch (err) {
    console.error('Failed to sync wishlist:', err);
  }
};


  const handleCardPress = () => {
    const itemId = item.item_id || item.id;
    if (onCardPress) {
      onCardPress(itemId);
    }
  };

  const getCountdownColor = (endTime: string): { color: string; fontWeight: '600' | 'bold' } => {
    const now = Date.now();
    const end = new Date(endTime).getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);

    if (diffHours <= 2) {
      return { color: '#E53E3E', fontWeight: 'bold' }; // Bright red + bold if ≤2h
    } else if (diffHours <= 24) {
      return { color: '#c53030', fontWeight: '600' }; // Red if ≤24h
    }
    return { color: '#38a169', fontWeight: '600' }; // Green otherwise
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.9}>
      <Animated.View entering={FadeInDown} style={styles.carouselCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.photo_url ?? 'https://via.placeholder.com/260x140.png?text=No+Image',
            }}
            style={styles.carouselImage}
          />
          <Animated.View entering={FadeIn} style={{ opacity: 1 }}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              // Share functionality
            }}
            style={styles.wishlistBadge}
          >
            <Ionicons name="share-social" size={20} color="#FF6B35" />
          </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.name ?? 'Unnamed Item'}</Text>
        <Text style={styles.description}>{item.description ?? 'No description available.'}</Text>
        <Text style={[
          styles.timeLeft,
          item.auction_ends_at ? getCountdownColor(item.auction_ends_at) : {}
        ]}>
          ⏰ {formatTimeWithSeconds(item.auction_ends_at ?? '', Date.now())}
        </Text>

        <View style={styles.iconRow}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onTap(item.id);
            }}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.iconWrapper, animatedStyle ?? {}]}>
              <WinkingGoat width={60} height={60} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={[styles.iconWrapper, animatedStyle ?? {}]}>
            <DiamondIcon width={28} height={28} />
          </Animated.View>
        </View>
      </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  carouselCard: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  wishlistBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#9300d3',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  timeLeft: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '500',
    marginBottom: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  iconWrapper: {
    marginRight: 12,
  },
});

export default FavoriteCarouselCard;

import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Share,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import {formatTime, formatTimeWithSeconds, getCountdownLocal, isLowStock} from '@/utils/time';
import { ThemedText } from '@/components/ThemedText';
import UnTappedHeart from '@/assets/unTappedHeart.svg';
import TappedHeart from '@/assets/TappedHeart.svg';
import { useAppDispatch } from '@/hooks/reduxHooks';
import {addToWishlist} from '@/app/wishlistslice';
import GoatGenieBadge from '@/app/GoatGenieBadge';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {AuctionItem, ListedItem} from '@/types/items';
import { useWishlist } from '@/app/wishlistContext';



const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 32 - COLUMN_GAP) / NUM_COLUMNS;



export default function SparkleItemCard({
  item,
  isFavorited,
  toggleFavorite,
  isWishlisted = false,
  toggleWishlist, onWishlistTap,
  onAddToCart,
  showRemoveButton = false, // ✅ Default to false
  isWishlistScreen = false,
}: Readonly<{
  item: ListedItem;
  total_reviews: string;
  id: string;
  isWishlisted?: boolean;
  toggleWishlist: (id: number) => void;
  isFavorited: boolean;
  toggleFavorite: (id: number) => void;
  onWishlistTap?: (item: ListedItem) => void;
  showRemoveButton?: boolean;
  isWishlistScreen?: boolean;
  onAddToCart?: () => void;
}>) {
  const { timeText, isUrgent } = getCountdownLocal(item.auction_ends_at);
  const hasEnded = timeText === 'Ended';
  const dispatch = useAppDispatch();
  const { addToWishlist: addToWishlistBackend } = useWishlist();
  const scaleAnim = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const animateHeart = () => {
    scaleAnim.value = withSequence(withSpring(1.3), withSpring(1));
  };

  const handleAddToWishlist = async () => {
    // Since everything is in the item table, use item.id as auction_id
    const auctionId = item.auction_id || item.AuctionId || item.Auction_id || item.id;
    console.log('🐐 Adding item to wishlist:', item.id, item.name, 'auction_id:', auctionId);
    console.log('🐐 Item keys:', Object.keys(item));
    
    if (!auctionId) {
      console.error('🐐 Error: No auction_id found for item', item.id);
      return;
    }
    
    try {
      // Sync with the backend using auction_id (which is item_id)
      await addToWishlistBackend(auctionId);
      console.log('🐐 Successfully added to backend wishlist');
      // Update Redux state
      dispatch(addToWishlist({ ...item, isWishlisted: true }));
      // Small delay to let a backend process before navigating
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push('/wishlist');
    } catch (error) {
      console.error('🐐 Error adding to wishlist:', error);
    }
  };
 type SellerInfo = {
  seller?: {
    id: number | string;
    username?: string;
    avg_rating?: number;
    total_reviews?: number;
    avatar: string;
  };
};

const handleSellerTap = (item: SellerInfo) => {
  if (!item?.seller) return;

  router.push({
    pathname: '/seller/[sellerId]',
    params: { sellerId: String(item.seller.id) },
  });
};

const isJustListed = (() => {
  if (!item.listedAt) return false;
  const listed = new Date(item.listedAt).getTime();
  const now = Date.now();
  const diffHours = (now - listed) / (1000 * 60 * 60);
  return diffHours <= 24; // show badge for 24 hours
})();


const isMustSell =
  Number(item.is_must_sell) === 1 ||
  item.selling_strategy === "must_sell";

console.log("🐐 MUST SELL DEBUG:", {
  is_must_sell: item.is_must_sell,
  selling_strategy: item.selling_strategy,
  type_is_must_sell: typeof item.is_must_sell,
});



  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this item: ${item.name}\n${item.photo_url}`,
        url: item.photo_url,
        title: item.name,
      });
    } catch (error) {
      console.warn('Share failed:', error);
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
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.9}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.photo_url }}
          style={styles.image}
          resizeMode="cover"
          fadeDuration={150}
        />

        {/* Heart Icon - Top Right */}
        {!isWishlistScreen && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              animateHeart();
              toggleFavorite(item.id);
            }}
            style={styles.heartIconOverlay}
            activeOpacity={0.7}
          >
            {isFavorited ? (
              <TappedHeart width={24} height={24} />
            ) : (
              <UnTappedHeart width={24} height={24} />
            )}
          </TouchableOpacity>
        )}


        {isUrgent && !hasEnded && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flame" size={12} color="#FFF" />
            <Text style={styles.urgentBadgeText}>ENDING SOON</Text>
          </View>
        )}

        {/* Ended Badge - Top Left */}
        {hasEnded && (
          <View style={styles.endedBadge}>
            <Text style={styles.endedBadgeText}>ENDED</Text>
          </View>
        )}

        {/* Buy It Now Badge - Top Left */}
        {item.buy_it_now && (
          <View style={styles.buyItNowBadge}>
            <Text style={styles.buyItNowText}>BUY NOW</Text>
          </View>
        )}

        {/* Must Sell Badge - bottom Left */}
        {(Number(item.is_must_sell) === 1 || item.selling_strategy === 'must_sell') && (
  <View style={styles.mustSellBadge}>
    <Text style={styles.mustSellText}>⚡ MUST SELL</Text>
  </View>
)}

{isJustListed && (
  <View style={styles.justListedBadge}>
    <MaterialCommunityIcons name="new-box" size={12} color="#fff" />
    <Text style={styles.justListedText}>JUST LISTED</Text>
  </View>
)}



        {/* Wishlist Coin - Bottom Right */}
        {!isWishlistScreen && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleAddToWishlist();
            }}
            style={styles.wishlistCoinOverlay}
            activeOpacity={0.7}
          >
            <GoatGenieBadge onWish={handleAddToWishlist} />
          </TouchableOpacity>
        )}

        {/* Share Button - Bottom Right (Wishlist Screen) */}
        {isWishlistScreen && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            style={styles.shareButtonOverlay}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={20} color="#6A0DAD" />
          </TouchableOpacity>
        )}

        {/* Remove Heart (Wishlist Screen) */}
        {showRemoveButton && (
          <Animated.View style={animatedStyle}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                animateHeart();
                toggleFavorite(item.id);
              }}
              style={styles.heartIconOverlay}
              activeOpacity={0.7}
            >
              <TappedHeart width={24} height={24} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.cardPrice}>
            {(item.is_must_sell || item.selling_strategy === 'must_sell') && !item.highest_bid && item.price === 0
              ? 'Best Offer'
              : `$${Number(item.highest_bid ?? item.price ?? 0).toFixed(2)}`}
          </Text>
          {(item.bidCount ?? 0) > 0 && (
            <Text style={styles.bidBadge}>{item.bidCount} BIDS</Text>
          )}
        </View>

        {isJustListed && (
  <View style={styles.justListedBadge}>
    <MaterialCommunityIcons name="new-box" size={12} color="#fff" />
    <Text style={styles.justListedText}>JUST LISTED</Text>
  </View>
)}




        {/* Selling Strategy Badge */}
       {(Number(item.is_must_sell) === 1 || item.selling_strategy === 'must_sell') && (
  <View style={styles.strategyBadge}>
    <Text style={styles.strategyBadgeText}>⚡ MUST SELL</Text>
  </View>
)}

        <View style={styles.statsContainer}>

                     <Text style={styles.statsText}>👀 {Math.floor(Math.random() * 20) + 5} watching</Text>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                  <Text
                    style={[
                      styles.statsText,
                      item.auction_ends_at ? getCountdownColor(item.auction_ends_at) : {},
                    ]}
                    numberOfLines={1}
                  >
                    {item.auction_ends_at
                      ? formatTimeWithSeconds(item.auction_ends_at, Date.now())
                      : 'Not auctioned'}
                  </Text>
                </View>

        {item.seller && (
  <View style={styles.sellerRatingRow}>
    {item.seller.avatar && (
      <Image source={{ uri: item.seller.avatar }} style={styles.sellerAvatar} />
    )}
    <TouchableOpacity
      onPress={(e) => {
        e.stopPropagation();
        handleSellerTap(item);
      }}
      style={styles.sellerNameContainer}
    >
      <Text style={styles.sellerName} numberOfLines={1}>
         {item.seller.username}
      </Text>
    </TouchableOpacity>

    {typeof item.seller.avg_rating === 'number' && (
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={14} color="#FFD700" />
        <Text style={styles.ratingText} numberOfLines={1}>
          {item.seller.avg_rating.toFixed(1)} ({item.seller.total_reviews || 0})
        </Text>
      </View>
    )}
  </View>
)}
      </View>

    </TouchableOpacity>

  );
}

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginLeft: 4,
  },
  bottomRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginTop: 4,
},

bottomLeft: {
  flex: 1,
  paddingRight: 8,
  gap: 4,
},

bottomRight: {
  flexShrink: 1,
  alignItems: 'flex-end',
  gap: 4,
},
  justListedBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#2563EB', // BidGoat blue
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 20,
  gap: 4,
  shadowColor: '#2563EB',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 4,
  elevation: 4,
},
justListedText: {
  color: '#fff',
  fontSize: 11,
  fontWeight: '800',
  letterSpacing: 0.5,
},


  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
   urgencyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidCountText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
   bidLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },

  statsText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: ITEM_WIDTH * 1.2,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartIconOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  urgentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  endedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#666',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  endedBadgeText: {
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
    zIndex: 5,
  },
  buyItNowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mustSellBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 5,
  },
  mustSellText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },


  wishlistCoinOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  shareButtonOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoContainer: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  bidBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  strategyBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  strategyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F44336',
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  sellerNameContainer: {
    flexShrink: 1,
    flexGrow: 0,
    marginRight: 6,
  },
  sellerName: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 2,
  },

});
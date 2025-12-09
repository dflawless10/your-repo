import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ThemedView } from 'components/ThemedView';
import { ThemedText } from 'components/ThemedText';
import TappedHeart from 'assets/TappedHeart.svg';
import UnTappedHeart from 'assets/unTappedHeart.svg';
import type { ListedItem } from 'types/items';


/**
 * More permissive / resilient types to match your ListedItem shape.
 * - Accepts mustSell as boolean | string (backend sometimes returns "true"/"false")
 * - Accepts either `id` or `item_id` as the identifier
 * - Allows extra fields via index signature so the component can accept your ListedItem type directly
 */


type Props = {
  item: ListedItem;
  favoritedItems: Record<number, boolean | undefined>;
  toggleFavorite: (id: number) => void | Promise<void>;
  handleWishlistTap: (item: ListedItem) => void | Promise<void>;
};

const SuperDealCard: React.FC<Props> = ({ item, favoritedItems, toggleFavorite, handleWishlistTap }) => {
  const router = useRouter();
  const placeholder = require('app/components/assets/placeholder.svg.png');

  // robust id resolution
  const itemId = Number(item.id ?? item.item_id ?? 0);

  const dateField = item.listed_at || item.listedAt || item.registration_time || item.auction_ends_at;
  const formattedDate = dateField ? format(new Date(dateField), 'PPP') : 'Unknown';

  // tolerate mustSell being "true" | "false" | boolean | "1" | "0"
  const isMustSell = (() => {
    const val = item.mustSell ?? item.is_super_deal;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
  })();

  // friendly price rendering
  const priceString =
    typeof item.price === 'number' ? item.price.toFixed(2) : item.price ? String(item.price) : '0.00';

  return (
    <ThemedView style={[styles.itemCard, isMustSell ? styles.mustSellContainer : undefined]}>
      {isMustSell && (
        <View style={styles.mustSellBadge}>
          <ThemedText style={styles.mustSellBadgeText}>MUST SELL</ThemedText>
        </View>
      )}

      <TouchableOpacity
        onPress={() => toggleFavorite(itemId)}
        style={styles.heartIcon}
        accessibilityLabel="Toggle favorite"
        activeOpacity={0.8}
      >
        {favoritedItems[itemId] ? <TappedHeart width={26} height={26} /> : <UnTappedHeart width={26} height={26} />}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/item/${itemId}`)}>
        <Image
          source={item.photo_url ? { uri: item.photo_url } : placeholder}
          style={styles.thumbnail}
          accessibilityLabel={item.photo_url ? item.name ?? 'Item image' : 'No image available'}
        />
      </TouchableOpacity>

      <View style={styles.priceTag}>
        <ThemedText style={styles.priceText}>${priceString}</ThemedText>
      </View>

      {isMustSell && <ThemedText style={styles.lowStockText}>🔥 Super Deal — Priced To Move</ThemedText>}

      <ThemedText type="defaultSemiBold" style={styles.title}>{item.name ?? 'Untitled'}</ThemedText>
      {item.description ? <ThemedText style={styles.subtitle}>{item.description}</ThemedText> : null}

      <ThemedText style={{ marginTop: 6 }}>📅 {formattedDate}</ThemedText>

      <View style={styles.wishlistRow}>
        <TouchableOpacity onPress={() => handleWishlistTap(item)}>
          <Image
            source={require('app/components/assets/wishlist-coin.png')}
            style={styles.wishlistIcon}
          />
        </TouchableOpacity>

        <ThemedText
          type="link"
          style={{ marginLeft: 10 }}
          onPress={() => router.push(`/item/${itemId}`)}
        >
          View Listing
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  mustSellContainer: {
    borderWidth: 2,
    borderColor: '#c62828',
    elevation: 5,
    padding: 8,
  },
  mustSellBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: '#c62828',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 20,
  },
  mustSellBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  itemCard: {
    marginVertical: 8,
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  thumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 4,
    marginBottom: 6,
  },
  priceTag: {
    position: 'absolute',
    bottom: 18,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  priceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  lowStockText: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  heartIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 30,
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  wishlistIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  wishlistRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SuperDealCard;
import { API_BASE_URL } from '@/config';

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import {
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WinkingGoat from '../assets/winkingGoat.svg';
import DiamondIcon from '../assets/diamond.svg';
import FavoriteCarouselCard from 'app/FavoriteCarouselCard';
import {AuctionItem, WishlistItem} from '@/types/items';
import {addToWishlist} from "@/app/wishlistslice";
import {useAppDispatch} from "@/hooks/reduxHooks";
import {Ionicons} from "@expo/vector-icons";

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState<AuctionItem[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const scaleAnim = useSharedValue(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [tappedFavorites, setTappedFavorites] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchFavorites();
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync()
          .then(() => setSound(null))
          .catch((err) => console.warn('Failed to unload sound:', err));
      }
    };
  }, [sound]);

  const dispatch = useAppDispatch();

  const handleAddToWishlist = (item: WishlistItem) => {
  dispatch(addToWishlist(item));
};

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const fetchFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const playGoatSound = (price?: number) => {
    const pitch = price ? Math.min(1 + price / 100, 2) : 1;
    // use pitch to modulate sound
  };

  const handleHeartTap = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/favorite/${itemId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.status === 403) {
        Alert.alert('Limit Reached', "You've reached your weekly limit.");
      } else {
        Alert.alert('Favorited!', result.message);
        await playGoatSound();
      }
    } catch (error) {
      console.error('Heart tap failed:', error);
    }
  };


  const sortedFavorites = [...favorites].sort((a, b) =>
    new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
  );

return (
  <View style={styles.container}>
    <FlatList
      data={sortedFavorites}
      keyExtractor={(item) => `favorite-${item.item_id}`}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>

          <FavoriteCarouselCard
  item={{
    id: item.item_id,
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    photo_url: String(item.photo_url ?? ''),
    auction_ends_at: String(item.end_time ?? ''),
    registration_time: String(item.registration_time ?? ''),
    bidCount: item.bidCount ?? 0,
    auction_id: item.auction_id,
    AuctionId: item.auction_id, // ✅ Added
    Auction_id: item.auction_id, // ✅ Added
    AuctionItem: { id: item.item_id }, // ✅ Added
    price: item.price ?? 0, // ✅ Added
    timeLeft: typeof item.timeLeft === 'string' ? item.timeLeft : '',
    quantity_available: item.quantity_available ?? 1,
  }}
            onTap={handleHeartTap}
            animatedStyle={animatedStyle}
          />

          <Text style={styles.metaText}>
            Ends: {new Date(item.end_time).toLocaleString()}
          </Text>
          <Text style={styles.meta}>Bids: {item.bidCount}</Text>
          <Text style={styles.meta}>Time Left: {item.timeLeft}</Text>
          <Text style={styles.meta}>Available: {item.quantity_available}</Text>
        </View>
      )}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.gridContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No favorites yet!</Text>
          <Text style={styles.emptySubtext}>
            Tap the goat to start collecting sparkle-worthy items
          </Text>

          <TouchableOpacity
            onPress={() => handleHeartTap(0)}
            style={styles.goatButton}
            accessibilityLabel="Tap to favorite your first item"
            activeOpacity={0.8}
          >
            <View style={styles.centeredIcons}>
              <Animated.View style={[styles.iconWrapper, animatedStyle]}>
                <WinkingGoat width={160} height={160} />
              </Animated.View>
              <Animated.View style={[styles.iconWrapper, animatedStyle]}>
                <DiamondIcon width={50} height={50} />
              </Animated.View>
            </View>
          </TouchableOpacity>


        </View>
      }
    />
  </View>
);


};



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2d3748',
  },
  meta: {
  fontSize: 12,
  color: '#555',
  marginTop: 4,
  textAlign: 'center',
},
  badge: {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: '#ffe0b2',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
},
badgeText: {
  fontSize: 12,
  color: '#333',
  fontWeight: 'bold',
},
  cardWrapper: {
  flex: 1,
  margin: 8,
  backgroundColor: '#f9f9f9',
  borderRadius: 12,
  padding: 12,
  elevation: 2,
},
metaText: {
  fontSize: 12,
  color: '#555',
  marginTop: 4,
  textAlign: 'center',
},
gridContent: {
  paddingHorizontal: 12,
  paddingBottom: 80,
},

  emptySubtext: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 12,
  },
  goatButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  centeredIcons: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginHorizontal: 6,
  },
});
export const unstable_settings = {
  name: 'favorites',
};

export default FavoritesScreen;

import { API_BASE_URL } from '@/config';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, {
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WinkingGoat from '../../assets/winkingGoat.svg';
import DiamondIcon from '../../assets/diamond.svg';
import FavoriteCarouselCard from 'app/FavoriteCarouselCard';

export type ListedItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  bid_count: number;
  registration_time: string;
  auction_ends_at: string;
  timeLeft: string;
};

const FavoritesScreen = () => {
  const [allItems, setAllItems] = useState<ListedItem[]>([]);
  const [favoritedMap, setFavoritedMap] = useState<Record<number, boolean>>({});
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const scaleAnim = useSharedValue(0);

  useEffect(() => {
    fetchAllItems();
    loadFavoritedMap();
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const fetchAllItems = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/jewelry-box`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllItems(data.items);
      } else {
        console.warn('Failed to fetch items:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const loadFavoritedMap = async () => {
    try {
      const stored = await AsyncStorage.getItem('favoritedItems');
      if (stored) {
        setFavoritedMap(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load favorited map:', err);
    }
  };

  const playGoatSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/goatExcited.wav')
    );
    setSound(sound);
    await sound.playAsync();
  };

  useEffect(() => {
  return () => {
    if (sound) {
      sound.unloadAsync()
        .then(() => setSound(null))
        .catch((err) => console.warn('Failed to unload sound:', err));
    }
  };
}, [sound]);


  const handleGoatTap = async (itemId: number) => {
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
        Alert.alert(
          'Limit Reached',
          "You've reached your weekly limit. Sign up for unlimited favorites!"
        );
      } else {
        Alert.alert('Favorited!', result.message);
        await playGoatSound();
        const updatedMap = { ...favoritedMap, [itemId]: true };
        setFavoritedMap(updatedMap);
        await AsyncStorage.setItem('favoritedItems', JSON.stringify(updatedMap));
      }
    } catch (error) {
      console.error('Goat tap failed:', error);
    }
  };

  const favoritedIds = new Set(
    Object.entries(favoritedMap)
      .filter(([_, isFav]) => isFav)
      .map(([id]) => Number(id))
  );

  const displayedItems = allItems.filter(item => favoritedIds.has(item.id));

  const renderItem = ({ item }: { item: ListedItem }) => (
    <FavoriteCarouselCard
      item={item}
      onTap={() => handleGoatTap(item.id)}
      animatedStyle={animatedStyle}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No favorites yet!</Text>
            <Text style={styles.emptySubtext}>
              Tap the goat to start collecting sparkle-worthy items
            </Text>
            <TouchableOpacity
              onPress={() => handleGoatTap(0)}
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

export default FavoritesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffef8' },
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

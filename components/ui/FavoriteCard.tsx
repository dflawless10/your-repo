import React from 'react';
import { View, Text, Image, Button, StyleSheet } from 'react-native';
import Animated, {
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { AuctionItem } from '@/types/items';

type FavoriteCardProps = {
  item: AuctionItem;
  handleBid: () => void;
  handleUnfavorite: () => void;
};

const FavoriteCard: React.FC<FavoriteCardProps> = ({ item, handleBid, handleUnfavorite }) => {
  const sparkle = useSharedValue(1);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }],
  }));

  const triggerSparkle = () => {
    sparkle.value = withRepeat(withTiming(1.5, { duration: 150 }), 2, true);
  };

  const playBleat = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./assets/bleat.mp3'));
      await sound.playAsync();
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Failed to play goat bleat:', error);
    }
  };

  const onDiamondPress = async () => {
    triggerSparkle();
    await playBleat();
  };

  const showGoatBadge = item.isFavorite && (item.mascot?.emoji || '🐐');

  return (
    <View style={styles.card} testID={`favorite-card-${item.id}`}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      )}

      {showGoatBadge && (
        <Text style={styles.goatBadge} accessibilityLabel="Favorite Goat Badge">
          {item.mascot?.emoji || '🐐'}
        </Text>
      )}

      <View style={styles.titleRow}>
        <Text style={styles.title}>{item.title || 'Untitled Item'}</Text>
        <Animated.View style={sparkleStyle}>
          <Text
            style={styles.diamond}
            onPress={onDiamondPress}
            accessibilityLabel="Tap to sparkle and bleat"
          >
            💎
          </Text>
        </Animated.View>
      </View>

      <Text style={styles.description}>
        {item.description || 'No description available.'}
      </Text>

      <View style={styles.actions}>
        <Button title="Place Bid" onPress={handleBid} />
        <Button title="Remove Favorite" onPress={handleUnfavorite} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
  },
  diamond: {
    fontSize: 24,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  goatBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 24,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default FavoriteCard;

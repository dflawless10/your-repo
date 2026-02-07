import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type AuctionPreviewCardProps = {
  preview: {
    id: string | number;
    title: string;
    price?: number;
    imageUrl?: string; // supports either imageUrl...
    image?: string;
    end_time?: string; // ...or image
    buy_it_now?: number;
  };
  onGoatTap?: () => Promise<void> | void;
};

const AuctionPreviewCard: React.FC<AuctionPreviewCardProps> = ({ preview, onGoatTap }) => {
  const imageUri = preview.imageUrl ?? preview.image;

  const Container = onGoatTap ? TouchableOpacity : View;
  const containerProps = onGoatTap ? { onPress: onGoatTap } : {};

  return (
    <Container {...containerProps} style={styles.card}>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : null}

        {/* Buy It Now Badge */}
        {!!(preview.buy_it_now) && (
          <View style={styles.buyItNowBadge}>
            <Text style={styles.buyItNowText}>BUY NOW</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{preview.title}</Text>
      {typeof preview.price === 'number' ? (
        <Text style={styles.price}>${preview.price}</Text>
      ) : null}
    </Container>
  );
};

export default AuctionPreviewCard;
// Optional named export if other files import it this way
export { AuctionPreviewCard };

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
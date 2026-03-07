import React from 'react';
import {View, Text, StyleSheet, Image as RNImage, TouchableOpacity} from 'react-native';
import {AuctionItem} from "@/types/items";
import {Ionicons} from '@expo/vector-icons';
import {formatTimeWithSeconds} from '@/utils/time';
import {router} from 'expo-router';







export interface CardProps {
    item: AuctionItem,
    onPress?: () => void
}

export const CardContent: React.FC<CardProps> = ({item, onPress}: CardProps) => {
    const preview =
        item?.description?.length && item.description.length > 120
            ? item.description.substring(0, 117).trim() + '...'
            : item.description ?? '';

    const tagList = item?.tags?.split(',').map((tag: string) => tag.trim()).filter(Boolean) ?? [];

    // Check if item is sold
    const isSold = item.status === 'sold' || item.is_sold === 1;

    // Check if an item is Must Sell
    const isMustSell = item.is_must_sell === 1 || item.is_must_sell === true;

    // Calculate discount percentage if original price exists
    const hasDiscount = item.original_price && item.original_price > item.price;
    const discountPercent = hasDiscount && item.original_price
        ? Math.round(((item.original_price - item.price) / item.price) * 100)
        : 0;

    const getPriceDisplay = () => {
        if ((item.selling_strategy === 'must_sell' || item.is_must_sell) && item.price === 0) {
            return 'Best Offer';
        }
        if (item.price !== null && item.price !== undefined) {
            return `$${item.price.toFixed(2)}`;
        }
        return 'No price listed';
    };

    return (
        <View style={[styles.card, isSold && styles.soldCard]}>
            <View style={styles.imageWrapper}>
                <RNImage
                    source={{ uri: item.photo_url ?? '' }}
                    style={[styles.image, isSold && styles.soldImage]}
                    resizeMode="cover"
                />
                {isSold && (
                    <View style={styles.soldBadge}>
                        <Text style={styles.soldBadgeText}>SOLD</Text>
                    </View>
                )}
                {!isSold && isMustSell && (
                    <View style={styles.mustSellBadge}>
                        <Text style={styles.mustSellText}> MUST SELL</Text>
                    </View>
                )}
                {!isSold && !isMustSell && hasDiscount && (
                    <View style={styles.discountRibbon}>
                        <Text style={styles.discountText}>{discountPercent} OFF</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.title, isSold && styles.soldText]} numberOfLines={2}>
                    {item.name ?? 'Untitled Item'}
                </Text>
                <Text
                    style={styles.description}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {preview}
                </Text>
                <Text style={styles.price}>
                    {getPriceDisplay()}
                </Text>

                {/* Time Remaining */}
                {item.auction_ends_at && (
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.timeText}>
                      {formatTimeWithSeconds(item.auction_ends_at, Date.now())}
                    </Text>
                  </View>
                )}

                {/* Seller Info */}
                {item.seller && (
                  <TouchableOpacity
                    style={styles.sellerRow}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (item.seller?.id) {
                        router.push(`/seller/${item.seller.id}` as any);
                      }
                    }}
                  >
                    {item.seller.avatar && (
                      <RNImage source={{ uri: item.seller.avatar }} style={styles.sellerAvatar} />
                    )}
                    <View style={styles.sellerInfo}>
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {item.seller.username}
                      </Text>
                      {typeof item.seller.avg_rating === 'number' && (
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.ratingText}>
                            {item.seller.avg_rating.toFixed(1)}
                          </Text>
                          <Text style={styles.reviewCount}>
                            ({item.seller.total_reviews || 0})
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                {tagList.length > 0 && (
                  <View style={styles.tagContainer}>
                    {tagList.slice(0, 3).map((tag: string, index: number) => (
                        <Text style={styles.tag} key={`${tag}-${index}`}>
                            {tag}
                        </Text>
                    ))}
                  </View>
                )}
            </View>
        </View>
    );
};

// Also export as default
export default CardContent;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: 12,
        minHeight: 120,
        marginBottom: 0,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
        elevation: 2,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        flex: 1,
        paddingLeft: 12,
        justifyContent: 'flex-start',
        gap: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    description: {
        fontSize: 14,
        lineHeight: 18,
        color: '#444',
        marginBottom: 8,
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6A0DAD',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        color: '#444',
        fontSize: 12,
    },
    soldCard: {
        opacity: 0.7,
        backgroundColor: '#f5f5f5',
    },
    soldImage: {
        opacity: 0.5,
    },
    soldBadge: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -30 }, { translateY: -15 }],
        backgroundColor: 'rgba(220, 38, 38, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
    },
    soldBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    soldText: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
    discountRibbon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 3,
    },
    discountText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    mustSellBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
    },
    mustSellText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    sellerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
        paddingTop: 6,
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
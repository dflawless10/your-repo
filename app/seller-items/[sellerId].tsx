import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useTheme } from "@/app/theme/ThemeContext";
import { API_BASE_URL } from "@/config";
import SparkleItemCard from "@/app/components/SparkleItemCard";
import EnhancedHeader, { HEADER_MAX_HEIGHT } from "@/app/components/EnhancedHeader";
import GlobalFooter from "@/app/components/GlobalFooter";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWishlist } from "@/app/wishlistContext";

export default function SellerItemsScreen() {
  const { sellerId } = useLocalSearchParams();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = isLandscape ? 3 : 2;

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const { wishlistIds, addToWishlist, removeFromWishlist } = useWishlist();
  const [items, setItems] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [favoritedItems, setFavoritedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load favorites from backend
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const map: Record<number, boolean> = {};
          (data.favorites ?? data.items ?? []).forEach((f: any) => {
            map[f.item_id ?? f.id] = true;
          });
          setFavoritedItems(map);
        }
      } catch {}
    }
    void fetchFavorites();
  }, []);

  const toggleWishlist = useCallback(async (id: number) => {
    if (wishlistIds.includes(id)) {
      await removeFromWishlist(id);
    } else {
      await addToWishlist(id);
    }
  }, [wishlistIds, addToWishlist, removeFromWishlist]);

  const toggleFavorite = useCallback(async (id: number) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) return;
      const isFav = favoritedItems[id];
      setFavoritedItems(prev => ({ ...prev, [id]: !isFav }));
      if (isFav) {
        await fetch(`${API_BASE_URL}/api/favorites/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch(`${API_BASE_URL}/api/favorites`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: id }),
        });
      }
    } catch {}
  }, [favoritedItems]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sellerRes, itemsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/seller/${sellerId}`),
          fetch(`${API_BASE_URL}/seller/${sellerId}/items`),
        ]);

        if (sellerRes.ok) {
          const sellerData = await sellerRes.json();
          setSeller(sellerData);
        }

        const resData = await itemsRes.json();
        const mapped = (resData.items ?? []).map((item: any, index: number) => ({
          id: item.id ?? index,
          name: item.name,
          description: item.description || "",
          price: item.price || 0,
          buy_it_now: item.buy_it_now || null,
          highest_bid: item.highest_bid || item.highestBid,
          photo_url: item.image || item.photo_url || "",
          bid_count: item.bid_count || item.bidCount,
          bidCount: item.bidCount || item.bid_count || 0,
          listed_at: item.listed_at,
          auction_ends_at: item.auctionEndsAt ?? item.auction_ends_at ?? "",
          end_time: item.end_time ?? "",
          timeLeft: item.timeLeft,
          rarity: ["common", "rare", "legendary"].includes(item.rarity) ? item.rarity : "common",
          seller: item.seller || { name: "", avatar: "", id: 0, username: "", avg_rating: 0, total_reviews: 0 },
          quantity_available: item.quantity_available || 1,
          watchers: item.watchers || "0",
          selling_strategy: item.selling_strategy || "auction",
          is_must_sell: item.selling_strategy === "must_sell",
        }));
        setItems(mapped);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [sellerId]);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < full ? "star" : i === full && half ? "star-half" : "star-outline"}
        size={13}
        color="#FFD700"
      />
    ));
  };

  const isDark = theme === "dark";
  const CARD_GAP = 10;
  const SIDE_PADDING = 16;
  const cardWidth = (width - SIDE_PADDING * 2 - CARD_GAP * (numColumns - 1)) / numColumns;

  const avgRating = seller?.review_stats?.avg_rating ?? 0;
  const reviewCount = seller?.review_stats?.total_reviews ?? 0;
  const shippingPolicy = seller?.policies?.shipping_policy ?? "";
  const returnDays = seller?.policies?.return_window_days ?? 0;
  const authenticityGuarantee = seller?.policies?.authenticity_guarantee ?? false;

  const ListHeader = (
    <Animated.View style={{ opacity: headerOpacity }}>
      {/* Back + title row */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
          More From This Seller
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Seller Storefront Card */}
      {seller && (
        <View style={[styles.storefrontCard, {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark ? "#3C3C3E" : "#E5E5E5",
          shadowColor: isDark ? "#000" : "#6A0DAD",
        }]}>
          {/* Avatar + name */}
          <View style={styles.sellerRow}>
            {seller.avatar_url ? (
              <Image source={{ uri: seller.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={["#6A0DAD", "#8B5CF6"]} style={styles.avatarGradient}>
                <Text style={styles.avatarInitial}>
                  {(seller.username ?? "S")[0].toUpperCase()}
                </Text>
              </LinearGradient>
            )}

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.sellerName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {seller.username}
                </Text>
                {seller.is_premium && (
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
                {authenticityGuarantee && (
                  <Ionicons name="shield-checkmark" size={15} color="#10B981" />
                )}
              </View>

              <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
                Member since {seller.joined ? seller.joined.split(" ").pop() : "–"}
              </Text>

              {/* Stars */}
              {avgRating > 0 ? (
                <View style={styles.ratingRow}>
                  <View style={{ flexDirection: "row", gap: 2 }}>{renderStars(avgRating)}</View>
                  <Text style={[styles.ratingVal, { color: colors.textPrimary }]}>
                    {avgRating.toFixed(1)}
                  </Text>
                  <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                    ({reviewCount})
                  </Text>
                </View>
              ) : (
                <Text style={[styles.newSeller, { color: colors.textSecondary }]}>New Seller</Text>
              )}
            </View>
          </View>

          {/* Trust stats */}
          <View style={[styles.trustBar, { borderColor: isDark ? "#3C3C3E" : "#F0F0F0" }]}>
            <View style={styles.trustStat}>
              <Ionicons name="bag-check-outline" size={15} color={isDark ? "#B794F4" : "#6A0DAD"} />
              <Text style={[styles.trustStatVal, { color: colors.textPrimary }]}>{seller.items_sold ?? 0}</Text>
              <Text style={[styles.trustStatLabel, { color: colors.textSecondary }]}>sales</Text>
            </View>
            <View style={[styles.trustDivider, { backgroundColor: isDark ? "#3C3C3E" : "#E5E5E5" }]} />
            <View style={styles.trustStat}>
              <Ionicons name="cube-outline" size={15} color={isDark ? "#B794F4" : "#6A0DAD"} />
              <Text style={[styles.trustStatVal, { color: colors.textPrimary }]} numberOfLines={1}>
                {shippingPolicy.replace("Ships within ", "").replace(" business days", "d") || "–"}
              </Text>
              <Text style={[styles.trustStatLabel, { color: colors.textSecondary }]}>ships</Text>
            </View>
            <View style={[styles.trustDivider, { backgroundColor: isDark ? "#3C3C3E" : "#E5E5E5" }]} />
            <View style={styles.trustStat}>
              <Ionicons name="return-down-back-outline" size={15} color={isDark ? "#B794F4" : "#6A0DAD"} />
              <Text style={[styles.trustStatVal, { color: colors.textPrimary }]}>
                {returnDays > 0 ? `${returnDays}d` : "–"}
              </Text>
              <Text style={[styles.trustStatLabel, { color: colors.textSecondary }]}>returns</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.msgBtn, { borderColor: isDark ? "#8B5CF6" : "#6A0DAD" }]}
              onPress={() => router.push(`/message-seller/${sellerId}?sellerName=${encodeURIComponent(seller.username ?? "")}`)}
            >
              <Ionicons name="chatbubble-outline" size={15} color={isDark ? "#8B5CF6" : "#6A0DAD"} />
              <Text style={[styles.msgBtnText, { color: isDark ? "#8B5CF6" : "#6A0DAD" }]}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.followBtn, { backgroundColor: isFollowing ? "#10B981" : "#6A0DAD" }]}
              onPress={() => setIsFollowing(f => !f)}
            >
              <Ionicons
                name={isFollowing ? "checkmark-circle" : "notifications-outline"}
                size={15}
                color="#FFF"
              />
              <Text style={styles.followBtnText}>
                {isFollowing ? "Following" : "Follow Seller"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bundle hint — separates BidGoat from competitors */}
          <View style={[styles.bundleHint, { backgroundColor: isDark ? "#2C1E3F" : "#F3EEFF" }]}>
            <Ionicons name="sparkles-outline" size={14} color={isDark ? "#B794F4" : "#6A0DAD"} />
            <Text style={[styles.bundleHintText, { color: isDark ? "#B794F4" : "#6A0DAD" }]}>
              Add 2+ items from this seller to unlock combined shipping savings
            </Text>
          </View>
        </View>
      )}

      <Text style={[styles.listingCount, { color: colors.textSecondary }]}>
        {items.length} Active Listing{items.length !== 1 ? "s" : ""}
      </Text>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <EnhancedHeader scrollY={scrollY} />
        <ActivityIndicator
          size="large"
          color="#6A0DAD"
          style={{ marginTop: HEADER_MAX_HEIGHT + 60 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.FlatList
        key={`cols-${numColumns}`}
        data={items}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + 8,
          paddingHorizontal: SIDE_PADDING,
          paddingBottom: 100,
        }}
        columnWrapperStyle={{ gap: CARD_GAP, marginBottom: CARD_GAP }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <SparkleItemCard
              item={item}
              id={item.id}
              total_reviews={item.seller?.total_reviews?.toString() ?? "0"}
              isWishlisted={wishlistIds.includes(Number(item.id))}
              toggleWishlist={toggleWishlist}
              isFavorited={!!favoritedItems[Number(item.id)]}
              toggleFavorite={toggleFavorite}
              showShareButton
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {error
              ? "Could not load seller items."
              : "This seller has no other active listings."}
          </Text>
        }
      />
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  storefrontCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  proBadge: {
    backgroundColor: "#6A0DAD",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  proBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  memberSince: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  ratingCount: {
    fontSize: 12,
  },
  newSeller: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  trustBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    marginBottom: 12,
  },
  trustStat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  trustStatVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  trustStatLabel: {
    fontSize: 11,
  },
  trustDivider: {
    width: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  msgBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 9,
  },
  msgBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  followBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 9,
  },
  followBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bundleHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    padding: 10,
  },
  bundleHintText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  listingCount: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 10,
  },
  empty: {
    textAlign: "center",
    marginTop: 48,
    fontSize: 15,
  },
});

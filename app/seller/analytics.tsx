import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';

// Types
import { ListedItem } from "@/types/items";
import { generateInsight, GoatInsight } from "@/utils/analyticsEngine";
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Props {
  items: ListedItem[];
  searchStats?: {
    topSearches: string[];
    zeroResultFilters: string[];
  };
  categoryStats?: {
    bestCategory: string;
    weakestCategory: string;
  };
  timingStats?: {
    sellsFastestOn: string;
    lowTrafficHours: number[];
  };
}

type FeedInsight = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  message: string;
};

// -----------------------------------------------------------------------------
// Icon component
// -----------------------------------------------------------------------------

const ParallaxIcon = ({
  name,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}) => {
  return (
    <View>
      <Ionicons
        name={name}
        size={20}
        color={color}
        style={{ marginRight: 10 }}
      />
    </View>
  );
};

// -----------------------------------------------------------------------------
// Divider component
// -----------------------------------------------------------------------------

const Divider = () => (
  <View style={styles.divider} />
);

// -----------------------------------------------------------------------------
// Main screen
// -----------------------------------------------------------------------------

export default function AnalyticsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();

  // --- STATE ----------------------------------------------------------------
  const [items, setItems] = useState<ListedItem[]>([]);
  const [searchStats, setSearchStats] = useState({ topSearches: [], zeroResultFilters: [] });
  const [categoryStats, setCategoryStats] = useState({ bestCategory: "None", weakestCategory: "None" });
  const [timingStats, setTimingStats] = useState({ sellsFastestOn: "Unknown", lowTrafficHours: [] });

  // --- SCROLL VALUE --------------------------------------------------------

  const scrollY = new Animated.Value(0);
  const pulse = React.useRef(new Animated.Value(1)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.05,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ])
  ).start();
}, []);



  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      // Fetch seller's items
      const itemsResponse = await fetch(`${API_BASE_URL}/api/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData.items || []);
      }

      // Fetch analytics stats
      try {
        const statsResponse = await fetch(`${API_BASE_URL}/api/seller/analytics/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          if (stats.searchStats) setSearchStats(stats.searchStats);
          if (stats.categoryStats) setCategoryStats(stats.categoryStats);
          if (stats.timingStats) setTimingStats(stats.timingStats);
        }
      } catch (e) {
        console.log('Analytics stats endpoint not available yet');
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  // --- COMPUTED METRICS -----------------------------------------------------

  const totalItems = items?.length ?? 0;

  const avgBidCount =
    items.reduce((sum, item) => sum + (item.bid_count || 0), 0) /
    Math.max(totalItems, 1);

  const avgWatchers =
    items.reduce((sum, item) => sum + (item.watching_count || 0), 0) /
    Math.max(totalItems, 1);

  const strongInterest = avgBidCount > 1 || avgWatchers > 3;

  const priceComparisons = items.map((item) => {
    const similar = items.filter((i) => i.category === item.category);
    const avgPrice =
      similar.reduce((sum, i) => sum + (i.price || 0), 0) /
      Math.max(similar.length, 1);

    return {
      id: item.id,
      name: item.name,
      priceAboveMarket: item.price > avgPrice * 1.1,
    };
  });

  const itemsAboveMarket = priceComparisons.filter((p) => p.priceAboveMarket);

  const endingInLowTraffic = items.filter((item) => {
    if (!item.auction_ends_at) return false;
    const hour = new Date(item.auction_ends_at).getHours();
    return hour < 8 || hour > 22;
  });

  // --- GOAT INSIGHTS --------------------------------------------------------
  // Real insights only - no mock data
  const goatInsights: GoatInsight[] = [
    avgBidCount === 0 && generateInsight("NO_BIDS", {
      hoursLeft: 48,
      bidCount: avgBidCount,
    }),
    avgWatchers > 5 && generateInsight("WATCHERS", {
      watchers: avgWatchers,
    }),
  ].filter((i): i is GoatInsight => i !== null);

  // --- UNIFIED FEED ---------------------------------------------------------

  const feed: FeedInsight[] = [
    // Interest
    strongInterest && {
      icon: "happy",
      color: "#2ecc71",
      title: "Strong Interest",
      message: `Average ${avgBidCount.toFixed(1)} bids and ${avgWatchers.toFixed(1)} watchers per item. Keep the momentum going!`,
    },

    !strongInterest && totalItems > 0 && {
      icon: "alert-circle",
      color: "#f1c40f",
      title: "Could Use More Love",
      message: `Average ${avgBidCount.toFixed(1)} bids and ${avgWatchers.toFixed(1)} watchers. Try improving photos or adjusting the starting price.`,
    },

    // Pricing
    itemsAboveMarket.length > 0 && {
      icon: "pricetag",
      color: "#f1c40f",
      title: "Price Check",
      message: `${itemsAboveMarket.length} ${itemsAboveMarket.length === 1 ? 'item is' : 'items are'} priced higher than similar listings in their category.`,
    },

    itemsAboveMarket.length === 0 && totalItems > 0 && {
      icon: "cash",
      color: "#2ecc71",
      title: "Great Pricing",
      message: "Your prices are competitive with similar items in the market.",
    },

    // Search
    searchStats?.topSearches?.length > 0 && {
      icon: "search",
      color: "#3498db",
      title: "Popular Searches",
      message: `Top searches: ${searchStats.topSearches.slice(0, 3).join(', ')}`,
    },

    // Category
    categoryStats.bestCategory !== "None" && {
      icon: "trophy",
      color: "#2ecc71",
      title: "Top Category",
      message: `${categoryStats.bestCategory} is performing the best.`,
    },

    categoryStats.weakestCategory !== "None" && {
      icon: "trending-down",
      color: "#e74c3c",
      title: "Needs Attention",
      message: `${categoryStats.weakestCategory} could use improvement.`,
    },

    // Timing
    endingInLowTraffic.length > 0 && {
      icon: "moon",
      color: "#e74c3c",
      title: "Late Night Endings",
      message: `${endingInLowTraffic.length} ${endingInLowTraffic.length === 1 ? 'auction ends' : 'auctions end'} between 10pm-8am when traffic is lower.`,
    },

    timingStats.sellsFastestOn !== "Unknown" && {
      icon: "calendar",
      color: "#3498db",
      title: "Best Selling Days",
      message: `Your items sell fastest on ${timingStats.sellsFastestOn}.`,
    },

    // Goat Insights (merged seamlessly)
    ...goatInsights.map((insight) => ({
      icon: insight.icon,
      color: insight.color,
      title: insight.title,
      message: `${insight.message}\n💡 Tip: ${insight.tip}`,
    })),

    // Empty state
    totalItems === 0 && {
      icon: "cube-outline",
      color: "#999",
      title: "No Listings Yet",
      message: "Create your first listing to start seeing analytics and insights.",
    },
  ].filter((i): i is FeedInsight => Boolean(i));

  // --- HEALTH SCORE (simple example) ----------------------------------------

  const healthScore = Math.min(
    100,
    Math.round(
      40 +
        (strongInterest ? 20 : 0) +
        (itemsAboveMarket.length === 0 ? 20 : 0) +
        (searchStats.topSearches.length > 0 ? 10 : 0)
    )
  );

  const healthColor =
    healthScore >= 80 ? "#2ecc71" : healthScore >= 60 ? "#f1c40f" : "#e74c3c";

  // --- RENDER ---------------------------------------------------------------

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 60, paddingHorizontal: 16, backgroundColor: colors.background }}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>
        </View>

        <Text style={[styles.header, { color: colors.textPrimary }]}>📊 Your Listing Insights</Text>

      {/* Health score card */}
      <View style={[styles.healthCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#ffffff' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.healthLabel, { color: theme === 'dark' ? '#ECEDEE' : '#555' }]}>Listing Health</Text>
          <Text style={[styles.healthSubtitle, { color: theme === 'dark' ? '#999' : '#777' }]}>
            A quick snapshot of how your listings are doing overall.
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
  <Text style={[styles.healthScore, { color: healthColor }]}>
    {healthScore} / 100
  </Text>
</Animated.View>

      </View>

      <View style={styles.feed}>
        {feed.map((insight, index) => (
          <React.Fragment key={index}>
            <View style={styles.feedItem}>
              <ParallaxIcon
                name={insight.icon}
                color={insight.color}
              />

              <View style={{ flex: 1 }}>
                <Text style={[styles.feedTitle, { color: colors.textPrimary }]}>{insight.title}</Text>
                <Text style={[styles.feedMessage, { color: theme === 'dark' ? '#999' : '#555' }]}>{insight.message}</Text>
              </View>
            </View>

            {index < feed.length - 1 && <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#333' : '#eee' }]} />}
          </React.Fragment>
        ))}
      </View>

        <View style={{ height: 80 }} />
      </Animated.ScrollView>
       <GlobalFooter/>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    color: "#1a1a1a",
  },
  healthCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  healthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  healthSubtitle: {
    fontSize: 14,
    marginTop: 4,
    color: "#777",
  },
  healthScore: {
    fontSize: 24,
    fontWeight: "800",
  },
  feed: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  feedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 6,
    opacity: 0.7,
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  feedMessage: {
    fontSize: 15,
    color: "#555",
    lineHeight: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ElasticsearchResultCard from './components/ElasticsearchResultCard';
import { API_URL } from '@/constants/api';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';



// Elasticsearch search result type
interface ElasticsearchItem {
  item_id: number;
  name: string;
  description?: string;
  photo_url?: string;
  price: number;
  highest_bid?: number;
  bid_count?: number;
  category?: string;
  rarity?: 'common' | 'rare' | 'legendary';
  auction_ends_at?: string;
  selling_strategy?: string;
  buy_it_now?: number;
  is_sold?: boolean;
  status?: 'sold' | 'active';
  is_favorite?: boolean;
  is_must_sell?: number;
  _score?: number;
}

// Help result from old API
interface HelpResult {
  label: string;
  value: string;
  type: string;
  extra?: {
    description?: string;
  };
}



const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SearchScreen() {
  const router = useRouter();
  const { q, strategy } = useLocalSearchParams<{ q: string; strategy?: string }>();
  const { token } = useAuth();
  const { theme, colors } = useTheme();
  const [items, setItems] = useState<ElasticsearchItem[]>([]);
  const [helpResults, setHelpResults] = useState<HelpResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  // Scroll animation for EnhancedHeader
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const headerOpacity = useRef(new RNAnimated.Value(0)).current;
  const headerScale = useRef(new RNAnimated.Value(1)).current;

  // Header animation - fade in and pulsate
  useEffect(() => {
    setTimeout(() => {
      RNAnimated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            RNAnimated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  }, []);

  // Load user's favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch(`${API_URL}/api/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const favoritesMap: Record<number, boolean> = {};

          // Create a map of item_id -> true for quick lookups
          if (data.favorites && Array.isArray(data.favorites)) {
            data.favorites.forEach((fav: any) => {
              favoritesMap[fav.item_id] = true;
            });
          }

          setFavorites(favoritesMap);
          console.log('🔍 Loaded favorites:', Object.keys(favoritesMap).length);
        }
      } catch (err) {
        console.error('🔍 Failed to load favorites:', err);
      }
    };

    if (token) {
      loadFavorites();
    }
  }, [token]);

  useEffect(() => {
    const searchItems = async () => {
      if (!q) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use new Elasticsearch endpoint
        const response = await fetch(`${API_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: q,
            strategy: strategy || undefined,
            size: 50,
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 Elasticsearch search results:', data);

        // Filter out sold items and items with missing critical fields
        const activeItems = (data.hits || []).filter((item: ElasticsearchItem) =>
          !item.is_sold &&
          item.status !== 'sold' &&
          item.name &&
          item.item_id
        );

        // Update favorites map with any is_favorite flags from results
        const updatedFavorites = { ...favorites };
        activeItems.forEach((item: ElasticsearchItem) => {
          if (item.is_favorite !== undefined) {
            updatedFavorites[item.item_id] = Boolean(item.is_favorite);
          }
        });
        setFavorites(updatedFavorites);

        setItems(activeItems);
        setHelpResults(data.help || []);
        setTotal(activeItems.length);
      } catch (err) {
        console.error('🔍 Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    searchItems();
  }, [q, strategy, token]);

  const handleHeartPress = async (itemId: number) => {
    try {
      const isFavorited = favorites[itemId];

      if (!isFavorited) {
        // Add to favorites
        await fetch(`${API_URL}/api/favorites`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: itemId }),
        });
        console.log('💖 Added item to favorites:', itemId);
      } else {
        // Remove from favorites
        await fetch(`${API_URL}/api/favorites/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('💖 Removed item from favorites:', itemId);
      }

      // Toggle favorite state in UI
      setFavorites(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    } catch (err) {
      console.error('💖 Failed to toggle favorite:', err);
    }
  };

  const renderHelpItem = ({ item }: { item: HelpResult }) => {
    const isExpanded = expandedId === item.value;

    const toggleExpand = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedId(isExpanded ? null : item.value);
    };

    return (
      <TouchableOpacity style={[styles.helpCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]} onPress={toggleExpand} activeOpacity={0.9}>
        <Ionicons name="help-circle-outline" size={36} color="#FF6B35" />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.helpTitle, { color: colors.textPrimary }]}>{item.label}</Text>
          <Text style={[styles.helpDescription, { color: theme === 'dark' ? '#999' : '#666' }]} numberOfLines={2}>
            {item.extra?.description || 'No description available'}
          </Text>
          {isExpanded && item.extra?.description && (
            <Text style={[styles.helpDetails, { color: theme === 'dark' ? '#ECEDEE' : '#242c40' }]}>{item.extra.description}</Text>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme === 'dark' ? '#999' : '#242c40'}
        />
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ElasticsearchItem }) => {
    return (
      <ElasticsearchResultCard
        item={item}
        onHeartPress={handleHeartPress}
        isFavorited={favorites[item.item_id]}
        showRelevanceScore={false}
      />
    );
  };


  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Enhanced Header */}
        <EnhancedHeader
          scrollY={scrollY}
          title={q as string}
          subtitle="Search Results"
          onSearch={() => {}}
        />

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          <Text style={[styles.loadingText, { color: theme === 'dark' ? '#999' : '#666' }]}>Searching...</Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#e53e3e" />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && helpResults.length === 0 && (
        <View style={styles.centerContent}>
          <Ionicons name="search-outline" size={64} color={theme === 'dark' ? '#666' : '#ccc'} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No results found</Text>
          <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#666' }]}>Try a different search term</Text>
        </View>
      )}

      {/* Results */}
      {!loading && !error && (items.length > 0 || helpResults.length > 0) && (
        <RNAnimated.FlatList
          data={items}
          keyExtractor={(item) => `item-${item.item_id}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          onScroll={RNAnimated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
            ListHeaderComponent={
              <View style={{ paddingTop: HEADER_MAX_HEIGHT }}>
                {/* Page Header with Back Arrow */}
                <RNAnimated.View style={[
                  styles.pageHeader,
                  {
                    opacity: headerOpacity,
                    transform: [{ scale: headerScale }],
                    backgroundColor: colors.background,
                  }
                ]}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                  </TouchableOpacity>
                  <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Search Results</Text>
                </RNAnimated.View>

                <Text style={[styles.resultCount, { color: colors.textPrimary }]}>
                  Found {total} result{total !== 1 ? 's' : ''} for &#34;{q}&#34;
                </Text>

                {/* Help Results Section - Only show when no items found */}
                {helpResults.length > 0 && items.length === 0 && (
                  <View style={styles.helpSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💡 Help & Support</Text>
                    {helpResults.map((help) => (
                      <View key={help.value}>
                        {renderHelpItem({ item: help })}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            }
        />
      )}
      <GlobalFooter />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: HEADER_MAX_HEIGHT,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e53e3e',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  helpSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#242c40',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  helpCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFF9F5',
    borderWidth: 1,
    borderColor: '#FFE4D6',
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#242c40',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
  },
  helpDetails: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
    lineHeight: 20,
  },
});

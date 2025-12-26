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
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ElasticsearchResultCard from './components/ElasticsearchResultCard';
import { API_URL } from '@/constants/api';



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
  const { q } = useLocalSearchParams<{ q: string }>();
  const { token } = useAuth();
  const [items, setItems] = useState<ElasticsearchItem[]>([]);
  const [helpResults, setHelpResults] = useState<HelpResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

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
            size: 50,
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 Elasticsearch search results:', data);

        setItems(data.hits || []);
        setHelpResults(data.help || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('🔍 Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    searchItems();
  }, [q, token]);

  const handleHeartPress = async (itemId: number) => {
    // Toggle favorite state
    setFavorites(prev => ({ ...prev, [itemId]: !prev[itemId] }));

    // TODO: Sync with backend favorites API
    console.log('💖 Toggled favorite for item:', itemId);
  };

  const renderHelpItem = ({ item }: { item: HelpResult }) => {
    const isExpanded = expandedId === item.value;

    const toggleExpand = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedId(isExpanded ? null : item.value);
    };

    return (
      <TouchableOpacity style={styles.helpCard} onPress={toggleExpand} activeOpacity={0.9}>
        <Ionicons name="help-circle-outline" size={36} color="#FF6B35" />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.helpTitle}>{item.label}</Text>
          <Text style={styles.helpDescription} numberOfLines={2}>
            {item.extra?.description || 'No description available'}
          </Text>
          {isExpanded && item.extra?.description && (
            <Text style={styles.helpDetails}>{item.extra.description}</Text>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#242c40"
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#242c40" />
        </TouchableOpacity>
        <Text style={styles.searchQuery} numberOfLines={1}>
          {q}
        </Text>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#e53e3e" />
          <Text style={styles.errorText}>{error}</Text>
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
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      )}

      {/* Results */}
      {!loading && !error && (items.length > 0 || helpResults.length > 0) && (
        <FlatList
          data={items}
          keyExtractor={(item) => `item-${item.item_id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <Text style={styles.resultCount}>
                Found {total} result{total !== 1 ? 's' : ''} for "{q}"
              </Text>

              {/* Help Results Section */}
              {helpResults.length > 0 && (
                <View style={styles.helpSection}>
                  <Text style={styles.sectionTitle}>💡 Help & Support</Text>
                  {helpResults.map((help) => (
                    <View key={help.value}>
                      {renderHelpItem({ item: help })}
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>🛍️ Marketplace Items</Text>
                </View>
              )}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
  },
  searchQuery: {
    fontSize: 18,
    fontWeight: '600',
    color: '#242c40',
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
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

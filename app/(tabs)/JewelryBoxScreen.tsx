import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  Animated,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { formatTimeWithSeconds } from '@/utils/time';
import { AuctionItem, ListedItem } from '@/types/items';
import { useWishlist } from '@/app/wishlistContext';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { setUser } from '@/utils/userSlice';
import { getUserProfile } from '@/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/theme/ThemeContext';

export default function JewelryBoxScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const { addToWishlist, refreshWishlist } = useWishlist();
  const { isAuthenticated, username, token } = useAuth();
  const [allItems, setAllItems] = useState<ListedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ListedItem[]>([]);
  const [favoritedMap, setFavoritedMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high' | 'ending_soon'>('recent');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilterHelp, setShowFilterHelp] = useState(false);
  const [showSortHelp, setShowSortHelp] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const dispatch = useAppDispatch();

  // Fetch favorites from backend
  const fetchFavoritesFromBackend = React.useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('http://10.0.0.170:5000/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        console.log('🐐 JewelryBox: Fetched', items.length, 'favorites');
        setAllItems(items);
        setFilteredItems(items);

        const favMap: Record<number, boolean> = {};
        items.forEach((item: ListedItem) => {
          favMap[item.id] = true;
        });
        setFavoritedMap(favMap);
        await AsyncStorage.setItem('favoritedItems', JSON.stringify(favMap));
      } else {
        setAllItems([]);
        setFilteredItems([]);
      }
    } catch (error) {
      console.error('🐐 JewelryBox: Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshWishlist();
    }
  }, [token, refreshWishlist]);

  useEffect(() => {
    fetchFavoritesFromBackend();
  }, [fetchFavoritesFromBackend]);

  useFocusEffect(
    React.useCallback(() => {
      fetchFavoritesFromBackend();
    }, [fetchFavoritesFromBackend])
  );

  useEffect(() => {
    const hydrateUser = async () => {
      if (token) {
        const profile = await getUserProfile(token);
        if (profile) {
          dispatch(setUser(profile));
        }
      }
    };
    hydrateUser();
  }, [token, dispatch]);

  // Fade in header title - wait for screen to fully render first
  useEffect(() => {
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000, // 2 seconds - slow and dramatic
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500); // 500ms delay - let screen render fully first
  }, []);

  // Apply sorting and filtering
  useEffect(() => {
    let items = [...allItems];

    // Filter by category
    if (filterCategory !== 'all') {
      items = items.filter(item => {
        const tags = item.tags?.toLowerCase() || '';
        const name = item.name?.toLowerCase() || '';
        const category = item.category?.toLowerCase() || '';
        const searchText = `${tags} ${name} ${category}`;

        // Use word boundary regex to avoid partial matches (e.g., "ring" shouldn't match "earring")
        const pattern = new RegExp(`\\b${filterCategory}s?\\b`, 'i');
        const matches = pattern.test(searchText);

        // Debug logging for item #723
        if (item.id === 723) {
          console.log('🐐 JewelryBox Filter Debug - Item #723:');
          console.log('  Filter:', filterCategory);
          console.log('  Name:', name);
          console.log('  Tags:', tags);
          console.log('  Category:', category);
          console.log('  Search text:', searchText);
          console.log('  Pattern:', pattern.source);
          console.log('  Match result:', matches);
        }

        return matches;
      });
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        items.sort((a, b) => (a.highest_bid || a.price || 0) - (b.highest_bid || b.price || 0));
        break;
      case 'price_high':
        items.sort((a, b) => (b.highest_bid || b.price || 0) - (a.highest_bid || a.price || 0));
        break;
      case 'ending_soon':
        items.sort((a, b) => {
          if (!a.auction_ends_at) return 1;
          if (!b.auction_ends_at) return -1;
          return new Date(a.auction_ends_at).getTime() - new Date(b.auction_ends_at).getTime();
        });
        break;
      default: // recent
        break;
    }

    setFilteredItems(items);
  }, [allItems, sortBy, filterCategory]);

  const handleToggleFavorite = async (itemId: number) => {
    try {
      const isFavorited = favoritedMap[itemId];

      if (!isFavorited) {
        // Add to favorites
        await fetch('http://10.0.0.170:5000/api/favorites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: itemId }),
        });

        const updated = { ...favoritedMap, [itemId]: true };
        setFavoritedMap(updated);
        await AsyncStorage.setItem('favoritedItems', JSON.stringify(updated));
      } else {
        // Remove from favorites
        await fetch(`http://10.0.0.170:5000/api/favorites/${itemId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Immediately remove from UI
        setAllItems(prev => prev.filter(item => item.id !== itemId));
        setFilteredItems(prev => prev.filter(item => item.id !== itemId));

        const updated = { ...favoritedMap, [itemId]: false };
        setFavoritedMap(updated);
        await AsyncStorage.setItem('favoritedItems', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('🐐 Failed to toggle favorite:', err);
    }
  };

  const handleShare = async (item: ListedItem) => {
    try {
      await Share.share({
        message: `Check out this item on BidGoat: ${item.name}\nCurrent price: $${(item.highest_bid || item.price || 0).toFixed(2)}`,
        url: item.photo_url,
        title: item.name,
      });
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  const getCountdownColor = (endTime: string): string => {
    const now = Date.now();
    const end = new Date(endTime).getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);

    if (diffHours <= 2) return '#e53e3e';
    if (diffHours <= 24) return '#FF6B35';
    return '#38a169';
  };

  const getCategoryBadge = (item: ListedItem) => {
    const tags = item.tags?.toLowerCase() || '';
    const name = item.name?.toLowerCase() || '';
    const category = item.category?.toLowerCase() || '';

    const searchText = `${tags} ${name} ${category}`;

    // Use word boundary regex for more precise matching
    // Check most specific categories first
    if (/\bearring|\bearings\b/i.test(searchText)) return { icon: '👂', label: 'Earrings', color: '#E91E63' };
    if (/\bpendant|\bpendants\b/i.test(searchText)) return { icon: '📿', label: 'Pendant', color: '#9C27B0' };
    if (/\bcoin|\bcoins\b/i.test(searchText)) return { icon: '🪙', label: 'Coins', color: '#FF9800' };
    if (/\banklet|\banklets\b/i.test(searchText)) return { icon: '🦶', label: 'Anklet', color: '#00BCD4' };
    if (/\bwatch|\bwatches\b/i.test(searchText)) return { icon: '⌚', label: 'Watch', color: '#6A0DAD' };
    if (/\bring|\brings\b/i.test(searchText)) return { icon: '💍', label: 'Ring', color: '#FF6B35' };
    if (/\bnecklace|\bnecklaces\b/i.test(searchText)) return { icon: '📿', label: 'Necklace', color: '#4A90E2' };
    if (/\bbracelet|\bbracelets\b/i.test(searchText)) return { icon: '🔗', label: 'Bracelet', color: '#FFD700' };
    if (/\bbrooch|\bbrooches\b/i.test(searchText)) return { icon: '📌', label: 'Brooch', color: '#D32F2F' };
    if (/\bchain|\bchains\b/i.test(searchText)) return { icon: '⛓️', label: 'Chain', color: '#607D8B' };
    if (/\bgemstone|\bgem\b|\bgems\b/i.test(searchText)) return { icon: '💠', label: 'Gemstone', color: '#00BCD4' };
    if (/\bdiamond|\bdiamonds\b/i.test(searchText)) return { icon: '💎', label: 'Diamond', color: '#00BCD4' };
    if (/\bgold\b/i.test(searchText)) return { icon: '🏆', label: 'Gold', color: '#FFD700' };
    if (/\bsilver\b/i.test(searchText)) return { icon: '⚪', label: 'Silver', color: '#C0C0C0' };
    if (/\bantique|\bvintage\b/i.test(searchText)) return { icon: '🏺', label: 'Antique', color: '#8D6E63' };

    return { icon: '✨', label: 'Jewelry', color: '#4CAF50' };
  };

  const isEndingSoon = (endTime?: string) => {
    if (!endTime) return false;
    const diffHours = (new Date(endTime).getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

  const FilterChip = ({ label, value, active }: { label: string; value: string; active: boolean }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' },
        active && styles.filterChipActive
      ]}
      onPress={() => setFilterCategory(value)}
    >
      <Text style={[
        styles.filterChipText,
        { color: theme === 'dark' && !active ? '#ECEDEE' : '#4a5568' },
        active && styles.filterChipTextActive
      ]}>{label}</Text>
    </TouchableOpacity>
  );

  const SortChip = ({ label, value, active }: { label: string; value: typeof sortBy; active: boolean }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' },
        active && styles.filterChipActive
      ]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[
        styles.filterChipText,
        { color: theme === 'dark' && !active ? '#ECEDEE' : '#4a5568' },
        active && styles.filterChipTextActive
      ]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#6A0DAD', '#FF6B35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="heart-outline" size={60} color="#FFF" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Your Collection Awaits</Text>
      <Text style={styles.emptySubtext}>
        Start building your dream collection by favoriting items you love
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.exploreButtonText}>Explore Auctions</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = (item: ListedItem, index: number) => {
    const category = getCategoryBadge(item);
    const price = item.highest_bid || item.price || 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.cardWrapper}
        onPress={() => router.push(`/item/${item.id}`)}
        activeOpacity={0.95}
      >
        <View style={styles.card}>
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.photo_url }} style={styles.image} resizeMode="cover" />

            {/* Gradient Overlay at bottom for better text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageGradient}
            />

            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
              <Text style={styles.categoryText}>{category.icon} {category.label}</Text>
            </View>

            {/* Ending Soon Badge */}
            {isEndingSoon(item.auction_ends_at) && (
              <View style={styles.urgencyBadge}>
                <Ionicons name="flame" size={12} color="#FFF" />
                <Text style={styles.urgencyText}>ENDING SOON</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(item.id);
                }}
              >
                <Ionicons name="heart" size={20} color="#FF1744" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleShare(item);
                }}
              >
                <Ionicons name="share-social" size={18} color="#6A0DAD" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>${price.toLocaleString()}</Text>
              {(item.bidCount ?? 0) > 0 && (
                <View style={styles.bidBadge}>
                  <MaterialCommunityIcons name="gavel" size={10} color="#FFF" />
                  <Text style={styles.bidCount}>{item.bidCount}</Text>
                </View>
              )}
            </View>

            {/* Countdown Timer */}
            {item.auction_ends_at && (
              <View style={styles.countdownRow}>
                <Ionicons name="time-outline" size={14} color={getCountdownColor(item.auction_ends_at)} />
                <Text style={[styles.countdownText, { color: getCountdownColor(item.auction_ends_at) }]}>
                  {formatTimeWithSeconds(item.auction_ends_at, Date.now())}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + 30,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6A0DAD" />
            <Text style={styles.loadingText}>Loading your favorites...</Text>
          </View>
        )}

        {!loading && filteredItems.length === 0 && allItems.length === 0 && renderEmptyState()}

        {!loading && !(filteredItems.length === 0 && allItems.length === 0) && (
          <>
            {/* Header Stats */}
            <Animated.View style={[styles.headerStats, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                💖 My Favorites
              </Text>
              <Text style={[styles.headerCount, { color: theme === 'dark' ? '#999' : '#666' }]}>
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </Text>
            </Animated.View>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            >
              <View style={styles.filterLabelRow}>
                <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Category:</Text>
                <TouchableOpacity onPress={() => setShowFilterHelp(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="help-circle" size={16} color="#6A0DAD" />
                </TouchableOpacity>
              </View>
              <FilterChip label="All" value="all" active={filterCategory === 'all'} />
              <FilterChip label="💍 Rings" value="ring" active={filterCategory === 'ring'} />
              <FilterChip label="⌚ Watches" value="watch" active={filterCategory === 'watch'} />
              <FilterChip label="👂 Earrings" value="earring" active={filterCategory === 'earring'} />
              <FilterChip label="📿 Necklaces" value="necklace" active={filterCategory === 'necklace'} />
              <FilterChip label="🔗 Bracelets" value="bracelet" active={filterCategory === 'bracelet'} />
              <FilterChip label="🦶 Anklets" value="anklet" active={filterCategory === 'anklet'} />
              <FilterChip label="🪙 Coins" value="coin" active={filterCategory === 'coin'} />
            </ScrollView>

            {/* Sort Options */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            >
              <View style={styles.filterLabelRow}>
                <Text style={styles.filterLabel}>Sort:</Text>
                <TouchableOpacity onPress={() => setShowSortHelp(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="help-circle" size={16} color="#6A0DAD" />
                </TouchableOpacity>
              </View>
              <SortChip label="Recent" value="recent" active={sortBy === 'recent'} />
              <SortChip label="💰 Low to High" value="price_low" active={sortBy === 'price_low'} />
              <SortChip label="💎 High to Low" value="price_high" active={sortBy === 'price_high'} />
              <SortChip label="⏰ Ending Soon" value="ending_soon" active={sortBy === 'ending_soon'} />
            </ScrollView>

            {/* Items Grid */}
            <View style={styles.grid}>
              {filteredItems.map((item, index) => renderItem(item, index))}
            </View>
          </>
        )}
      </Animated.ScrollView>

      <EnhancedHeader scrollY={scrollY} username={username ?? null} onSearch={() => {}} />

      {/* Filter Help Modal */}
      <Modal
        visible={showFilterHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📂 Category Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterHelp(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>How Filtering Works</Text>
                <Text style={styles.modalDescription}>
                  Tap a category to show only items of that type. Tap &#34;All&#34; to see everything in your favorites.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Categories</Text>
                <Text style={styles.modalDescription}>
                  • ⌚ Watches - Luxury timepieces{'\n'}
                  • 💍 Rings - Engagement rings, wedding bands, etc.{'\n'}
                  • 📿 Necklaces - Chains, pendants, and more{'\n'}
                  • 🔗 Bracelets - Tennis bracelets, bangles, etc.{'\n'}
                  • 👂 Earrings - Studs, huggies, chandelier, hoops, and drops{'\n'}
                  • 🦶 Anklets - Ankle bracelets and chains{'\n'}
                  • 🪙 Coins - Collectible and precious metal coins
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Quick Tip</Text>
                <Text style={styles.modalDescription}>
                  Use filters to quickly find specific items when your collection grows!
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort Help Modal */}
      <Modal
        visible={showSortHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔄 Sort Options</Text>
              <TouchableOpacity onPress={() => setShowSortHelp(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Recent</Text>
                <Text style={styles.modalDescription}>
                  Shows items in the order you favorited them, with most recent first.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>💰 Price: Low to High</Text>
                <Text style={styles.modalDescription}>
                  Perfect for finding deals! Shows lowest-priced items first.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>💎 Price: High to Low</Text>
                <Text style={styles.modalDescription}>
                  Browse premium items first. Shows highest-priced items at the top.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>⏰ Ending Soon</Text>
                <Text style={styles.modalDescription}>
                  Don&#39;t miss out! Shows auctions ending soonest first so you can place your bids.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - PADDING * 2 - GAP) / NUM_COLUMNS;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerStats: {
    paddingHorizontal: PADDING,
    marginBottom: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filtersContainer: {
    paddingHorizontal: PADDING,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PADDING,
    gap: GAP,
    marginTop: 8,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: GAP,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.25,
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  urgencyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    padding: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  bidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  bidCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A0DAD',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#6A0DAD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
  },
  modalScrollView: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
});

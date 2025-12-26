import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import MascotOverlay from '@/app/components/MascotOverlay';
import type { MascotMood } from '@/types/goatmoods';

type JewelryItem = {
  id: number;
  name: string;
  photo_url: string;
  sale_price: number;
  purchase_date: string;
  category: string;
  rarity: string;
  current_value?: number;
};

type CollectionStats = {
  total_items: number;
  total_value: number;
  categories: { [key: string]: number };
  rarity_distribution: { [key: string]: number };
  best_investment?: {
    name: string;
    gain_percentage: number;
  };
};

const CATEGORY_ICONS: { [key: string]: any } = {
  'Rings': 'ellipse',
  'Necklaces': 'fitness',
  'Watches': 'watch',
  'Earrings': 'ear',
  'Bracelets': 'git-branch',
  'Brooches': 'sparkles',
  'All': 'apps',
};

const RARITY_COLORS: { [key: string]: string } = {
  common: '#95a5a6',
  uncommon: '#27ae60',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12',
  mythic: '#e74c3c',
};

export default function JewelryBoxScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const boxScale = useRef(new Animated.Value(0.8)).current;
  const boxOpacity = useRef(new Animated.Value(0)).current;

  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [boxOpened, setBoxOpened] = useState(false);

  // New features
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'value-high' | 'value-low' | 'name'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Goat mascot & modals
  const [showGoat, setShowGoat] = useState(false);
  const [goatMood, setGoatMood] = useState<MascotMood>('Excited');
  const [goatMessage, setGoatMessage] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [itemNotes, setItemNotes] = useState('');

  useEffect(() => {
    const loadUsername = async () => {
      const name = await AsyncStorage.getItem('username');
      setUsername(name);
    };
    loadUsername();
    loadCollection();
    checkFirstVisit();
  }, []);

  const checkFirstVisit = async () => {
    const hasVisited = await AsyncStorage.getItem('jewelry_box_visited');
    if (!hasVisited) {
      setTimeout(() => setShowOnboarding(true), 1500); // Show after box opens
      await AsyncStorage.setItem('jewelry_box_visited', 'true');
    }
  };

  useEffect(() => {
    // Animate jewelry box opening
    Animated.parallel([
      Animated.spring(boxScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(boxOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setBoxOpened(true), 500);
    });
  }, []);

  const loadCollection = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in to view your jewelry box');
        router.push('/sign-in');
        return;
      }

      const response = await fetch('http://10.0.0.170:5000/api/buyer/purchases', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);

        // Calculate stats
        const totalValue = data.items.reduce((sum: number, item: JewelryItem) => sum + (item.current_value || item.sale_price), 0);
        const categories: { [key: string]: number } = {};
        const rarityDist: { [key: string]: number } = {};

        data.items.forEach((item: JewelryItem) => {
          categories[item.category] = (categories[item.category] || 0) + 1;
          rarityDist[item.rarity] = (rarityDist[item.rarity] || 0) + 1;
        });

        setStats({
          total_items: data.items.length,
          total_value: totalValue,
          categories,
          rarity_distribution: rarityDist,
        });
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by category and search
  let filteredItems = selectedCategory === 'All'
    ? items
    : items.filter(item => item.category === selectedCategory);

  // Apply search filter
  if (searchQuery.trim()) {
    filteredItems = filteredItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
      case 'value-high':
        return (b.current_value || b.sale_price) - (a.current_value || a.sale_price);
      case 'value-low':
        return (a.current_value || a.sale_price) - (b.current_value || b.sale_price);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Calculate achievements
  const getAchievements = () => {
    if (!stats) return [];

    const achievements = [];

    // First Purchase
    if (stats.total_items >= 1) {
      achievements.push({ icon: 'star', color: '#FFD700', label: 'First Treasure', earned: true });
    }

    // Collector (10+ items)
    if (stats.total_items >= 10) {
      achievements.push({ icon: 'trophy', color: '#FF6B35', label: 'Collector', earned: true });
    }

    // High Roller ($10k+ collection)
    if (stats.total_value >= 10000) {
      achievements.push({ icon: 'cash', color: '#4CAF50', label: 'High Roller', earned: true });
    }

    // Legendary Hunter (5+ legendary items)
    if ((stats.rarity_distribution.legendary || 0) >= 5) {
      achievements.push({ icon: 'flame', color: '#e74c3c', label: 'Legend Hunter', earned: true });
    }

    // Category Master (all categories have items)
    const categoryCount = Object.keys(stats.categories).length;
    if (categoryCount >= 5) {
      achievements.push({ icon: 'checkmark-circle', color: '#9b59b6', label: 'Category Master', earned: true });
    }

    return achievements;
  };

  const achievements = getAchievements();

  // Load notes from backend
  const loadItemNotes = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return '';

      const response = await fetch(`http://10.0.0.170:5000/api/items/${itemId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.notes || '';
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
    return '';
  };

  // Save notes to backend
  const saveItemNotes = async (itemId: number, notes: string) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in to save notes');
        return false;
      }

      const response = await fetch(`http://10.0.0.170:5000/api/items/${itemId}/notes`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        return true;
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to save notes');
        return false;
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
      return false;
    }
  };

  const renderCategoryButton = (category: string) => {
    const count = category === 'All' ? items.length : (stats?.categories[category] || 0);
    const isSelected = selectedCategory === category;

    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryButton, isSelected && styles.categoryButtonActive]}
        onPress={() => setSelectedCategory(category)}
      >
        <Ionicons
          name={CATEGORY_ICONS[category] || 'diamond'}
          size={24}
          color={isSelected ? '#fff' : '#6A0DAD'}
        />
        <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextActive]}>
          {category}
        </Text>
        <View style={[styles.categoryCount, isSelected && styles.categoryCountActive]}>
          <Text style={[styles.categoryCountText, isSelected && styles.categoryCountTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={styles.loadingText}>Opening your jewelry box...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0118' }}>
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>My Jewelry Box</Text>
          <TouchableOpacity
            onPress={() => {
              setOnboardingStep(0);
              setShowOnboarding(true);
            }}
            style={styles.helpButton}
          >
            <Ionicons name="help-circle" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Animated Jewelry Box Hero */}
        <Animated.View
          style={[
            styles.heroBox,
            {
              transform: [{ scale: boxScale }],
              opacity: boxOpacity,
            }
          ]}
        >
          <LinearGradient
            colors={['#6A0DAD', '#9B4DCA', '#C77DFF']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="gift" size={60} color="#FFD700" />
            <Text style={styles.heroText}>Your Treasure Trove</Text>
            {boxOpened && (
              <Animated.View style={styles.sparkleContainer}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
                <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginLeft: -10 }} />
                <Ionicons name="sparkles" size={18} color="#FFD700" style={{ marginLeft: -8 }} />
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Collection Stats */}
        {stats && (
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['#1a0033', '#2d1b4e']}
              style={styles.statsGradient}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="diamond" size={32} color="#FFD700" />
                  <Text style={styles.statValue}>{stats.total_items}</Text>
                  <Text style={styles.statLabel}>Pieces</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="cash" size={32} color="#4CAF50" />
                  <Text style={styles.statValue}>${stats.total_value.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Value</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="trophy" size={32} color="#FF6B35" />
                  <Text style={styles.statValue}>
                    {stats.rarity_distribution.legendary || 0}
                  </Text>
                  <Text style={styles.statLabel}>Legendary</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Achievements Unlocked</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
              {achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementBadge}>
                  <LinearGradient
                    colors={['#1a0033', '#2d1b4e']}
                    style={styles.achievementGradient}
                  >
                    <Ionicons name={achievement.icon as any} size={28} color={achievement.color} />
                    <Text style={styles.achievementLabel}>{achievement.label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search & Controls */}
        <View style={styles.controlsSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#C77DFF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your collection..."
              placeholderTextColor="#6A0DAD"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#C77DFF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowSortMenu(!showSortMenu)}
            >
              <Ionicons name="swap-vertical" size={18} color="#C77DFF" />
              <Text style={styles.controlButtonText}>
                {sortBy === 'recent' ? 'Recent' : sortBy === 'value-high' ? 'Highest' : sortBy === 'value-low' ? 'Lowest' : 'A-Z'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons name={viewMode === 'grid' ? 'grid' : 'list'} size={18} color="#C77DFF" />
              <Text style={styles.controlButtonText}>{viewMode === 'grid' ? 'Grid' : 'List'}</Text>
            </TouchableOpacity>
          </View>

          {/* Sort Menu Dropdown */}
          {showSortMenu && (
            <View style={styles.sortMenu}>
              {[
                { key: 'recent', label: 'Most Recent', icon: 'time' },
                { key: 'value-high', label: 'Highest Value', icon: 'trending-up' },
                { key: 'value-low', label: 'Lowest Value', icon: 'trending-down' },
                { key: 'name', label: 'Alphabetical', icon: 'text' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy(option.key as any);
                    setShowSortMenu(false);
                  }}
                >
                  <Ionicons name={option.icon as any} size={18} color={sortBy === option.key ? '#FFD700' : '#C77DFF'} />
                  <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
                    {option.label}
                  </Text>
                  {sortBy === option.key && <Ionicons name="checkmark" size={18} color="#FFD700" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Category Filter Compartments */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>✨ Compartments</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {renderCategoryButton('All')}
            {Object.keys(stats?.categories || {}).map(category => renderCategoryButton(category))}
          </ScrollView>
        </View>

        {/* Items Grid/List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>
            💎 {selectedCategory === 'All' ? 'All Items' : selectedCategory} ({sortedItems.length})
          </Text>
          {sortedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="diamond-outline" size={64} color="#6A0DAD" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No items match your search' : 'No items in this category yet'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push('/')}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.exploreButtonText}>Explore Auctions</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={viewMode === 'grid' ? styles.itemsGrid : styles.itemsList}>
              {sortedItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => router.push(`/(tabs)/item/${item.id}`)}
                  onLongPress={async () => {
                    setSelectedItem(item);
                    const notes = await loadItemNotes(item.id);
                    setItemNotes(notes);
                    setShowNotesModal(true);
                  }}
                >
                  <LinearGradient
                    colors={['#1a0033', '#2d1b4e']}
                    style={styles.itemCardGradient}
                  >
                    <Image
                      source={{ uri: item.photo_url }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                    <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[item.rarity] || '#95a5a6' }]}>
                      <Ionicons name="star" size={12} color="#fff" />
                      <Text style={styles.rarityText}>{item.rarity}</Text>
                    </View>
                    {/* Notes indicator */}
                    <TouchableOpacity
                      style={styles.notesIcon}
                      onPress={async (e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                        const notes = await loadItemNotes(item.id);
                        setItemNotes(notes);
                        setShowNotesModal(true);
                      }}
                    >
                      <Ionicons name="document-text" size={16} color="#FFD700" />
                    </TouchableOpacity>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${item.sale_price.toLocaleString()}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Goat Mascot */}
      {showGoat && (
        <MascotOverlay
          mood={goatMood}
          message={goatMessage}
          position="center"
          visible={showGoat}
          animate={true}
          onDismiss={() => setShowGoat(false)}
        />
      )}

      {/* Onboarding Guide */}
      {showOnboarding && (
        <Modal
          visible={showOnboarding}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOnboarding(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.onboardingCard}>
              <LinearGradient
                colors={['#6A0DAD', '#9B4DCA']}
                style={styles.onboardingGradient}
              >
                {onboardingStep === 0 && (
                  <>
                    <Ionicons name="gift" size={64} color="#FFD700" />
                    <Text style={styles.onboardingTitle}>Welcome to Your Treasure Trove! 🎁</Text>
                    <Text style={styles.onboardingText}>
                      Your jewelry collection lives here. Track every sparkle, celebrate milestones, and keep your precious items organized.
                    </Text>
                  </>
                )}
                {onboardingStep === 1 && (
                  <>
                    <Ionicons name="search" size={64} color="#FFD700" />
                    <Text style={styles.onboardingTitle}>Search & Organize 🔍</Text>
                    <Text style={styles.onboardingText}>
                      Use the search bar to find items instantly. Sort by value, date, or name. Switch between grid and list views.
                    </Text>
                  </>
                )}
                {onboardingStep === 2 && (
                  <>
                    <Ionicons name="trophy" size={64} color="#FFD700" />
                    <Text style={styles.onboardingTitle}>Unlock Achievements 🏆</Text>
                    <Text style={styles.onboardingText}>
                      Earn badges as your collection grows: First Treasure, Collector, High Roller, Legend Hunter, and more!
                    </Text>
                  </>
                )}
                {onboardingStep === 3 && (
                  <>
                    <Ionicons name="diamond" size={64} color="#FFD700" />
                    <Text style={styles.onboardingTitle}>Track Your Collection 💎</Text>
                    <Text style={styles.onboardingText}>
                      See total value, rarity distribution, and organize by category. Tap any item for details and add personal notes!
                    </Text>
                  </>
                )}

                <View style={styles.onboardingDots}>
                  {[0, 1, 2, 3].map((dot) => (
                    <View
                      key={dot}
                      style={[styles.dot, dot === onboardingStep && styles.dotActive]}
                    />
                  ))}
                </View>

                <View style={styles.onboardingButtons}>
                  {onboardingStep > 0 && (
                    <TouchableOpacity
                      style={styles.onboardingButtonSecondary}
                      onPress={() => setOnboardingStep(onboardingStep - 1)}
                    >
                      <Text style={styles.onboardingButtonTextSecondary}>Back</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.onboardingButton}
                    onPress={() => {
                      if (onboardingStep < 3) {
                        setOnboardingStep(onboardingStep + 1);
                      } else {
                        setShowOnboarding(false);
                        // Show goat celebration
                        setGoatMood('Excited');
                        setGoatMessage('Your jewelry box awaits, treasure hunter! 🎁✨');
                        setShowGoat(true);
                        setTimeout(() => setShowGoat(false), 4000);
                      }
                    }}
                  >
                    <Text style={styles.onboardingButtonText}>
                      {onboardingStep < 3 ? 'Next' : 'Start Collecting!'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedItem && (
        <Modal
          visible={showNotesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Text style={styles.notesTitle}>Add Notes</Text>
                <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: selectedItem.photo_url }}
                style={styles.notesImage}
                contentFit="cover"
              />

              <Text style={styles.notesItemName}>{selectedItem.name}</Text>

              <TextInput
                style={styles.notesInput}
                placeholder="Add your memories, story, or important details..."
                placeholderTextColor="#6A0DAD"
                value={itemNotes}
                onChangeText={setItemNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.saveNotesButton}
                onPress={async () => {
                  if (selectedItem) {
                    const success = await saveItemNotes(selectedItem.id, itemNotes);
                    if (success) {
                      setShowNotesModal(false);

                      // TEST: Show alert to confirm flow works
                      setTimeout(() => {
                        Alert.alert(
                          '🐐 Notes Saved!',
                          'Your story has been preserved! ✨',
                          [
                            {
                              text: 'Awesome!',
                              onPress: () => {
                                setGoatMood('Celebrate');
                                setGoatMessage('Great story! Your treasures deserve their tales. 📝');
                                setShowGoat(true);
                                setTimeout(() => setShowGoat(false), 4500);
                              }
                            }
                          ]
                        );
                      }, 300);
                    }
                  }
                }}
              >
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.saveNotesButtonText}>Save Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0118',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0118',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#C77DFF',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 16,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  helpButton: {
    padding: 4,
  },
  heroBox: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  heroGradient: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  sparkleContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  statsGradient: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#C77DFF',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#6A0DAD',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(106, 13, 173, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#6A0DAD',
    minWidth: 100,
  },
  categoryButtonActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#9B4DCA',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C77DFF',
    marginTop: 4,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  categoryCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  categoryCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C77DFF',
  },
  categoryCountTextActive: {
    color: '#fff',
  },
  itemsSection: {
    paddingHorizontal: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  itemCardGradient: {
    padding: 0,
  },
  itemImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#1a0033',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#C77DFF',
    marginTop: 16,
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A0DAD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Search & Controls Styles
  controlsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(106, 13, 173, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    padding: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(106, 13, 173, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    gap: 8,
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C77DFF',
  },
  sortMenu: {
    backgroundColor: '#1a0033',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d1b4e',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(106, 13, 173, 0.3)',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#C77DFF',
  },
  sortOptionTextActive: {
    color: '#FFD700',
    fontWeight: '600',
  },
  itemsList: {
    gap: 12,
  },
  // Achievement Styles
  achievementsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  achievementsScroll: {
    marginTop: 8,
  },
  achievementBadge: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  achievementGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  notesIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  onboardingCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  onboardingGradient: {
    padding: 40,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  onboardingText: {
    fontSize: 16,
    color: '#F0E6FF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  onboardingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFD700',
    width: 24,
  },
  onboardingButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  onboardingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  onboardingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A0033',
  },
  onboardingButtonSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  onboardingButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  notesCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1a0033',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  notesImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#2d1b4e',
  },
  notesItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: 'rgba(106, 13, 173, 0.2)',
    borderWidth: 1,
    borderColor: '#6A0DAD',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    minHeight: 150,
    marginBottom: 20,
  },
  saveNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6A0DAD',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveNotesButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

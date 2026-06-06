import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated,
  Pressable,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

const API_URL = API_BASE_URL;

// Quick access categories (top 9 most popular)
export const QUICK_CATEGORIES = [
  { id: '2', name: 'Rings', icon: '💍', keywords: ['ring', 'band', 'engagement', 'wedding'] },
  { id: '3', name: 'Necklaces', icon: '📿', keywords: ['necklace', 'chain', 'pendant'] },
  { id: '4', name: 'Gemstones', icon: '🔮', keywords: ['ruby', 'emerald', 'sapphire'] },
  { id: '5', name: 'Shapes', icon: '🌀', keywords: ['round', 'square', 'triangle'] },
  { id: '6', name: 'Metals', icon: '⚙️', keywords: ['platinum', 'gold', 'silver', 'titanium'] },
  { id: '7', name: 'Engagement', icon: '💘', keywords: ['wedding', 'eternity', 'band', 'solitaire'] },
  { id: '8', name: 'Statement', icon: '🌟', keywords: ['limited edition', 'custom'] },
  { id: '9', name: 'Diamond', icon: '💎', keywords: ['round', 'princess', 'cushion', 'heart'] },
  { id: '10',name: 'Sapphire', icon: '🔷', keywords: ['accessory', 'accessories', 'misc', 'other'] },
];

// For backward compatibility
export const CATEGORIES = QUICK_CATEGORIES;

interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string, categoryName: string) => void;
  required?: boolean;
  showSelectedBanner?: boolean;
}

export default function CategorySelector({
  selectedCategory,
  onSelectCategory,
  required = true,
  showSelectedBanner = true,
}: CategorySelectorProps) {
  const { theme, colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredQuickCategories, setFilteredQuickCategories] = useState(QUICK_CATEGORIES);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filteredAllCategories, setFilteredAllCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [slideAnim] = useState(new Animated.Value(600)); // Start off-screen at bottom
  const searchInputRef = useRef<TextInput>(null);

  // Load all categories from backend
  useEffect(() => {
    void loadAllCategories();
  }, []);

  // Animate modal slide in/out
  useEffect(() => {
    if (showModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // When modal closes, dismiss keyboard immediately
      Keyboard.dismiss();
      searchInputRef.current?.blur();

      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showModal]);

  const loadAllCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data: Category[] = await res.json();
        setAllCategories(data);
        setFilteredAllCategories(data);
      }
    } catch (err) {
      console.error('Failed to load all categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
  const raw = searchQuery.trim().toLowerCase();

  if (!raw) {
    setFilteredQuickCategories(QUICK_CATEGORIES);
    setFilteredAllCategories(allCategories);
    return;
  }

  // Normalize query (e.g., "ring", "rings", "ring " → "ring")
  const query = raw.replaceAll(/\s+/g, ' ');

  const looseMatch = (source: string, query: string) => {
  return source.replaceAll(/\s+/g, '').includes(query.replaceAll(/\s+/g, ''));
};




    const matchesQuick = QUICK_CATEGORIES.filter((cat) => {
    const nameMatch = cat.name.toLowerCase().includes(query);
    const keywordMatch = cat.keywords.some((k) =>
      k.toLowerCase().includes(query)
    );
    return nameMatch || keywordMatch;
  });

  const matchesAll = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(query)
  );

  setFilteredQuickCategories(matchesQuick);
  setFilteredAllCategories(matchesAll);

  // Optional: auto-select if there's a single, very strong match
  if (matchesQuick.length === 1 && matchesAll.length === 0) {
    onSelectCategory(matchesQuick[0].id, matchesQuick[0].name);
  }
}, [searchQuery, allCategories]);

  const handleSelectCategory = (categoryId: string | number, categoryName: string) => {
    // Immediately blur input and dismiss keyboard to prevent cursor from lingering
    searchInputRef.current?.blur();
    Keyboard.dismiss();

    // Update selection
    onSelectCategory(categoryId.toString(), categoryName);
    setSearchQuery('');
    setShowAllCategories(false);

    // Close modal after short delay to ensure keyboard is fully dismissed
    setTimeout(() => {
      setShowModal(false);
      // Double-check keyboard is dismissed after modal closes
      Keyboard.dismiss();
    }, 100);
  };

  const selectedCategoryData =
    QUICK_CATEGORIES.find((c) => c.id === selectedCategory) ||
    allCategories.find((c) => c.id.toString() === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Header with Required Indicator */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Select Category{required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {/* Search Input */}
      <TouchableOpacity
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC',
            borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0'
          }
        ]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={20} color={theme === 'dark' ? '#999' : '#666'} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search or select category"
          placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setShowModal(true)}
          editable={false}
        />
        <Ionicons name="chevron-down" size={20} color={theme === 'dark' ? '#999' : '#666'} />
      </TouchableOpacity>

      {/* Selected Category Banner */}
      {showSelectedBanner && selectedCategoryData && (
        <View style={[
          styles.selectedBanner,
          {
            backgroundColor: theme === 'dark' ? '#1A3D2E' : '#F0FFF4',
            borderColor: theme === 'dark' ? '#2D5A3F' : '#9AE6B4'
          }
        ]}>
          <Text style={styles.selectedIcon}>
            {'emoji' in selectedCategoryData ? selectedCategoryData.emoji : selectedCategoryData.icon}
          </Text>
          <Text style={[styles.selectedText, { color: theme === 'dark' ? '#7FD6A8' : '#22543D' }]}>
            Selected: <Text style={[styles.selectedName, { color: theme === 'dark' ? '#7FD6A8' : '#22543D' }]}>{selectedCategoryData.name}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => onSelectCategory('', '')}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#E53E3E" />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Select Chips (when not selected) */}
      {!selectedCategory && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          {CATEGORIES.slice(0, 5).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                {
                  backgroundColor: theme === 'dark' ? '#2C2C2E' : '#fff',
                  borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0'
                }
              ]}
              onPress={() => handleSelectCategory(cat.id, cat.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text style={[styles.chipText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />

          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
                backgroundColor: colors.background,
              },
            ]}
          >
            {/* Drag Indicator */}
            <View style={[styles.dragIndicator, { backgroundColor: theme === 'dark' ? '#3C3C3E' : '#CBD5E0' }]} />

            <View style={[styles.modalHeader, { borderBottomColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search in Modal */}
            <View style={[
              styles.modalSearchContainer,
              {
                backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC'
              }
            ]}>
              <Ionicons name="search" size={20} color={theme === 'dark' ? '#999' : '#666'} />
              <TextInput
                ref={searchInputRef}
                style={[styles.modalSearchInput, { color: colors.textPrimary }]}
                placeholder="Type to filter (e.g., 'ring', 'watch')"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme === 'dark' ? '#666' : '#999'} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category List */}
            <ScrollView style={styles.categoryList}>
              {/* Quick Categories Section */}
              {filteredQuickCategories.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F7FAFC' }]}>
                    <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#999' : '#718096' }]}>Quick Select</Text>
                  </View>
                  {filteredQuickCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        { borderBottomColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' },
                        selectedCategory === cat.id && { backgroundColor: theme === 'dark' ? '#2C2416' : '#F7F3FF' },
                      ]}
                      onPress={() => handleSelectCategory(cat.id, cat.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                        <Text style={[styles.categoryKeywords, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                          {cat.keywords.join(', ')}
                        </Text>
                      </View>
                      {selectedCategory === cat.id && (
                        <Ionicons name="checkmark-circle" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Browse All Categories - Collapsible */}
              {allCategories.length > 0 && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.collapsibleHeader,
                      {
                        backgroundColor: theme === 'dark' ? '#718096' : '#F7F3FF',
                        borderTopColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0'
                      }
                    ]}
                    onPress={() => setShowAllCategories(!showAllCategories)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.collapsibleHeaderContent}>
                      <Ionicons name="grid-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                      <Text style={[styles.collapsibleTitle, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
                        Browse All Categories ({allCategories.length})
                      </Text>
                    </View>
                    <Ionicons
                      name={showAllCategories ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
                    />
                  </TouchableOpacity>

                  {showAllCategories && (
                    <>
                      {loadingCategories ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                        </View>
                      ) : filteredAllCategories.length > 0 ? (
                        filteredAllCategories.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[
                              styles.categoryItem,
                              { borderBottomColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' },
                              selectedCategory === cat.id.toString() && { backgroundColor: theme === 'dark' ? '#2C2416' : '#F7F3FF' },
                            ]}
                            onPress={() => handleSelectCategory(cat.id, cat.name)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.categoryIcon}>{cat.emoji}</Text>
                            <View style={styles.categoryInfo}>
                              <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                            </View>
                            {selectedCategory === cat.id.toString() && (
                              <Ionicons name="checkmark-circle" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
                            )}
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.emptyState}>
                          <Ionicons name="search-outline" size={48} color={theme === 'dark' ? '#666' : '#ccc'} />
                          <Text style={[styles.emptyText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>No categories found</Text>
                          <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#A0AEC0' }]}>
                            Try a different search term
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Empty State - when nothing matches */}
              {filteredQuickCategories.length === 0 && filteredAllCategories.length === 0 && (
  <View style={styles.noResultsContainer}>
    <Text style={[styles.noResultsTitle, { color: colors.textPrimary }]}>No categories found</Text>
    <Text style={[styles.noResultsText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
      Try searching for &#34;ring&#34;, &#34;watch&#34;, &#34;necklace&#34;, or &#34;earrings&#34;.
    </Text>
  </View>
)}

            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#242c40',
  },
  required: {
    color: '#E53E3E',
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#242c40',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#9AE6B4',
    gap: 12,
  },
  selectedIcon: {
    fontSize: 24,
  },
  selectedText: {
    flex: 1,
    fontSize: 15,
    color: '#22543D',
  },
  selectedName: {
    fontWeight: '700',
    color: '#22543D',
  },
  clearButton: {
    padding: 4,
  },
  chipsContainer: {
    marginTop: 12,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    height: '95%', // Take up 95% of screen height
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#242c40',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  noResultsContainer: {
  padding: 20,
  alignItems: 'center',
},
noResultsTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1A202C',
  marginBottom: 4,
},
noResultsText: {
  fontSize: 14,
  color: '#718096',
  textAlign: 'center',
},

  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#242c40',
  },
  categoryList: {
    flex: 1,
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  categoryItemSelected: {
    backgroundColor: '#F7F3FF',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#242c40',
    marginBottom: 4,
  },
  categoryKeywords: {
    fontSize: 13,
    color: '#718096',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F7FAFC',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F7F3FF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  collapsibleHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});

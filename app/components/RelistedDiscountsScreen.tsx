import React, { useState, useRef } from "react";
import { Animated as RNAnimated, Text, View, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ListedItem } from "@/types/items";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { differenceInSeconds, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

interface Props {
  items: ListedItem[];
}

// Hierarchical filter structure
const FILTER_HIERARCHY = {
  Bracelets: {
    types: ['Link', 'Cuff', 'Designer', 'Chain', 'Bangle'],
    styles: {
      Link: ['Gucci', 'Oval', 'C-Link', 'Cuban', 'Figaro', 'Rope'],
      Cuff: ['Open', 'Closed', 'Hinged', 'Adjustable'],
      Designer: ['Cartier', 'Tiffany', 'Van Cleef', 'Bvlgari', 'Hermes'],
      Chain: ['Snake', 'Box', 'Cable', 'Wheat'],
      Bangle: ['Classic', 'Stacked', 'Engraved'],
    },
  },
  Rings: {
    types: ['Engagement', 'Wedding Band', 'Cocktail', 'Statement', 'Signet'],
    styles: {
      Engagement: ['Solitaire', 'Halo', 'Three-Stone', 'Pave', 'Vintage'],
      'Wedding Band': ['Plain', 'Pave', 'Eternity', 'Milgrain', 'Channel Set'],
      Cocktail: ['Gemstone', 'Vintage', 'Art Deco', 'Modern'],
      Statement: ['Bold', 'Geometric', 'Abstract', 'Nature-Inspired'],
      Signet: ['Classic', 'Modern', 'Engraved', 'Crest'],
    },
  },
  Necklaces: {
    types: ['Chain', 'Pendant', 'Choker', 'Statement', 'Layered'],
    styles: {
      Chain: ['Cuban', 'Figaro', 'Rope', 'Box', 'Snake', 'Cable'],
      Pendant: ['Solitaire', 'Heart', 'Cross', 'Initial', 'Gemstone'],
      Choker: ['Collar', 'Velvet', 'Metal', 'Pearl'],
      Statement: ['Bold', 'Bib', 'Multi-Strand', 'Vintage'],
      Layered: ['Double', 'Triple', 'Delicate', 'Mixed'],
    },
  },
  Earrings: {
    types: ['Studs', 'Hoops', 'Drop', 'Chandelier', 'Huggies'],
    styles: {
      Studs: ['Solitaire', 'Cluster', 'Geometric', 'Pearl'],
      Hoops: ['Classic', 'Huggie', 'Large', 'Textured', 'Gemstone'],
      Drop: ['Short', 'Long', 'Gemstone', 'Pearl'],
      Chandelier: ['Vintage', 'Modern', 'Crystal', 'Tiered'],
      Huggies: ['Plain', 'Pave', 'Textured'],
    },
  },
  Pendants: {
    types: ['Solitaire', 'Locket', 'Religious', 'Charm', 'Gemstone'],
    styles: {
      Solitaire: ['Diamond', 'Ruby', 'Sapphire', 'Emerald'],
      Locket: ['Heart', 'Oval', 'Round', 'Vintage'],
      Religious: ['Cross', 'Star of David', 'Hamsa', 'Buddha'],
      Charm: ['Initial', 'Symbol', 'Birthstone', 'Animal'],
      Gemstone: ['Bezel', 'Prong', 'Halo', 'Cluster'],
    },
  },
  Watches: {
    types: ['Luxury', 'Sport', 'Dress', 'Smartwatch', 'Vintage'],
    styles: {
      Luxury: ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier'],
      Sport: ['Diver', 'Chronograph', 'Pilot', 'Racing'],
      Dress: ['Classic', 'Skeleton', 'Ultra-thin', 'Complications'],
      Smartwatch: ['Apple', 'Samsung', 'Garmin', 'Fitbit'],
      Vintage: ['Art Deco', 'Mid-Century', 'Retro'],
    },
  },
};

const MATERIALS = ['Leather', 'Titanium', 'Silver', 'Gold', 'Platinum', 'Stainless Steel', 'Rose Gold'];
const GOLD_COLORS = ['Yellow', 'Rose', 'White'];
const KARAT_OPTIONS = ['10K', '14K', '18K', '20K', '22K', '24K'];

// Helper functions
  function isAuctionUrgent(auctionEndsAt: string, now: Date): boolean {
    const end = parseISO(auctionEndsAt);
    const diffSeconds = differenceInSeconds(end, now);
    return diffSeconds <= 3600; // urgent if less than 1 hour left
  }

  function formatTimeWithSeconds(auctionEndsAt: string, now: Date): string {
    const end = parseISO(auctionEndsAt);
    const diffSeconds = differenceInSeconds(end, now);

    if (diffSeconds <= 0) return "Ended";

    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    // Show days if 48+ hours remaining
    if (diffSeconds >= 172800) { // 48 hours in seconds
      return `${days}d ${hours}h`;
    }

    return `${hours}h ${minutes}m ${seconds}s`;
  }

export default function RelistedDiscountsScreen({ items }: Props) {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const headerOpacity = useRef(new RNAnimated.Value(0)).current;
  const headerScale = useRef(new RNAnimated.Value(1)).current;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('All');
  const [selectedGoldColor, setSelectedGoldColor] = useState<string>('All');
  const [selectedKarat, setSelectedKarat] = useState<string>('All');
  const [showEndingSoon, setShowEndingSoon] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);

  // Fade in header title and arrow animation
  React.useEffect(() => {
    setTimeout(() => {
      RNAnimated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000, // 2 seconds - slow and dramatic
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
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
    }, 500); // 500ms delay - let screen render fully first
  }, []);



  // Reset dependent filters when parent changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedType('All');
    setSelectedStyle('All');
    setSelectedMaterial('All');
    setSelectedGoldColor('All');
    setSelectedKarat('All');
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedStyle('All');
    setSelectedMaterial('All');
    setSelectedGoldColor('All');
    setSelectedKarat('All');
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    setSelectedMaterial('All');
    setSelectedGoldColor('All');
    setSelectedKarat('All');
  };

  const handleMaterialChange = (material: string) => {
    setSelectedMaterial(material);
    if (material !== 'Gold') {
      setSelectedGoldColor('All');
      setSelectedKarat('All');
    }
  };

  const handleGoldColorChange = (color: string) => {
    setSelectedGoldColor(color);
    setSelectedKarat('All');
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedType('All');
    setSelectedStyle('All');
    setSelectedMaterial('All');
    setSelectedGoldColor('All');
    setSelectedKarat('All');
    setShowEndingSoon(false);
    setShowActiveOnly(false);
  };

  // Apply filters to items
  const filteredItems = items.filter(item => {
    const now = new Date();
    const itemName = (item.name || '').toLowerCase();
    const itemDesc = (item.description || '').toLowerCase();
    const itemTags = (item.tags || '').toLowerCase();
    const searchText = `${itemName} ${itemDesc} ${itemTags}`;

    // Category filter
    if (selectedCategory !== 'All' && !searchText.includes(selectedCategory.toLowerCase())) {
      return false;
    }

    // Type filter
    if (selectedType !== 'All' && !searchText.includes(selectedType.toLowerCase())) {
      return false;
    }

    // Style filter
    if (selectedStyle !== 'All' && !searchText.includes(selectedStyle.toLowerCase())) {
      return false;
    }

    // Material filter
    if (selectedMaterial !== 'All' && !searchText.includes(selectedMaterial.toLowerCase())) {
      return false;
    }

    // Gold color filter
    if (selectedGoldColor !== 'All' && !searchText.includes(selectedGoldColor.toLowerCase())) {
      return false;
    }

    // Karat filter
    if (selectedKarat !== 'All' && !searchText.includes(selectedKarat.toLowerCase())) {
      return false;
    }

    // Ending soon filter
    if (showEndingSoon && item.auction_ends_at) {
      const urgent = isAuctionUrgent(item.auction_ends_at, now);
      if (!urgent) return false;
    }

    // Active only filter
    if (showActiveOnly && item.status !== 'active') {
      return false;
    }

    return true;
  });

  // Get available options based on current selections
  const availableTypes = selectedCategory !== 'All' && FILTER_HIERARCHY[selectedCategory as keyof typeof FILTER_HIERARCHY]
    ? FILTER_HIERARCHY[selectedCategory as keyof typeof FILTER_HIERARCHY].types
    : [];

  const availableStyles = selectedCategory !== 'All' && selectedType !== 'All' && FILTER_HIERARCHY[selectedCategory as keyof typeof FILTER_HIERARCHY]?.styles?.[selectedType as keyof typeof FILTER_HIERARCHY[keyof typeof FILTER_HIERARCHY]['styles']]
    ? FILTER_HIERARCHY[selectedCategory as keyof typeof FILTER_HIERARCHY].styles[selectedType as keyof typeof FILTER_HIERARCHY[keyof typeof FILTER_HIERARCHY]['styles']]
    : [];

  const hasActiveFilters = selectedCategory !== 'All' || selectedType !== 'All' || selectedStyle !== 'All' ||
    selectedMaterial !== 'All' || selectedGoldColor !== 'All' || selectedKarat !== 'All' ||
    showEndingSoon || showActiveOnly;

  if (!items || items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={[styles.headerTitleContainer, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>🔄 Relisted & Reduced</Text>
          <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>Your Second Chance at Great Deals</Text>
        </View>
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No relisted discounts available right now.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} />

      <RNAnimated.View style={[
        styles.headerTitleContainer,
        {
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
          backgroundColor: colors.background,
          borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0'
        }
      ]}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>🔄 Relisted & Reduced</Text>
            <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>Your Second Chance at Great Deals</Text>
          </View>
        </View>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
      >
      {/* Filter Section */}
      <View style={[styles.filtersSection, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#e5e5e5' }]}>
        {/* Results Count & Clear */}
        <View style={styles.filterHeader}>
          <Text style={[styles.resultsCount, { color: colors.textPrimary }]}>
            {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs Row 1: Main Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#FF6B6B' : '#FF6B6B' },
              activeFilterTab === 'category' && [styles.filterTabActive, { backgroundColor: '#FF6B6B' }]
            ]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'category' ? null : 'category')}
          >
            <Text style={[
              styles.filterTabText,
              { color: theme === 'dark' && activeFilterTab !== 'category' ? '#ECEDEE' : '#333' },
              activeFilterTab === 'category' && styles.filterTabTextActive
            ]}>
              Category {selectedCategory !== 'All' && '•'}
            </Text>
          </TouchableOpacity>

          {selectedCategory !== 'All' && availableTypes.length > 0 && (
            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' },
                activeFilterTab === 'type' && [styles.filterTabActive, { backgroundColor: '#FF6B6B' }]
              ]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'type' ? null : 'type')}
            >
              <Text style={[
                styles.filterTabText,
                { color: theme === 'dark' && activeFilterTab !== 'type' ? '#ECEDEE' : '#333' },
                activeFilterTab === 'type' && styles.filterTabTextActive
              ]}>
                Type {selectedType !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedType !== 'All' && availableStyles.length > 0 && (
            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' },
                activeFilterTab === 'style' && [styles.filterTabActive, { backgroundColor: '#FF6B6B' }]
              ]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'style' ? null : 'style')}
            >
              <Text style={[
                styles.filterTabText,
                { color: theme === 'dark' && activeFilterTab !== 'style' ? '#ECEDEE' : '#333' },
                activeFilterTab === 'style' && styles.filterTabTextActive
              ]}>
                Style {selectedStyle !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.filterTab,
              { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' },
              activeFilterTab === 'material' && [styles.filterTabActive, { backgroundColor: '#FF6B6B' }]
            ]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'material' ? null : 'material')}
          >
            <Text style={[
              styles.filterTabText,
              { color: theme === 'dark' && activeFilterTab !== 'material' ? '#ECEDEE' : '#333' },
              activeFilterTab === 'material' && styles.filterTabTextActive
            ]}>
              Material {selectedMaterial !== 'All' && '•'}
            </Text>
          </TouchableOpacity>

          {selectedMaterial === 'Gold' && (
            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' },
                activeFilterTab === 'goldColor' && [styles.filterTabActive, { backgroundColor: '#FF6B6B' }]
              ]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'goldColor' ? null : 'goldColor')}
            >
              <Text style={[
                styles.filterTabText,
                { color: theme === 'dark' && activeFilterTab !== 'goldColor' ? '#ECEDEE' : '#333' },
                activeFilterTab === 'goldColor' && styles.filterTabTextActive
              ]}>
                Gold Color {selectedGoldColor !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedGoldColor !== 'All' && (
            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' },
                activeFilterTab === 'karat' && [styles.filterTabActive, { backgroundColor: '#FF6B6B' }]
              ]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'karat' ? null : 'karat')}
            >
              <Text style={[
                styles.filterTabText,
                { color: theme === 'dark' && activeFilterTab !== 'karat' ? '#ECEDEE' : '#333' },
                activeFilterTab === 'karat' && styles.filterTabTextActive
              ]}>
                Karat {selectedKarat !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.filterTab,
              { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' },
              activeFilterTab === 'status' && [styles.filterTabActive, { backgroundColor: '#FF6B6B' }]
            ]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'status' ? null : 'status')}
          >
            <Text style={[
              styles.filterTabText,
              { color: theme === 'dark' && activeFilterTab !== 'status' ? '#ECEDEE' : '#333' },
              activeFilterTab === 'status' && styles.filterTabTextActive
            ]}>
              Status {(showEndingSoon || showActiveOnly) && '•'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Expanded Filter Options */}
        {activeFilterTab === 'category' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', ...Object.keys(FILTER_HIERARCHY)].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterPill,
                  { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                  selectedCategory === category && [styles.filterPillActive, { backgroundColor: '#FF6B6B' }]
                ]}
                onPress={() => { handleCategoryChange(category); setActiveFilterTab(null); }}
              >
                <Text style={[
                  styles.filterPillText,
                  { color: theme === 'dark' && selectedCategory !== category ? '#ECEDEE' : '#666' },
                  selectedCategory === category && styles.filterPillTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'type' && availableTypes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', ...availableTypes].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterPill, selectedType === type && styles.filterPillActive]}
                onPress={() => { handleTypeChange(type); setActiveFilterTab(null); }}
              >
                <Text style={[styles.filterPillText, selectedType === type && styles.filterPillTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'style' && availableStyles.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', ...availableStyles].map((style) => (
              <TouchableOpacity
                key={style}
                style={[styles.filterPill, selectedStyle === style && styles.filterPillActive]}
                onPress={() => { handleStyleChange(style); setActiveFilterTab(null); }}
              >
                <Text style={[styles.filterPillText, selectedStyle === style && styles.filterPillTextActive]}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'material' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', ...MATERIALS].map((material) => (
              <TouchableOpacity
                key={material}
                style={[styles.filterPill, selectedMaterial === material && styles.filterPillActive]}
                onPress={() => { handleMaterialChange(material); setActiveFilterTab(null); }}
              >
                <Text style={[styles.filterPillText, selectedMaterial === material && styles.filterPillTextActive]}>
                  {material}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'goldColor' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', ...GOLD_COLORS].map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.filterPill, selectedGoldColor === color && styles.filterPillActive]}
                onPress={() => { handleGoldColorChange(color); setActiveFilterTab(null); }}
              >
                <Text style={[styles.filterPillText, selectedGoldColor === color && styles.filterPillTextActive]}>
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'karat' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            {['All', ...KARAT_OPTIONS].map((karat) => (
              <TouchableOpacity
                key={karat}
                style={[styles.filterPill, selectedKarat === karat && styles.filterPillActive]}
                onPress={() => { setSelectedKarat(karat); setActiveFilterTab(null); }}
              >
                <Text style={[styles.filterPillText, selectedKarat === karat && styles.filterPillTextActive]}>
                  {karat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeFilterTab === 'status' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
            <TouchableOpacity
              style={[styles.filterPill, showEndingSoon && styles.filterPillActive]}
              onPress={() => { setShowEndingSoon(!showEndingSoon); setActiveFilterTab(null); }}
            >
              <Text style={[styles.filterPillText, showEndingSoon && styles.filterPillTextActive]}>
                ⏰ Ending Soon
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, showActiveOnly && styles.filterPillActive]}
              onPress={() => { setShowActiveOnly(!showActiveOnly); setActiveFilterTab(null); }}
            >
              <Text style={[styles.filterPillText, showActiveOnly && styles.filterPillTextActive]}>
                ✅ Active Only
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Items List */}
      {filteredItems.map(item => {
        const now = new Date();
        const urgent = item.auction_ends_at ? isAuctionUrgent(item.auction_ends_at, now) : false;

        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}
            onPress={() => router.push(`/item/${item.id}`)}
          >
            <Image source={{ uri: item.photo_url }} style={styles.image} />

            {/* Discount ribbon */}
            {item.discount_pct && (
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText}>{item.discount_pct}% OFF</Text>
              </View>
            )}

            {/* Relist badge */}
            {item.relist_count && item.relist_count > 0 && (
              <Text style={[styles.relistBadge, { color: theme === 'dark' ? '#999' : '#555' }]}>
                🔄 Relisted {item.relist_count} times (last: {item.relisted_at})
              </Text>
            )}

            {/* Status badge - Show actual auction status */}
            {(() => {
              const hasEnded = item.auction_ends_at && new Date(item.auction_ends_at) < now;
              const hasBids = item.highest_bid && item.highest_bid > 0;

              if (hasEnded && hasBids) {
                return <Text style={[styles.statusBadge, styles.soldBadge]}>✅ SOLD</Text>;
              } else if (hasEnded) {
                return <Text style={[styles.statusBadge, styles.endedBadge]}>⏸️ ENDED</Text>;
              } else {
                return <Text style={[styles.statusBadge, styles.activeBadge]}>🟢 ACTIVE</Text>;
              }
            })()}

            {/* Item name */}
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>

            {/* Price row - Show correct pricing based on auction status */}
            {(() => {
              const hasEnded = item.auction_ends_at && new Date(item.auction_ends_at) < now;
              const hasBids = item.highest_bid && item.highest_bid > 0;

              if (hasEnded && hasBids) {
                // SOLD: Show final bid price
                return (
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, styles.soldPrice]}>
  Final: ${(item.highest_bid ?? 0).toLocaleString()}
</Text>

{item.original_price &&
 item.highest_bid !== undefined &&
 item.original_price > item.highest_bid && (
  <Text style={styles.originalPrice}>
    Was ${item.original_price.toLocaleString()}
  </Text>
)}

                  </View>
                );
              } else if (hasEnded) {
                // ENDED, no bids: Show starting price
                return (
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
                      ${item.price.toLocaleString()}
                    </Text>
                    <Text style={[styles.noBidsText, { color: theme === 'dark' ? '#999' : '#999' }]}>(No bids)</Text>
                  </View>
                );
              } else {
                // ACTIVE: Show current bid or starting price
                return (
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
                      ${(item.highest_bid || item.price).toLocaleString()}
                    </Text>
                    {item.highest_bid && item.highest_bid > item.price && (
                      <Text style={[styles.bidIndicator, { color: theme === 'dark' ? '#999' : '#666' }]}>({item.bid_count || 0} bids)</Text>
                    )}
                  </View>
                );
              }
            })()}

            {/* Ends at row */}
            <View style={styles.endsRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={urgent ? "#c62828" : "#2e7d32"}
                style={{ marginHorizontal: 4 }}
              />
              <Text style={[styles.statsText, urgent ? styles.urgentText : styles.timeText]}>
                {item.auction_ends_at
                  ? formatTimeWithSeconds(item.auction_ends_at, now)
                  : "Not auctioned"}
              </Text>
            </View>

            {/* Auction countdown */}
            {item.auction_ends_at && (
              <Text style={[styles.countdown, { color: theme === 'dark' ? '#999' : '#444' }]}>
                Ends at: {new Date(item.auction_ends_at).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

          {filteredItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No items match your filters. Try adjusting them!</Text>
            </View>
          )}
      </RNAnimated.ScrollView>
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 200,
    paddingBottom: 20,
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 50,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 999,
    elevation: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#F7FAFC',
  },
  pageBackButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  filtersSection: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  filterTabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  filterTabActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  filterOptionsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterPillActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  card: {
    marginBottom: 20,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  image: { width: "100%", height: 200, borderRadius: 8 },
  ribbon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#E53935",
    padding: 4,
    borderRadius: 4,
  },
  endsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statsText: {
    fontSize: 12,
  },
  timeText: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  urgentText: {
    color: "#c62828",
    fontWeight: "700",
  },
  ribbonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  relistBadge: { marginTop: 8, fontSize: 12 },
  statusBadge: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    color: "#2E7D32",
  },
  endedBadge: {
    backgroundColor: "rgba(255, 152, 0, 0.15)",
    color: "#E65100",
  },
  soldBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    color: "#2E7D32",
  },
  itemName: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 6 },
  price: { fontSize: 18, fontWeight: "bold" },
  soldPrice: {
    color: "#2E7D32",
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    color: "#999",
  },
  noBidsText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  bidIndicator: {
    fontSize: 13,
  },
  countdown: { marginTop: 6, fontSize: 12 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: { fontSize: 16, textAlign: "center" },
});

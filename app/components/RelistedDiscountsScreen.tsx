import React, { useState, useRef } from "react";
import { Animated as RNAnimated, Text, View, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ListedItem } from "@/types/items";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { differenceInSeconds, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";

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
  const router = useRouter();
  const scrollY = useRef(new RNAnimated.Value(0)).current;

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
      <View style={{ flex: 1 }}>
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.heroTitle}>🔄 Relisted & Reduced</Text>
          <Text style={styles.headerSubtitle}>Your Second Chance at Great Deals</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No relisted discounts available right now.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={styles.heroTitle}>🔄 Relisted & Reduced</Text>
            <Text style={styles.headerSubtitle}>Your Second Chance at Great Deals</Text>
          </View>
        </View>
      </View>

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
      <View style={styles.filtersSection}>
        {/* Results Count & Clear */}
        <View style={styles.filterHeader}>
          <Text style={styles.resultsCount}>
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
            style={[styles.filterTab, activeFilterTab === 'category' && styles.filterTabActive]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'category' ? null : 'category')}
          >
            <Text style={[styles.filterTabText, activeFilterTab === 'category' && styles.filterTabTextActive]}>
              Category {selectedCategory !== 'All' && '•'}
            </Text>
          </TouchableOpacity>

          {selectedCategory !== 'All' && availableTypes.length > 0 && (
            <TouchableOpacity
              style={[styles.filterTab, activeFilterTab === 'type' && styles.filterTabActive]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'type' ? null : 'type')}
            >
              <Text style={[styles.filterTabText, activeFilterTab === 'type' && styles.filterTabTextActive]}>
                Type {selectedType !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedType !== 'All' && availableStyles.length > 0 && (
            <TouchableOpacity
              style={[styles.filterTab, activeFilterTab === 'style' && styles.filterTabActive]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'style' ? null : 'style')}
            >
              <Text style={[styles.filterTabText, activeFilterTab === 'style' && styles.filterTabTextActive]}>
                Style {selectedStyle !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.filterTab, activeFilterTab === 'material' && styles.filterTabActive]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'material' ? null : 'material')}
          >
            <Text style={[styles.filterTabText, activeFilterTab === 'material' && styles.filterTabTextActive]}>
              Material {selectedMaterial !== 'All' && '•'}
            </Text>
          </TouchableOpacity>

          {selectedMaterial === 'Gold' && (
            <TouchableOpacity
              style={[styles.filterTab, activeFilterTab === 'goldColor' && styles.filterTabActive]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'goldColor' ? null : 'goldColor')}
            >
              <Text style={[styles.filterTabText, activeFilterTab === 'goldColor' && styles.filterTabTextActive]}>
                Gold Color {selectedGoldColor !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedGoldColor !== 'All' && (
            <TouchableOpacity
              style={[styles.filterTab, activeFilterTab === 'karat' && styles.filterTabActive]}
              onPress={() => setActiveFilterTab(activeFilterTab === 'karat' ? null : 'karat')}
            >
              <Text style={[styles.filterTabText, activeFilterTab === 'karat' && styles.filterTabTextActive]}>
                Karat {selectedKarat !== 'All' && '•'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.filterTab, activeFilterTab === 'status' && styles.filterTabActive]}
            onPress={() => setActiveFilterTab(activeFilterTab === 'status' ? null : 'status')}
          >
            <Text style={[styles.filterTabText, activeFilterTab === 'status' && styles.filterTabTextActive]}>
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
                style={[styles.filterPill, selectedCategory === category && styles.filterPillActive]}
                onPress={() => { handleCategoryChange(category); setActiveFilterTab(null); }}
              >
                <Text style={[styles.filterPillText, selectedCategory === category && styles.filterPillTextActive]}>
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
            style={styles.card}
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
              <Text style={styles.relistBadge}>
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
            <Text style={styles.itemName}>{item.name}</Text>

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
                    <Text style={styles.price}>
                      ${item.price.toLocaleString()}
                    </Text>
                    <Text style={styles.noBidsText}>(No bids)</Text>
                  </View>
                );
              } else {
                // ACTIVE: Show current bid or starting price
                return (
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      ${(item.highest_bid || item.price).toLocaleString()}
                    </Text>
                    {item.highest_bid && item.highest_bid > item.price && (
                      <Text style={styles.bidIndicator}>({item.bid_count || 0} bids)</Text>
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
              <Text style={styles.countdown}>
                Ends at: {new Date(item.auction_ends_at).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

          {filteredItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items match your filters. Try adjusting them!</Text>
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
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
    color: '#333',
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
    backgroundColor: '#F5F5F5',
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
    color: '#333',
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
    backgroundColor: '#FFF',
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
    color: '#666',
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  card: {
    marginBottom: 20,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
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
  relistBadge: { marginTop: 8, fontSize: 12, color: "#555" },
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
  price: { fontSize: 18, fontWeight: "bold", color: "#6A0DAD" },
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
    color: "#999",
    fontStyle: "italic",
  },
  bidIndicator: {
    fontSize: 13,
    color: "#666",
  },
  countdown: { marginTop: 6, fontSize: 12, color: "#444" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: { fontSize: 16, color: "#777", textAlign: "center" },
});

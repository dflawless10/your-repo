import React, {useEffect, useMemo, useState} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Animated,
  TouchableOpacity,
  Text,
  Pressable,
  Platform,
  Modal,
  Alert,
  FlatList,
  ScrollView,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {Link, useRouter} from 'expo-router';
import { Avatar } from 'app/components/Avatar'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCartBackend } from 'hooks/usecartBackend';

interface HeaderProps {
  scrollY: Animated.Value;
  username?: string | null;
  avatarUrl?: string | null;
  onSearch?: (text: string) => void;
  embedded?: boolean;
  onSelect?: (result: any) => void; // <-- add this
}

// Define a result type
interface SearchResult {
  label: string;
  value: string | number;
  type: 'user' | 'item' | string;   // ❌ problem here
  extra?: {
    price?: number;
    image?: string;
    description?: string;
  };
  score: number;
}


// Then declare allResults with that type
let allResults: SearchResult[] = [];


interface SearchBarProps {
  onSelect?: (result: any) => void;
}


type Birthstone = {
  month: string;
  stone: string;
  color: string;
  meaning: string;
};

type CategoryItem = {
  label: string;
  key: string;
};

type CategoryGroup = {
  label: string;
  items: CategoryItem[];
};

const categories: CategoryGroup[] = [
  {
    label: 'Account',
    items: [
      { label: 'Sign In', key: 'sign-in' },
      { label: 'Register', key: 'register' },
    ],
  },
  {
    label: 'Getting Started',
    items: [
      { label: 'Welcome', key: 'welcome' },
      { label: 'Help', key: 'help' },
      { label: 'Contact', key: 'contact' },
    ],
  },
  {
    label: 'Jewelry Categories',
    items: [
      { label: 'Rings', key: 'rings' },
      { label: 'Necklaces', key: 'necklaces' },
      { label: 'Bracelets', key: 'bracelets' },
      { label: 'Earrings', key: 'earrings' },
      { label: 'Watches', key: 'watches' },
      { label: 'Brooches', key: 'brooches' },
      { label: 'Pendants', key: 'pendants' },
      { label: 'Anklets', key: 'anklets' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Shop', key: 'shop' },
      { label: 'Sell', key: 'sell' },
    ],
  },
  {
    label: 'Goat Certified',
    items: [
      { label: "Watch Appraisal", key: 'watch-appraisal' },
      { label: "Diamond Appraisal", key: 'diamond-appraisal' },
      { label: 'Trending', key: 'trending' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Reviews', key: 'reviews' },
      { label: 'Rewards', key: 'rewards' },
    ],
  },
];

export const HEADER_MAX_HEIGHT = 110;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const showAlert = true; // or derive from props, state, or context
const birthstones: Birthstone[] = [
  { month: 'January', stone: 'Garnet', color: '#8B0000', meaning: 'Deep red warmth, like a goat’s heartbeat in winter' },
  { month: 'February', stone: 'Amethyst', color: '#800080', meaning: 'Mystical purple, perfect for twilight bidding' },
  { month: 'March', stone: 'Aquamarine', color: '#7FFFD4', meaning: 'Ocean breeze meets barnyard calm' },
  { month: 'April', stone: 'Quartz', color: '#E0E0E0', meaning: 'Clean and crisp, like a fresh modal invocation' },
  { month: 'May', stone: 'Emerald', color: '#50C878', meaning: 'Lush green, like springtime goat whispers' },
  { month: 'June', stone: 'Pearl', color: '#dcdcdc', meaning: 'Soft shimmer, now visible against white tiles' },
  { month: 'July', stone: 'Ruby', color: '#E0115F', meaning: 'Bold and celebratory, like a winning bid' },
  { month: 'August', stone: 'Peridot', color: '#B4EEB4', meaning: 'Playful green with a hint of summer mischief' },
  { month: 'September', stone: 'Sapphire', color: '#0F52BA', meaning: 'Royal blue for confident contributors' },
  { month: 'October', stone: 'Opal', color: '#FFB6C1', meaning: 'Pastel magic with unpredictable sparkle trails' },
  { month: 'November', stone: 'Topaz', color: '#FFC87C', meaning: 'Golden warmth for cozy barnyard rituals' },
  { month: 'December', stone: 'Turquoise', color: '#40E0D0', meaning: 'Frosty teal for wintertime lore' },
];

const EnhancedHeader: React.FC<HeaderProps> = ({
  scrollY,
  username: usernameProp = null,
  avatarUrl = null,
  onSearch,
   onSelect,
                                               }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBirthstoneModal, setShowBirthstoneModal] = useState(false);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [avatar, setAvatar] = useState<string>('https://i.pravatar.cc/80');
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [username, setUsername] = useState<string | null>(usernameProp);
  const [sellingExpanded, setSellingExpanded] = useState(false);
  const [buyingExpanded, setBuyingExpanded] = useState(false);




  const baseY = useMemo(() => scrollY ?? new Animated.Value(0), [scrollY]);
  // Fixed header height - no animation to prevent banding
  const headerHeight = HEADER_MAX_HEIGHT;
  const opacity = baseY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: [1, 1], extrapolate: 'clamp'
  });


  const handleGiftNavigation = (occasion: string) => {
    if (occasion === 'birthday') {
      setShowGiftModal(false);
      setShowBirthstoneModal(true);
    } else {
      router.push(`/gift-finder/${occasion}`);
      setShowGiftModal(false);
    }
  };

  const handleBirthstonePress = (month: string, stone: string, meaning: string) => {
    Alert.alert(`💎 ${stone} Radiance`, `The Goat Oracle says: ${meaning} shines brightest in ${month}!`);
  };

  // Search function using your Elasticsearch backend
  const performElasticsearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');

      // Use your existing /api/search endpoint
      const response = await fetch('http://10.0.0.170:5000/api/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
  query: query,
  category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
})

      });

      if (response.ok) {
  const data = await response.json();

  // Format results from your backend
  let allResults: SearchResult[] = [];

  // Handle Elasticsearch hits
  if (data.hits && Array.isArray(data.hits)) {
    const itemResults: SearchResult[] = data.hits.map((hit: any) => ({
      label: hit.name || hit.title || hit.username || 'Unknown',
      value: hit.item_id || hit.id,
      type: hit.username ? 'user' : 'item',
      extra: {
        price: hit.price,
        image: hit.photo_url,
        description: hit.description,
      },
      score: 1,
    }));
    allResults = [...allResults, ...itemResults];
  }

  // Handle help content matches
  if (data.help && Array.isArray(data.help)) {
    const helpResults: SearchResult[] = data.help.map((help: any) => ({
      label: help.label,
      value: help.value,
      type: help.type,
      extra: {
        description: help.extra?.description,
      },
      score: 0.5,
    }));
    allResults = [...allResults, ...helpResults];
  }

  setResults(allResults);
} else {
  console.warn('Search failed:', response.status);
  setResults([]);
}

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim()) {
        performElasticsearch(searchText);
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchText]);

  // Check AsyncStorage for username and avatar on mount and when menu opens
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const token = await AsyncStorage.getItem('jwtToken');
        const storedAvatar = await AsyncStorage.getItem('avatar_url');

        if (storedUsername && token) {
          setUsername(storedUsername);

          // Set user's actual avatar if available
          if (storedAvatar && storedAvatar.startsWith('http')) {
            setAvatar(storedAvatar);
          }

          // Check if token is expired
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const expiry = payload.exp * 1000; // Convert to milliseconds
              const now = Date.now();

              if (expiry < now) {
                console.log('🐐 Token expired, showing modal');
                setShowTokenExpiredModal(true);
              }
            }
          } catch (e) {
            console.warn('🐐 Could not parse token expiry:', e);
          }
        } else {
          setUsername(null);
          setAvatar('https://i.pravatar.cc/80'); // Reset to default for guests
        }
      } catch (error) {
        console.error('🐐 Error checking auth:', error);
        setUsername(null);
        setAvatar('https://i.pravatar.cc/80');
      }
    };

    checkAuth();

    // Re-check when menu opens (to catch sign-ins that happened)
    if (showMenu) {
      checkAuth();
    }
  }, [showMenu]);

  useEffect(() => {
  const listener = scrollY.addListener(({ value }) => {
    console.log('🐐 scrollY:', value);
  });
  return () => scrollY.removeListener(listener);
}, []);

  // Use avatar from state (which loads from AsyncStorage) or prop, fallback to default
  const img = avatarUrl?.startsWith('http')
    ? avatarUrl
    : avatar.startsWith('http')
    ? avatar
    : 'https://i.pravatar.cc/80';

  const { cartItems } = useCartBackend();

 return (
  <Animated.View
    style={[
      styles.container,
      {
        paddingTop: Platform.OS === 'web' ? 30 : insets.top,
        opacity,
        width: '100%',
        ...(showAlert ? {
          backgroundColor: '#fff',
        } : {}),
      },
    ]}
  >
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      {/* Icons Row - Above Search */}
      <View style={styles.iconsRow}>
        {/* Cart Icon with Badge */}
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconButton}>
          <View style={styles.cartContainer}>
            <Image source={require('app/components/assets/goat-cart.png')} style={styles.cartIcon} />
            {cartItems.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItems.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Profile Icon */}
        <TouchableOpacity 
          onPress={() => {
            if (username) {
              router.push('/(tabs)/profile');
            } else {
              router.push('/sign-in');
            }
          }} 
          style={styles.iconButton}
        >
          <Ionicons 
            name={username ? "person" : "person-outline"} 
            size={28} 
            color={username ? "#6A0DAD" : "#444"} 
          />
        </TouchableOpacity>

        {/* Menu Icon */}
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.iconButton}>
          <Ionicons name="menu" size={28} color="#444" />
        </TouchableOpacity>
      </View>

      {/* eBay-Style Search Row - Full Width */}
      <View style={styles.searchRow}>
        <View style={styles.ebaySearchContainer}>
          {/* Category Dropdown */}
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.categoryText} numberOfLines={1}>
              {selectedCategory}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.searchDivider} />

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for anything..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => {
                if (searchText.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchText.trim())}&category=${selectedCategory}`);
                }
              }}
              returnKeyType="search"
            />
            {searchText.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => { setSearchText(''); setResults([]); }}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Button - eBay Blue */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (searchText.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchText.trim())}&category=${selectedCategory}`);
              }
            }}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

  {/* Dropdown results */}
  {results.length > 0 && (
    <View style={styles.dropdown}>
      <View style={styles.dropdownHeader}>
        <Text style={styles.dropdownTitle}>Search Results ({results.length})</Text>
        <TouchableOpacity onPress={() => setResults([])}>
          <Text style={styles.dropdownClose}>✕</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.value.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => {
              if (item.type === 'item') {
                router.push(`/item/${item.value}`);
              } else if (item.type === 'user') {
                router.push(`/seller/${item.value}`);
              }
              setSearchText('');
              setResults([]);
              onSelect?.(item);
            }}
          >
            {item.extra?.image && (
              <Image source={{ uri: item.extra.image }} style={styles.resultImage} />
            )}
            <View style={styles.resultContent}>
              <Text style={styles.resultLabel} numberOfLines={1}>{item.label || 'Unknown'}</Text>

              {item.type === 'item' && item.extra?.price != null && (
                <Text style={styles.resultPrice}>${item.extra.price}</Text>
              )}

              {item.extra?.description && (
                <Text style={styles.resultMeta} numberOfLines={1}>{item.extra.description}</Text>
              )}

              {item.score != null && (
                <Text style={styles.resultScore}>Relevance: {(item.score * 10).toFixed(0)}%</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyResults}>
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
      />
    </View>
  )}

    </Animated.View>

    {/* Main Menu Modal */}
    <Modal visible={showMenu} transparent animationType="slide" onRequestClose={() => setShowMenu(false)}>
  <View style={styles.modalOverlay}>
    <Pressable style={styles.modalBackdrop} onPress={() => setShowMenu(false)} />
    <View style={styles.modalContent}>
      <ScrollView contentContainerStyle={styles.modalScroll} bounces={false}>
        {/* User Profile Section */}
        <View style={styles.menuProfileSection}>
          <TouchableOpacity
            onPress={() => {
              router.push('/(tabs)/profile');
              setShowMenu(false);
            }}
            style={styles.menuProfileButton}
          >
            <Avatar uri={`${img}${img.includes('?') ? '&' : '?'}v=${Date.now()}`} />
            <View style={styles.menuProfileInfo}>
              <Text style={styles.menuProfileName}>{username || 'Guest'}</Text>
              <Text style={styles.menuProfileLink}>View Profile →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <Text style={[styles.modalHeader, { fontSize: 20, marginBottom: 20, marginTop: 16 }]}>🐐 BidGoat Menu</Text>

        {/* Shop Section */}
        <Text style={styles.sectionHeader}>Shop</Text>
        {/* New Sub‑Category: Relisted Discounts */}
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/relisted-discounts'); setShowMenu(false); }}>
          <Ionicons name="pricetag" size={20} color="#FF6B35" />
          <Link href="/relisted-discounts" style={styles.modalItem}>
          <Text style={styles.modalText}>Relisted Item Discounts</Text>
          </Link>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/discover'); setShowMenu(false); }}>
          <Ionicons name="search" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Discover Items</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/wishlist'); setShowMenu(false); }}>
          <Ionicons name="heart" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/cart'); setShowMenu(false); }}>
          <Ionicons name="cart" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Shopping Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { setShowGiftModal(true); setShowMenu(false); }}>
          <Ionicons name="gift" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Gift Finder</Text>
        </TouchableOpacity>

        {/* Buying Section */}
        <Text style={styles.sectionHeader}>Buying</Text>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/orders'); setShowMenu(false); }}>
          <Ionicons name="receipt" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/(tabs)/MyBidsScreen'); setShowMenu(false); }}>
          <Ionicons name="time" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>My Bids</Text>
        </TouchableOpacity>

        {/* Selling Section */}
        <Text style={styles.sectionHeader}>Selling</Text>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/seller/dashboard'); setShowMenu(false); }}>
          <Ionicons name="analytics" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Seller Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/seller/orders'); setShowMenu(false); }}>
          <Ionicons name="cube" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Orders to Ship</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/seller/revenue'); setShowMenu(false); }}>
          <Ionicons name="cash" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Revenue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/CreateAuctionScreen'); setShowMenu(false); }}>
          <Ionicons name="hammer" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Create Auction</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/(tabs)/list-item'); setShowMenu(false); }}>
          <Ionicons name="pricetag" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Buy It Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/MustSellScreen'); setShowMenu(false); }}>
          <Ionicons name="flash" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Must Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/watch-appraisal'); setShowMenu(false); }}>
          <Ionicons name="watch" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>List My Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/diamond-appraisal'); setShowMenu(false); }}>
          <Ionicons name="diamond" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>List My Diamond</Text>
        </TouchableOpacity>

        {/* Account Section */}
        <Text style={styles.sectionHeader}>Account</Text>
        {username ? (
          <>
            <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/(tabs)/profile'); setShowMenu(false); }}>
              <Ionicons name="person" size={20} color="#FF6B35" />
              <Text style={styles.modalText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/jewelry-box'); setShowMenu(false); }}>
              <Ionicons name="diamond" size={20} color="#FF6B35" />
              <Text style={styles.modalText}>My Jewelry Box</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={async () => {
                await AsyncStorage.multiRemove(['username', 'jwtToken', 'avatar_url']);
                setShowMenu(false);
                router.push('/sign-in');
              }}
            >
              <Ionicons name="log-out" size={20} color="#FF6B35" />
              <Text style={styles.modalText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/sign-in'); setShowMenu(false); }}>
              <Ionicons name="log-in" size={20} color="#FF6B35" />
              <Text style={styles.modalText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/register'); setShowMenu(false); }}>
              <Ionicons name="person-add" size={20} color="#FF6B35" />
              <Text style={styles.modalText}>Register</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Help Section */}
        <Text style={styles.sectionHeader}>Help & Info</Text>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/about'); setShowMenu(false); }}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>About BidGoat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalItem} onPress={() => { router.push('/help'); setShowMenu(false); }}>
          <Ionicons name="help-circle" size={20} color="#FF6B35" />
          <Text style={styles.modalText}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowMenu(false)} style={{ marginTop: 20 }}>
          <Text style={styles.closeText}>Close Menu</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
</Modal>

    {/* Gift Discovery Modal */}
    <Modal visible={showGiftModal} transparent animationType="fade" onRequestClose={() => setShowGiftModal(false)}>
  <Pressable style={styles.modalOverlay} onPress={() => setShowGiftModal(false)}>
    <View style={styles.modalContent} pointerEvents="box-none">
      <Text style={styles.modalHeader}>🎁 Discover Gift Ideas</Text>
      {['birthday', 'anniversary', 'halloween', 'wedding', 'thank-you', 'just-because'].map((occasion) => (
        <TouchableOpacity
          key={occasion}
          style={styles.modalItem}
          onPress={() => handleGiftNavigation(occasion)}
        >
          <Text style={styles.modalText}>🎀 {occasion.replace('-', ' ')} Gifts</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => setShowGiftModal(false)}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  </Pressable>

</Modal>


    {/* Category Selection Modal - eBay Style */}
    <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCategoryModal(false)} />
        <View style={styles.categoryModalContent}>
          <View style={styles.categoryModalHeaderRow}>
            <Text style={styles.modalHeader}>Add To My Jewelry Box</Text>
            {username ? (
              <Text style={styles.signInText}>✅ {username}</Text>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryModal(false);
                  router.push('/sign-in');
                }}
                style={styles.signInButton}
              >
                <Ionicons name="person-circle-outline" size={18} color="#6A0DAD" />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView>
            {[
              'All Categories',
              '⌚ Bracelets & Watches',
              '🎀 Brooches',
              '👂 Earrings',
              '💎 Loose Gems',
              '📿 Necklaces',
              '💍 Rings',
              '👑 Tiaras & Hair',
              '✨ Vintage'
            ].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategory === category && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryModal(false);
                  // Navigate to category screen if not "All Categories"
                  if (category !== 'All Categories') {
                    router.push(`/category/${encodeURIComponent(category)}`);
                  }
                }}
              >
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategory === category && styles.categoryOptionTextSelected
                ]}>
                  {category}
                </Text>
                {selectedCategory === category && (
                  <Ionicons name="checkmark" size={20} color="#6A0DAD" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.categoryCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={styles.categoryCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Birthstone Modal */}
    <Modal visible={showBirthstoneModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: 8 }]}>
          <Text style={styles.modalHeader}>💎 Birthday Sparkle Ritual</Text>
          <FlatList
            data={birthstones}
            numColumns={3}
            keyExtractor={(item: Birthstone) => item.month}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }: { item: Birthstone }) => {
              const textColor = item.color === '#dcdcdc' ? '#333' : '#fff';
              return (
                <TouchableOpacity
                  style={[styles.tile, { backgroundColor: item.color }]}
                  onPress={() =>
                    handleBirthstonePress(item.month, item.stone, item.meaning)
                  }
                >
                  <Text style={[styles.month, { color: textColor }]}>{item.month}</Text>
                  <Text style={[styles.stone, { color: textColor }]}>{item.stone}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity onPress={() => setShowBirthstoneModal(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Token Expired Modal */}
    <Modal visible={showTokenExpiredModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '80%' }]}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="time-outline" size={48} color="#FF6B35" />
          </View>
          <Text style={[styles.modalHeader, { fontSize: 18, marginBottom: 8 }]}>Session Expired</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 }}>
            Your session has expired. Please sign in again to continue.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6B35',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 12,
            }}
            onPress={async () => {
              await AsyncStorage.multiRemove(['username', 'jwtToken', 'avatar_url']);
              setShowTokenExpiredModal(false);
              setUsername(null);
              router.push('/sign-in');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 12,
              alignItems: 'center',
            }}
            onPress={() => setShowTokenExpiredModal(false)}
          >
            <Text style={{ color: '#666', fontSize: 14 }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </Animated.View>
);

};

const styles = StyleSheet.create({
  container: {
    position: Platform.OS === 'web' ? 'sticky' : 'absolute',
    top: 0,
    left: 0,
    right: 0,

    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderBottomWidth: 1,
    borderColor: '#ddd',

  },
  modalScroll: {
  paddingBottom: 32,
  paddingHorizontal: 16,
  alignItems: 'flex-start',
},
  header: {
    position:  'relative',
  justifyContent: 'center',
  paddingHorizontal: 16,
  paddingBottom: 4,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderColor: '#ddd',
  overflow: 'hidden',  // 👈 critical for height animation
  minHeight: 110,
  maxHeight: 110,
  flexShrink: 0,  // Never compress
  flexGrow: 0,    // Never expand

},
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
    minHeight: 48,
    flexShrink: 0,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  // eBay-Style Search Container - Now full width
  ebaySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3665f3', // eBay blue
    overflow: 'hidden',
    height: 40,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
    height: '100%',
    justifyContent: 'center',
    minWidth: 100,
    maxWidth: 140,
    flexShrink: 1,  // Allow compression
    flexGrow: 0,    // Don't expand
  },
  categoryText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  searchDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e5e5e5',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    minWidth: 100,  // Prevent total collapse
    flexShrink: 1,  // Can compress if needed
  },
  searchButton: {
    backgroundColor: '#3665f3', // eBay blue
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
  color: '#000', // mystical purple
  fontSize: 15,
  fontWeight: 'bold',
  textShadowColor: '#F5F5F5',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 2,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    color: '#333',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    minWidth: 44,
    maxWidth: 44,
    minHeight: 44,
    maxHeight: 44,
    flexShrink: 0,
    flexGrow: 0,
  },
  iconWrapper: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 4,
},

linkWrapper: {
  justifyContent: 'center',
  alignItems: 'center',
  height: 28, // match icon height
},

  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    height: '100%',
    paddingVertical: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '85%',
    maxHeight: '80%',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuProfileSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  menuProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuProfileInfo: {
    flex: 1,
  },
  menuProfileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuProfileLink: {
    fontSize: 14,
    color: '#6A0DAD',
    fontWeight: '600',
  },
  modalHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#fff',
    gap: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#2d3748',
    fontWeight: '500',
  },
  closeText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  tile: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    borderWidth: 1,
    borderColor: '#aaa',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  month: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  stone: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  cartContainer: {
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  height: 40, // match other icons
},

  cartIcon: {
  width: 40,
  height: 40,
  maxHeight: 40,
  resizeMode: 'contain',
},

  badge: {
   position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
  alignItems: 'center',
},

badgeText: {
  color: 'white',
  fontSize: 10,
  textAlign: 'center',
},
  // Dropdown container (floats below search bar)
  dropdown: {
    position: 'absolute',
    top: 100, // below main row (removed badge)
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 2000,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    maxHeight: 300,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  resultLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  resultMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  dropdownClose: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999',
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  resultContent: {
    flex: 1,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6A0DAD',
    marginTop: 2,
  },
  resultScore: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyResults: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  // Category Modal
  categoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '70%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionSelected: {
    backgroundColor: '#f0f4ff',
  },
  categoryDivider: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    pointerEvents: 'none',
  },
  categoryOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '400',
  },
  categoryOptionTextSelected: {
    color: '#6A0DAD',
    fontWeight: '600',
  },
  categoryCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryCloseText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  categorySignedIn: {
    backgroundColor: '#f0f9ff',
    pointerEvents: 'none',
  },
  categorySignedInText: {
    color: '#38a169',
    fontWeight: '600',
  },
  categoryModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    gap: 4,
  },
  signInButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  signInText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#38a169',
  },


});


export default EnhancedHeader;

import { useLocalSearchParams, useRouter, useFocusEffect} from 'expo-router';
import {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Modal,
  Animated as RNAnimated
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { GoatFlip } from '@/components/GoatAnimator/goatFlip';
import { playGoatSoundByName } from "@/assets/sounds/officialGoatSoundsSoundtrack";

import {AuctionItem} from "@/types/items";
import { useAppSelector, useAppDispatch } from '@/hooks/reduxHooks';
import {JewelryItem} from "@/types";
import  { useCartBackend } from 'hooks/usecartBackend';
import { addItem } from '@/utils/cartSlice';
import {Ionicons} from "@expo/vector-icons";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import Toast from "react-native-toast-message";

import React from "react";
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';



function safeFormat(dateString: string | undefined, formatStr: string): string {
  if (!dateString) return 'Unknown';
  try {
    const iso = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const parsed = parseISO(iso);
    return format(parsed, formatStr);
  } catch {
    return 'Unknown';
  }
}


interface User {
  id: number;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar_url?: string;
  address?: string; // 🐐 Add this line
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  jewelryBox?: JewelryItem[];
}


type Bid = {
  id?: string;
  amount: number;
  user_id: number;
  username?: string;
  timestamp: string;
};

type ItemDetail = {
  id: number;
  name: string;
  description?: string;
  price: number;
  highest_bid?: number;
  reserve_price?: number;
  has_reserve?: boolean;
  buy_it_now?: number;
  buy_it_now_price?: number;
  registration_time?: string;
  status?: string;
  is_sold?: boolean;

  additional_photos?: string[];
  category?: string;
  tags?: string;
  photo_url?: string;
  listed_at: string;
  listedAt: string;
  recent_bids?: Bid[];
  is_highest_bidder?: number;
  is_favorited?: boolean;
  type?: string;
  item_media?: string[];
  rarity?: string;
  auction_ends_at?: string;
  weight_lbs?: number;
  relist_count?: number;
  diamond_specifications?: string;
  relisted_at?: string;
  original_price?: number;
  is_must_sell?: number | boolean;
  must_sell_duration?: number;
  must_sell_start?: string;
  selling_strategy?: string;
  watching_count?: number;
  bid_count?: number;
  min_next_bid?: number;
  condition?: string;
  watch_specifications?: string;
  seller?: {
    id?: number;
    email?: string;
    username: string;
    items_sold: number;
    joined: string;
    is_premium?: boolean;
    rating?: {
      avg_rating: number;
      review_count: number;
      positive_percent: number;
    };
  };
};

type SimilarItem = Pick<AuctionItem, 'id' | 'title' | 'description' | 'image' | 'price'> & {
  mascot: { emoji: string };
  isFavorite: boolean;
};

const getThumbSize = () => {
  const { width } = Dimensions.get('window');
  if (width < 360) return 56;       // small phones
  if (width < 400) return 64;       // most phones
  if (width < 520) return 72;       // large phones
  return 80;                        // tablets
};
const THUMB_SIZE = 72;

const API_URL = 'http://10.0.0.170:5000';
const fallbackImage = 'https://via.placeholder.com/300x200.png?text=No+Image+Available';

// Helper functions for similarity calculation
const gemstones = ['diamond', 'sapphire', 'ruby', 'emerald', 'pearl', 'opal', 'topaz', 'amethyst', 'aquamarine', 'tanzanite'];
const itemTypes = ['ring', 'earring', 'necklace', 'bracelet', 'pendant', 'brooch', 'anklet', 'chain', 'cuff'];
const shapes = ['round', 'princess', 'radiant', 'oval', 'pear', 'heart', 'emerald', 'cushion', 'marquise', 'asscher'];
const watchBrands = ['patek philippe', 'rolex', 'audemars piguet', 'cartier', 'omega', 'breitling', 'tag heuer', 'iwc', 'panerai', 'jaeger-lecoultre', 'vacheron constantin', 'a. lange', 'hublot', 'richard mille'];
const luxuryBrands = ['tiffany', 'bulgari', 'van cleef', 'harry winston', 'graff', 'chopard', 'boucheron', 'david yurman', 'john hardy', 'lagos', 'mikimoto', 'buccellati', 'pomellato', 'ippolita', 'roberto coin', 'marco bicego', 'tacori', 'penny preville'];
const metals = [
  { name: 'yellow gold', variations: ['yellow gold', 'yg'] },
  { name: 'rose gold', variations: ['rose gold', 'pink gold', 'rg'] },
  { name: 'white gold', variations: ['white gold', 'wg'] },
  { name: 'platinum', variations: ['platinum', 'pt'] },
  { name: 'silver', variations: ['silver', 'sterling'] },
];

const extractCarat = (text: string): number => {
  const match = /(\d+\.?\d*)\s*(ct|carat|carats)/i.exec(text)
  return match ? Number.parseFloat(match[1]) : 0;
};

const getCaratRange = (carat: number): string => {
  if (carat === 0) return 'none';
  if (carat <= 0.25) return '0.01-0.25';
  if (carat <= 0.5) return '0.26-0.50';
  if (carat <= 0.75) return '0.51-0.75';
  if (carat <= 1) return '0.76-1.00';
  if (carat <= 1.5) return '1.01-1.50';
  if (carat <= 2) return '1.51-2.00';
  if (carat <= 2.5) return '2.01-2.50';
  if (carat <= 3) return '2.51-3.00';
  if (carat <= 4) return '3.01-4.00';
  if (carat <= 5) return '4.01-5.00';
  if (carat <= 10) return '5.01-10.00';
  return '10.00+';
};

const findMetal = (text: string) =>
  metals.find(m => m.variations.some(v => text.includes(v)))?.name;

const calculateItemTypeScore = (itemTypeText: string, otherTypeText: string): number => {
  const itemType = itemTypes.find(t => itemTypeText.includes(t));
  const otherType = itemTypes.find(t => otherTypeText.includes(t));

  const isLooseStone = !itemType && (itemTypeText.includes('diamond') || itemTypeText.includes('stone') || gemstones.some(g => itemTypeText.includes(g)));
  const isOtherLooseStone = !otherType && (otherTypeText.includes('diamond') || otherTypeText.includes('stone') || gemstones.some(g => otherTypeText.includes(g)));

  if (isLooseStone && isOtherLooseStone) return 100;
  if (itemType && otherType) {
    if (itemType === otherType) return 120;
    return -1;
  }
  if ((itemType || otherType) && (isLooseStone || isOtherLooseStone)) return -1;
  return 0;
};

const calculateWatchScore = (itemName: string, itemTags: string, itemCategory: string, otherName: string, otherTags: string, otherCategory: string): number => {
  const itemWatchBrand = watchBrands.find(b => itemName.includes(b) || itemTags.includes(b));
  const otherWatchBrand = watchBrands.find(b => otherName.includes(b) || otherTags.includes(b));

  const isWatch = itemCategory === 'watches' || itemName.includes('watch') || itemTags.includes('watch') || itemWatchBrand;
  const isOtherWatch = otherCategory === 'watches' || otherName.includes('watch') || otherTags.includes('watch') || otherWatchBrand;

  if (isWatch && isOtherWatch) {
    let score = 0;
    if (itemWatchBrand && itemWatchBrand === otherWatchBrand) score += 150;

    const movements = ['automatic', 'manual', 'quartz', 'mechanical'];
    const itemMovement = movements.find(m => itemName.includes(m) || itemTags.includes(m));
    const otherMovement = movements.find(m => otherName.includes(m) || otherTags.includes(m));
    if (itemMovement && itemMovement === otherMovement) score += 25;

    const origins = ['swiss', 'swiss made', 'japan', 'german', 'italian'];
    const itemOrigin = origins.find(o => itemName.includes(o) || itemTags.includes(o));
    const otherOrigin = origins.find(o => otherName.includes(o) || otherTags.includes(o));
    if (itemOrigin && itemOrigin === otherOrigin) score += 20;

    return score;
  }
  if (isWatch !== isOtherWatch) return -1;
  return 0;
};

export default function ItemScreen() {
  const { itemId } = useLocalSearchParams();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [showGoatBah, setShowGoatBah] = useState(false);
  const router = useRouter(); // ✅ Inside component
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [thumbSize, setThumbSize] = useState(getThumbSize());
  const [similarItems, setSimilarItems] = useState<AuctionItem[]>([]);
 const [loading, setLoading] = useState (false);
  const dispatch = useAppDispatch();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showPriceAdjustment, setShowPriceAdjustment] = useState(false);
  const [newPrice, setNewPrice] = useState<string>('');
  const [showCostModal, setShowCostModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [movementExpanded, setMovementExpanded] = useState(false);
  const [caseExpanded, setCaseExpanded] = useState(false);
  const [bandExpanded, setBandExpanded] = useState(false);
  const [otherExpanded, setOtherExpanded] = useState(false);
  const [diamondCertExpanded, setDiamondCertExpanded] = useState(false);
  const [diamondShippingExpanded, setDiamondShippingExpanded] = useState(false);
  const [showBiddingHelp, setShowBiddingHelp] = useState(false);
  const [showRecentBidsHelp, setShowRecentBidsHelp] = useState(false);
  const [showListingTypeModal, setShowListingTypeModal] = useState(false);
  const [showAuctionHelp, setShowAuctionHelp] = useState(false);
  const [showBuyItNowHelp, setShowBuyItNowHelp] = useState(false);
  const [showMustSellHelp, setShowMustSellHelp] = useState(false);
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);


const { cartItems, addToCart, isInCart } = useCartBackend();

  // Check if auction has ended
  const isAuctionEnded = () => {
    if (!item?.auction_ends_at) return false;
    const endTime = new Date(item.auction_ends_at).getTime();
    const now = Date.now();
    return now > endTime;
  };

  // Check if auction is ending soon (within 24 hours)
  const isEndingSoon = () => {
    if (!item?.auction_ends_at) return false;
    const endTime = new Date(item.auction_ends_at).getTime();
    const now = Date.now();
    const hoursRemaining = (endTime - now) / (1000 * 60 * 60);
    return hoursRemaining > 0 && hoursRemaining <= 24;
  };

  useEffect(() => {
    if (itemId) {
      void fetchItem();
      // Scroll to top when itemId changes (similar item navigation)
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
    void loadCurrentUser();
  }, [itemId]);

  // Scroll to top when screen receives focus (returning from navigation)
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const loadCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const res = await fetch(`${API_URL}/api/user-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setCurrentUserId(userData.id);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };


  const mapToAuctionItem = (i: any) => ({
    id: i.id || i.item_id,
    item_id: i.item_id || i.id,
    Item: i.Item || i.id,
    name: i.name,
    title: i.name || i.title,
    isInCart: isInCart(i.id),
    description: i.description || '',
    price: i.price || 0,
    photo_url: i.photo_url,
    image_url: i.photo_url,
    image: i.photo_url,
    listed_at: i.listed_at || i.registration_time || new Date().toISOString(),
    registration_time: i.registration_time || i.listedAt || new Date().toISOString(),
    auction_ends_at: i.auction_ends_at || i.end_time || '',
    end_time: i.end_time || i.auction_ends_at,
    bidCount: i.bidCount || i.bid_count || 0,
    bid_count: i.bid_count || i.bidCount || 0,
    quantity_available: i.quantity_available || 1,
    isFavorite: false,
    mascot: { emoji: '🐐' },
    isWatched: false,
    timeLeft: '',
    watchers: '',
    category: i.category || '',
    tags: i.tags || '',
    preview: false,
    isWishlisted: '',
    auction_id: i.auction_id || 0,
    AuctionId: i.auction_id || 0,
    Auction_id: i.auction_id || 0,
    AuctionItem: { id: i.id || 0 },
    is_trending: i.is_trending || false,
    reserve_price: i.reserve_price || 0,
    final_price: i.final_price || 0,
    is_sold: i.is_sold || false,
    sold_to: i.sold_to || '',
    gem: '',
    carat: 0,
    color: '',
    size: '',
    condition: '',
    origin: '',
    certification: '',
    material: '',
  });

  const calculateSimilarityScore = (data: any, itemName: string, itemTags: string, itemCategory: string, itemPrice: number) => (other: any): number => {
    if (other.id === data.id) return -1;

    let score = 0;
    const otherName = String(other.name || '').toLowerCase();
    const otherTags = String(other.tags || '').toLowerCase();
    const otherCategory = String(other.category || '').toLowerCase();
    const otherPrice = other.price || other.buy_it_now || 0;

    // Item Type Match
    const itemTypeText = `${itemName} ${itemTags} ${String(data.description || '').toLowerCase()}`;
    const otherTypeText = `${otherName} ${otherTags} ${String(other.description || '').toLowerCase()}`;
    const typeScore = calculateItemTypeScore(itemTypeText, otherTypeText);
    if (typeScore === -1) return -1;
    score += typeScore;

    // Diamond Shape Match
    const itemShape = shapes.find(s => itemName.includes(s) || itemTags.includes(s));
    const otherShape = shapes.find(s => otherName.includes(s) || otherTags.includes(s));
    if (itemShape && itemShape === otherShape) score += 50;

    // Carat Weight Range Match
    const itemCaratRange = getCaratRange(extractCarat(`${itemName} ${itemTags}`));
    const otherCaratRange = getCaratRange(extractCarat(`${otherName} ${otherTags}`));
    if (itemCaratRange !== 'none' && itemCaratRange === otherCaratRange) score += 40;

    // Metal Type Match
    const itemMetal = findMetal(`${itemName} ${itemTags}`);
    const otherMetal = findMetal(`${otherName} ${otherTags}`);
    if (itemMetal && itemMetal === otherMetal) score += 30;

    // Gemstone Match
    const itemGem = gemstones.find(g => itemName.includes(g) || itemTags.includes(g));
    const otherGem = gemstones.find(g => otherName.includes(g) || otherTags.includes(g));
    if (itemGem && itemGem === otherGem) score += 35;

    // Watch Matching
    const watchScore = calculateWatchScore(itemName, itemTags, itemCategory, otherName, otherTags, otherCategory);
    if (watchScore === -1) return -1;
    score += watchScore;

    // Price Range Match
    if (itemPrice > 0 && otherPrice > 0) {
      const priceDiff = Math.abs(itemPrice - otherPrice) / itemPrice;
      if (priceDiff <= 0.3) score += 25;
      else if (priceDiff <= 0.5) score += 15;
      else if (priceDiff <= 1) score += 5;
    }

    // Category Match
    if (itemCategory && itemCategory === otherCategory) score += 20;

    // Luxury Brand Match
    const itemJewelryBrand = luxuryBrands.find(b => itemName.includes(b) || itemTags.includes(b));
    const otherJewelryBrand = luxuryBrands.find(b => otherName.includes(b) || otherTags.includes(b));
    if (itemJewelryBrand && itemJewelryBrand === otherJewelryBrand) score += 150;

    return score;
  };

  const fetchSimilarItems = async (data: any) => {
    const similarRes = await fetch(`${API_URL}/items/discover`);
    const allItems = await similarRes.json();

    const itemName = String(data.name || '').toLowerCase();
    const itemTags = String(data.tags || '').toLowerCase();
    const itemCategory = String(data.category || '').toLowerCase();
    const itemPrice = data.price || data.buy_it_now || 0;

    const scoredItems = allItems
      .map((item: any) => ({ item, score: calculateSimilarityScore(data, itemName, itemTags, itemCategory, itemPrice)(item) }))
      .filter((scored: any) => scored.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 6);

    console.log('🐐 Item being matched:', { name: itemName, category: itemCategory, tags: itemTags.substring(0, 80) });

    const filtered = scoredItems.map((scored: any) => mapToAuctionItem(scored.item));
    console.log('🐐 Similar items fetched:', filtered.length);
    setSimilarItems(filtered);
  };

  const fetchItem = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/item/${itemId}`, { headers });
      const data = await res.json();
      console.log('🔍 Item data received:', { reserve_price: data.reserve_price, buy_it_now: data.buy_it_now, item_id: data.item_id });

      // Fetch recent bids and highest bid in parallel
      try {
        const [recentBidsRes, highestBidRes] = await Promise.all([
          fetch(`${API_URL}/item/${itemId}/recent-bids`),
          fetch(`${API_URL}/item/${itemId}/highest-bid`)
        ]);

        if (recentBidsRes.ok) {
          const recentBidsData = await recentBidsRes.json();
          data.recent_bids = recentBidsData.recent_bids;
        }

        if (highestBidRes.ok) {
          const highestBidData = await highestBidRes.json();
          data.highest_bid = highestBidData.highest_bid;
        }
      } catch (bidError) {
        console.log('Could not fetch bid history:', bidError);
        // Non-critical error, continue with item data
      }

      setItem(data);
      await fetchSimilarItems(data);
    } catch (error) {
      console.error('Error fetching item:', error);
    }
  };

  useEffect(() => {
  const sub = Dimensions.addEventListener('change', () => {
    setThumbSize(getThumbSize());
  });
  return () => sub.remove();
}, []);

  const triggerGoatBah = () => {
    setShowGoatBah(true);
    setTimeout(() => setShowGoatBah(false), 3000);
  };

  const handleBidSubmit = async () => {
    console.log('🔨 Place Bid button clicked');
    console.log('📊 Bid amount entered:', bidAmount);
    const numericBid = Number.parseFloat(bidAmount);
    console.log('📊 Numeric bid:', numericBid);

    // Validate bid amount
    if (!item || isNaN(numericBid)) {
      console.log('❌ Validation failed: invalid bid amount');
      Alert.alert('Invalid bid', 'Please enter a valid bid amount');
      return;
    }

    // Check against minimum next bid if available, otherwise check against current price
    const minRequired = item.min_next_bid ?? item.price;
    console.log('📊 Min required:', minRequired);
    console.log('📊 Comparison:', numericBid, '<', minRequired, '=', numericBid < minRequired);

    if (numericBid < minRequired) {
      console.log('❌ Bid too low');
      Alert.alert('Bid Too Low', `Your bid must be at least $${minRequired.toLocaleString()}`);
      return;
    }

    console.log('✅ Validation passed, submitting bid...');

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_URL}/item/${item.id}/bid`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: numericBid }),
      });

      if (res.ok) {
        // Trigger celebration
        triggerGoatBah();
        await playGoatSoundByName('Victory Baa');

        // Clear bid input
        setBidAmount('');

        // Refresh item to show updated state
        await fetchItem();

        // Calculate time remaining
        const getTimeRemaining = () => {
          if (!item?.auction_ends_at) return 'Unknown';
          const endsAt = new Date(item.auction_ends_at);
          const now = new Date();
          const diff = endsAt.getTime() - now.getTime();

          if (diff <= 0) return 'Auction ended';

          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) return `${days}d ${hours}h remaining`;
          if (hours > 0) return `${hours}h ${minutes}m remaining`;
          return `${minutes}m remaining`;
        };

        const timeLeft = getTimeRemaining();

        // Show enhanced success toast with time remaining
        Toast.show({
          type: 'success',
          text1: '🎉 You\'re the High Bidder!',
          text2: `Current bid: $${numericBid.toLocaleString()} • ${timeLeft}\n✨ We'll notify you if you're outbid`,
          visibilityTime: 8000,
          position: 'top',
          onPress: () => {
            // Navigate to My Bids screen when user taps the toast
            router.push('/my-bids' as any);
          },
          text1Style: {
            fontSize: 16,
            fontWeight: '700',
          },
          text2Style: {
            fontSize: 13,
            lineHeight: 18,
          },
        });
        
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to place bid' }));
        const message = errorData.error || errorData.message || 'Failed to place bid';
        
        Toast.show({
          type: 'error',
          text1: '❌ Bid Failed',
          text2: message,
          visibilityTime: 3000,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Bid placement error:', error);
      Toast.show({
        type: 'error',
        text1: '❌ Error',
        text2: 'Could not place bid. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  const user = useAppSelector(state => state.user.profile);


  const scrollToIndex = (index: number) => {
  if (flatListRef.current) {
    flatListRef.current.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }
};

console.log('🧪 item snapshot:', item);


const handleBuyNow = async () => {
  if (!item?.buy_it_now) return;

  console.log('🛒 Buy It Now tapped for item:', item.id);

  Alert.alert(
    'Confirm Purchase',
    `Buy this item now for $${item.buy_it_now}?\n\nNote: Full Stripe checkout requires Expo development build. This is a demo.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm Purchase',
        onPress: () => {
          void (async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              if (!token) {
                Alert.alert('Please sign in', 'You need to be signed in to purchase');
                return;
              }

              // Create an immediate purchase order
              const response = await fetch('http://10.0.0.170:5000/api/buy-now', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  item_id: item.id,
                  sale_price: item.buy_it_now,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Buy Now error response:', errorData);
                throw new Error(errorData.error || 'Purchase failed');
              }

              const result = await response.json();

              // 🎉 Play goat sound on success
              try {
                const { playGoatSound } = await import('@/components/ui/GoatSound');
                await playGoatSound();
              } catch (err) {
                console.log('Could not play goat sound:', err);
              }

              // 🎊 Show success toast
              try {
                const { showToast } = await import('@/utils/toast');
                showToast('success', '🎉 Purchase Successful!', `You bought ${item.name} for $${item.buy_it_now}`);
              } catch (err) {
                console.log('Could not show toast:', err);
              }

              // Navigate to the buyer orders screen to see the new order
              router.push('/orders');

            } catch (error) {
              console.error('Purchase error:', error);

              // Show error toast
              try {
                const { showToast } = await import('@/utils/toast');
                showToast('error', 'Purchase Failed', 'Please try again');
              } catch (err) {
                console.log('Could not show error toast:', err);
              }

              Alert.alert('Error', 'Purchase failed. Please try again.');
            }
          })();
        },
      },
    ]
  );
};

const handlePriceAdjustment = async () => {
  if (!newPrice || !item) return;

  const price = Number.parseFloat(newPrice);
  if (Number.isNaN(price) || price <= 0) {
    Alert.alert('Invalid Price', 'Please enter a valid price');
    return;
  }

  if (price >= item.price) {
    Alert.alert('Price Must Be Lower', 'The new price must be lower than the current price to attract buyers');
    return;
  }

  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    const response = await fetch(`${API_URL}/api/items/${item.id}/adjust-price`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        new_price: price,
        original_price: item.original_price || item.price,
      }),
    });

    if (response.ok) {
      Alert.alert('Success', 'Price updated successfully!');
      setShowPriceAdjustment(false);
      setNewPrice('');
      await fetchItem(); // Refresh item data
    } else {
      Alert.alert('Error', 'Failed to update price');
    }
  } catch (error) {
    console.error('Price adjustment error:', error);
    Alert.alert('Error', 'Failed to update price');
  }
};

const handleAddToCart = async () => {
  if (!item) return;
  console.log('🛒 Adding to cart:', item.id);

  try {
    // Add to the Redux state first for immediate UI feedback
    dispatch(addItem({
      id: item.id,
      name: item.name,
      price: item.buy_it_now ?? item.price,
      quantity: 1,
      photo_url: item.photo_url ?? '',
      theme: 'default',
      isInCart: true,
    }));

    // Show success toast
    Toast.show({
      type: 'success',
      text1: 'Added to Cart 🛒',
      text2: item.name,
      visibilityTime: 2000,
      position: 'top',
    });

    // Then sync with the backend
    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      const response = await fetch('http://10.0.0.170:5000/api/cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: item.id, quantity: 1 }),
      });

      if (!response.ok) {
        console.error('🛒 Backend sync failed');
        return;
      }
      console.log('🛒 Successfully synced with backend');
    }
  } catch (error) {
    console.error('🛒 Cart error:', error);
    Toast.show({
      type: 'error',
      text1: 'Failed to add to cart',
      text2: 'Please try again',
      visibilityTime: 2000,
      position: 'top',
    });
  }
};

  const handleFavorite = async () => {
    if (!item) return;

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Login Required', 'Please sign in to add items to your Jewelry Box');
        router.push('/sign-in');
        return;
      }

      const response = await fetch('http://10.0.0.170:5000/api/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: item.id }),
      });

      if (response.ok) {
        Alert.alert('Added to Jewelry Box! 💎', 'View it in your Jewelry Box tab', [
          { text: 'OK' },
          { text: 'View Jewelry Box', onPress: () => router.push('/(tabs)/JewelryBoxScreen') }
        ]);
        // Update local state to hide the favorite button
        if (item) {
          setItem({ ...item, is_favorited: true });
        }
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to add to favorites');
      }
    } catch (error) {
      console.error('Favorite error:', error);
      Alert.alert('Error', 'Could not add to favorites. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!item) return;

    try {
      const message = `Check out this ${item.name} on BidGoat! \n\nPrice: $${displayPrice.toFixed(2)}\n\nView: https://bidgoat.com/item/${item.id}`;

      const result = await Share.share({
        message,
        title: item.name,
        url: `https://bidgoat.com/item/${item.id}`,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Shared!', 'Thanks for spreading the word! ');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Could not share this item');
    }
  };

  const handleSellSimilar = () => {
    // Always show modal asking for listing type
    setShowListingTypeModal(true);
  };

  const routeToListingScreen = (listingType?: 'auction' | 'buy_it_now' | 'must_sell') => {
    if (!item) return;

    // Determine category-specific route - safely handle undefined values
    const category = String(item.category || '').toLowerCase();
    const tags = String(item.tags || '').toLowerCase();
    const itemName = String(item.name || '').toLowerCase();

    // Watches - route to watch-appraisal (price calculator)
    if (category === '2' || category === 'watches' || tags.includes('watch') || itemName.includes('watch')) {
      router.push('/watch-appraisal');
      return;
    }

    // Diamonds (loose stones only) - route to diamond-appraisal (price calculator)
    if (category === '1' || category === 'diamonds' || tags.includes('diamond') || itemName.includes('diamond')) {
      router.push('/diamond-appraisal');
      return;
    }

    // All other jewelry (bracelets, necklaces, rings, earrings, etc.) - route to general listing
    // Pass listingType in the route path using Expo Router's push with params
    if (listingType === 'buy_it_now') {
      router.push('/listing/create?listingType=buy_it_now' as any);
    } else if (listingType === 'must_sell') {
      router.push('/listing/create?listingType=must_sell' as any);
    } else {
      router.push('/listing/create?listingType=auction' as any);
    }
  };


  if (!item) return <ActivityIndicator style={{ marginTop: 20 }} />;

  // Prepare data
  console.log(' Date fields:', {
    listed_at: item.listed_at,
    registration_time: item.registration_time,
    listedAt: item.listedAt,
    auction_ends_at: item.auction_ends_at
  });
  const dateField = item.listed_at || item.listedAt || item.registration_time;
  const formattedDate = safeFormat(dateField, 'PPP');
  const mediaArray = Array.isArray(item?.additional_photos) ? item!.additional_photos! : [];
  const allImages = [item.photo_url, ...mediaArray].filter(Boolean);

  const handleViewSeller = () => {
    const sellerId = item?.seller?.id;
    if (typeof sellerId === 'number' && Number.isInteger(sellerId) && sellerId > 0) {
      router.push(`/seller/${sellerId}`);
    } else {
      Alert.alert('Invalid Seller', 'This item has no valid seller profile.');
    }
  };

  const getDisplayPrice = () => {
    if (typeof item.buy_it_now === 'number') {
      return item.buy_it_now;
    }
    if (typeof item.highest_bid === 'number') {
      return item.highest_bid;
    }
    return item.price;
  };

  const displayPrice = getDisplayPrice();

  const renderSimilarItemsContent = () => {
    if (loading) {
      return <ShimmerPlaceholder />;
    }

    if (similarItems.length > 0) {
      return (
        <FlatList
          data={similarItems}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: similarItem }) => (
            <TouchableOpacity
              style={styles.similarCard}
              onPress={() => router.push(`/item/${similarItem.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.similarImageContainer}>
                <Image
                  source={{ uri: similarItem.photo_url || fallbackImage }}
                  style={styles.similarCardImage}
                  contentFit="cover"
                  transition={150}
                  cachePolicy="memory-disk"
                />
                <View style={styles.similarBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                </View>
              </View>
              <View style={styles.similarCardContent}>
                <Text style={styles.similarCardTitle} numberOfLines={2}>
                  {similarItem.name}
                </Text>
                <View style={styles.similarPriceRow}>
                  <Text style={styles.similarCardPrice}>
                    ${(similarItem.price ?? 0).toFixed(2)}
                  </Text>
                  <View style={styles.similarArrow}>
                    <Ionicons name="arrow-forward" size={14} color="#6A0DAD" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.similarItemsList}
        />
      );
    }

    return (
      <View style={styles.noSimilarContainer}>
        <Ionicons name="search-outline" size={48} color="#CBD5E0" />
        <Text style={styles.noSimilarItems}>No similar items found</Text>
        <Text style={styles.noSimilarSubtext}>Check back soon for more treasures!</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
        {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
       <TouchableOpacity
    onPress={() => router.back()}
    style={{
      position: 'absolute',
      top: HEADER_MAX_HEIGHT + 8,
      left: 16,
      zIndex: 999,
      backgroundColor: 'white',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    }}
  >
    <Text style={{ fontSize: 16, color: '#4b3f72', fontWeight: '600' }}>← Back</Text>
  </TouchableOpacity>
       {/* Cart Button */}
  <View style={styles.floatingCart}>
    <TouchableOpacity onPress={() => router.push('/cart')} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="cart" size={28} color="#6A0DAD" />
      <Text style={styles.cartBadge}>{cartItems.length}</Text>
    </TouchableOpacity>
  </View>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT, paddingBottom: 100 }}
      >
        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/FullImageScreen',
              params: { mediaArray: JSON.stringify(allImages), index: '0' }
            })}
          >
            <Image
              source={{ uri: item.photo_url || fallbackImage }}
              style={styles.mainImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              priority="high"
            />

            {/* SOLD Banner Overlay for Ended Auctions */}
            {isAuctionEnded() && item.highest_bid && item.highest_bid > 0 && (
              <View style={styles.soldBannerOverlay}>
                <View style={styles.soldBannerDiagonal}>
                  <Text style={styles.soldBannerText}>
                    {item.is_highest_bidder ? 'YOU WON' : 'SOLD'}
                  </Text>
                </View>
              </View>
            )}

            {/* PRICE DROP Badge - Bottom Left for Converted Items */}
            {item.original_price && item.buy_it_now && item.original_price > item.buy_it_now && !isAuctionEnded() && (
              <View style={styles.priceDropBadge}>
                <Ionicons name="flash" size={14} color="#FFF" />
                <Text style={styles.priceDropBadgeText}>
                  PRICE DROP
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailScroll}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              data={allImages}
              keyExtractor={(item, idx) => `${item}-${idx}`}
              renderItem={({ item: uri, index: idx }) => (
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/FullImageScreen',
                    params: { mediaArray: JSON.stringify(allImages), index: String(idx) }
                  })}
                  style={[styles.thumbnail, idx === 0 && styles.thumbnailActive]}
                >
                  <Image
                    source={{ uri }}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                    transition={100}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              )}
              initialNumToRender={3}
              maxToRenderPerBatch={2}
              windowSize={5}
            />
          )}



        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>


          {/* Title */}
          <View style={styles.headerSection}>
            <Text style={styles.itemTitle}>{item.name || 'Unnamed'}</Text>
          </View>

          {/* Price Cards */}
          <View style={styles.priceSection}>
            {/* Auction items - show either Starting Bid or Highest Bid */}
            {!item.buy_it_now && (
              <View style={[
                styles.priceCard,
                (item.highest_bid && item.highest_bid > item.price) ? styles.highestBidCard : null
              ]}>
                {item.highest_bid && item.highest_bid > item.price ? (
                  <>
                    <Text style={styles.priceLabel}>💰 Highest Bid</Text>
                    <Text style={[styles.priceValue, styles.highestBidValue]}>${item.highest_bid}</Text>

                  </>
                ) : (
                  <>
                    <Text style={styles.priceLabel}>
                      {item.selling_strategy === 'must_sell' ? '⚡ Must Sell' : 'Starting Bid'}
                    </Text>
                    <Text style={styles.priceValue}>
                      {item.selling_strategy === 'must_sell' && item.price === 0 ? 'Best Offer' : `$${item.price}`}
                    </Text>
                    <Text style={styles.noBidsText}>
                      {item.selling_strategy === 'must_sell' ? 'Highest bidder wins!' : 'No bids yet'}
                    </Text>
                  </>
                )}
              </View>
            )}
            {!!item.buy_it_now && (
              <View style={[styles.priceCard, styles.buyNowCard]}>
                <Text style={styles.priceLabel}>Buy It Now</Text>
                <Text style={[styles.priceValue, styles.buyNowPrice]}>${item.buy_it_now}</Text>

                {/* Show old price if this was converted from auction with price drop */}
                {item.original_price && item.original_price > item.buy_it_now && (
                  <Text style={styles.originalPrice}>Was ${item.original_price}</Text>
                )}
              </View>
            )}
          </View>

          {/* Price Drop Deal Card - Show for converted items with savings */}
          {item.original_price && item.buy_it_now && item.original_price > item.buy_it_now && (
            <View style={styles.priceDropDealCard}>
              <View style={styles.dealCardHeader}>
                <Ionicons name="pricetag" size={28} color="#FF6B35" />
                <Text style={styles.dealCardTitle}>💰 Price Drop Special!</Text>
              </View>

              <Text style={styles.dealCardText}>
                This item was previously listed as an auction starting at ${item.original_price}.
                The seller has now made it available as Buy It Now for only ${item.buy_it_now} -
                save ${item.original_price - item.buy_it_now}! No waiting, no bidding wars.
              </Text>

              <View style={styles.priceComparison}>
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonLabel}>Original Auction</Text>
                  <Text style={styles.comparisonOld}>${item.original_price}</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#6A0DAD" />
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonLabel}>Buy It Now</Text>
                  <Text style={styles.comparisonNew}>${item.buy_it_now}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.savingsBadgeLarge}
                onPress={() => {
                  console.log('💚 Savings badge tapped!', { buy_it_now: item.buy_it_now, buy_it_now_price: item.buy_it_now_price });
                  handleBuyNow();
                }}
              >
                <Text style={styles.savingsBadgeText}>
                  SAVE ${item.original_price - item.buy_it_now} ({Math.round(((item.original_price - item.buy_it_now) / item.original_price) * 100)}% OFF)
                </Text>
                <View style={{ marginLeft: 8 }}>
                  <Ionicons name="cart" size={18} color="#FFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.urgencyRow}>
                <Ionicons name="flash" size={16} color="#FF6B35" />
                <Text style={styles.urgencyText}>Seller motivated - Priced to sell!</Text>
              </View>
            </View>
          )}

          {/* Seller Info - Moved up for trust & credibility */}
          <View style={styles.sellerInfoCard}>
            <View style={styles.sellerInfoHeader}>
              <Ionicons name="person-circle" size={24} color="#6A0DAD" />
              <Text style={styles.sectionTitle}>Seller Info</Text>
            </View>
            
            {!!item.seller?.username && (
              <Text style={styles.sellerUsername}>@{item.seller.username}</Text>
            )}

            {/* Seller Rating with Stars */}
            {item.seller?.rating && item.seller?.rating?.review_count > 0 && (
              <View style={styles.sellerRatingRow}>
                <View style={styles.starsContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < Math.round(item.seller?.rating?.avg_rating ?? 0) ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {item.seller?.rating?.avg_rating?.toFixed(1)} ({item.seller?.rating?.review_count} {item.seller?.rating?.review_count === 1 ? 'review' : 'reviews'})
                </Text>
              </View>
            )}
            {item.seller?.rating && item.seller?.rating?.positive_percent > 0 && (
              <Text style={styles.positiveText}>
                ✓ {item.seller?.rating?.positive_percent}% positive feedback
              </Text>
            )}

            <View style={styles.sellerStats}>
              {typeof item.seller?.items_sold === 'number' && (
                <View style={styles.sellerStatItem}>
                  <Ionicons name="cart" size={16} color="#718096" />
                  <Text style={styles.sellerStatText}>{item.seller.items_sold} sold</Text>
                </View>
              )}
              {!!item.seller?.joined && (
                <View style={styles.sellerStatItem}>
                  <Ionicons name="calendar" size={16} color="#718096" />
                  <Text style={styles.sellerStatText}>Joined {item.seller.joined}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleViewSeller} style={styles.viewSellerButton}>
              <Text style={styles.viewSellerButtonText}>View Full Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#6A0DAD" />
            </TouchableOpacity>
          </View>

          {/* Watching Count & Activity Stats - Only show for active auctions */}
          {!isAuctionEnded() && ((item.watching_count ?? 0) > 0 || (item.bid_count ?? 0) > 0) && (
            <View style={styles.activityStatsBar}>
              {(item.watching_count ?? 0) > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="eye" size={18} color="#6A0DAD" />
                  <Text style={styles.statText}>{item.watching_count} watching</Text>
                </View>
              )}
              {(item.bid_count ?? 0) > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="flash" size={18} color="#FF6B35" />
                  <Text style={styles.statText}>{item.bid_count} {item.bid_count === 1 ? 'bid' : 'bids'}</Text>
                </View>
              )}
            </View>
          )}

          {/* Ended Auction - Show total bid count as historical info */}
          {isAuctionEnded() && (item.bid_count ?? 0) > 0 && (
            <View style={styles.endedStatsBar}>
              <View style={styles.statItem}>
                <Ionicons name="hammer" size={18} color="#718096" />
                <Text style={styles.endedStatText}>
                  {item.bid_count} {item.bid_count === 1 ? 'bid placed' : 'bids placed'}
                </Text>
              </View>
            </View>
          )}

          {/* Big Countdown Timer (for active auctions) */}
          {!!item.auction_ends_at && !item.buy_it_now && (() => {
            const now = new Date().getTime();
            const endTime = new Date(item.auction_ends_at).getTime();
            const timeLeft = endTime - now;
            const hoursLeft = timeLeft / (1000 * 60 * 60);

            if (timeLeft > 0) {
              const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
              const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <View style={[styles.countdownCard, hoursLeft <= 24 && styles.countdownUrgent]}>
                  <Text style={styles.countdownLabel}>
                    {hoursLeft <= 2 ? '🔥 ENDING SOON' : '⏰ Time Remaining'}
                  </Text>
                  <View style={styles.countdownNumbers}>
                    {days > 0 && (
                      <View style={styles.countdownBlock}>
                        <Text style={styles.countdownValue}>{days}</Text>
                        <Text style={styles.countdownUnit}>days</Text>
                      </View>
                    )}
                    <View style={styles.countdownBlock}>
                      <Text style={styles.countdownValue}>{hours}</Text>
                      <Text style={styles.countdownUnit}>hrs</Text>
                    </View>
                    <View style={styles.countdownBlock}>
                      <Text style={styles.countdownValue}>{minutes}</Text>
                      <Text style={styles.countdownUnit}>min</Text>
                    </View>
                  </View>
                </View>
              );
            }
            return null;
          })()}

          {/* Minimum Next Bid (for auction items with bids) - Only show if auction is still active */}
          {!item.buy_it_now && !!item.min_next_bid && (item.bid_count ?? 0) > 0 && !isAuctionEnded() && (
            <View style={styles.minBidCard}>
              <Text style={styles.minBidLabel}>Minimum Next Bid</Text>
              <Text style={styles.minBidValue}>${item.min_next_bid.toLocaleString()}</Text>
              <Text style={styles.minBidHint}>Your bid must be at least this amount</Text>
            </View>
          )}

          {/* Auction Info - Important Details */}
          <View style={styles.auctionInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🕒 Listed</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            {!!item.buy_it_now && !!item.auction_ends_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🎁 Buy Before</Text>
                <Text style={styles.infoValue}>
                  {safeFormat(item.auction_ends_at, 'PPP')}
                </Text>
              </View>
            )}
            {/* Only show "Relisted" if NOT a price drop conversion */}
            {!!item.relist_count && item.relist_count > 0 && !(item.original_price && item.buy_it_now && item.original_price > item.buy_it_now) && (
              <View style={styles.relistInfoCard}>
                <Text style={styles.relistLabel}>
                   Relisted: {item.relist_count} {item.relist_count === 1 ? 'time' : 'times'}
                </Text>
                {!!item.relisted_at && (
                  <Text style={styles.relistDate}>
                    Last relisted: {safeFormat(item.relisted_at, 'PPP')}
                  </Text>
                )}
              </View>
            )}

            {/* Success Message for Sellers - SOLD Relisted Items */}
            {!!item.relist_count &&
             item.relist_count > 0 &&
             currentUserId === item.seller?.id &&
             isAuctionEnded() &&
             item.highest_bid &&
             item.highest_bid > 0 && (
              <View style={styles.sellerSuccessCard}>
                <View style={styles.successHeader}>
                  <Ionicons name="trophy" size={32} color="#FFD700" />
                  <Text style={styles.successTitle}>🎉 Congratulations!</Text>
                </View>
                <Text style={styles.successText}>
                  Your item sold for ${item.highest_bid.toLocaleString()} after being relisted {item.relist_count} {item.relist_count === 1 ? 'time' : 'times'}.
                  Persistence pays off!
                </Text>
                <View style={styles.successStats}>
                  <View style={styles.successStatItem}>
                    <Text style={styles.successStatLabel}>Final Price</Text>
                    <Text style={styles.successStatValue}>${item.highest_bid.toLocaleString()}</Text>
                  </View>
                  <View style={styles.successStatItem}>
                    <Text style={styles.successStatLabel}>Total Bids</Text>
                    <Text style={styles.successStatValue}>{item.bid_count || 0}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Seller Recommendations for Relisted Items - ONLY for unsold items */}
            {!!item.relist_count &&
             item.relist_count > 0 &&
             currentUserId === item.seller?.id &&
             isAuctionEnded() &&
             (!item.highest_bid || item.highest_bid === 0) && (
              <View style={styles.sellerRecommendationCard}>
                <Text style={styles.recommendationTitle}>💡 Seller Tips</Text>
                <Text style={styles.recommendationText}>
                  Your item has been relisted {item.relist_count} {item.relist_count === 1 ? 'time' : 'times'} without selling. Consider these strategies:
                </Text>
                <View style={styles.recommendationList}>
                  <Text style={styles.recommendationItem}>• Lower starting bid to attract more bidders</Text>
                  <Text style={styles.recommendationItem}>• Add more detailed photos</Text>
                  <Text style={styles.recommendationItem}>• Offer a competitive &quot;Buy It Now&quot; price</Text>
                  <Text style={styles.recommendationItem}>• Highlight unique features in description</Text>
                </View>
                {/* Only show the Adjust Price button if there are no bids AND auction has ended */}
                {(!item.recent_bids || item.recent_bids.length === 0) &&
                 item.auction_ends_at &&
                 new Date(item.auction_ends_at) < new Date() && (
                  <TouchableOpacity
                    style={styles.adjustPriceButton}
                    onPress={() => setShowPriceAdjustment(true)}
                  >
                    <Text style={styles.adjustPriceButtonText}>🏷️ Adjust Price</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {!item.buy_it_now && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}> Ends</Text>
                <Text style={[
                  styles.infoValue,
                  isEndingSoon() ? styles.urgentTimeText : styles.endTimeText
                ]}>
                  {item.auction_ends_at ? format(new Date(item.auction_ends_at), 'PPPp') : 'No end time'}
                </Text>
              </View>
            )}
            {!item.buy_it_now && item.has_reserve && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🔒 Reserve</Text>
                <Text style={styles.infoValue}>
                  {item.reserve_price
                    ? `$${item.reserve_price}` // Seller sees actual amount
                    : 'Reserve in place' // Buyers just know it exists
                  }
                </Text>
              </View>
            )}
          </View>

          {/* Seller Description - Collapsible eBay Style */}
          <TouchableOpacity
            style={styles.descriptionCard}
            onPress={() => setDescriptionExpanded(!descriptionExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Seller Description</Text>
              <Ionicons
                name={descriptionExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6A0DAD"
              />
            </View>

            {descriptionExpanded ? (
              <Text style={styles.descriptionText}>
                {item.description || 'No description available'}
              </Text>
            ) : (
              <Text style={styles.seeMoreText}>See seller&apos;s description</Text>
            )}
          </TouchableOpacity>

          {/* Technical Specifications / About this item - Collapsible eBay Style */}
          <TouchableOpacity
            style={styles.aboutCard}
            onPress={() => setAboutExpanded(!aboutExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {(item.category === '2' || item.tags?.toLowerCase().includes('watch'))
                  ? 'Technical Specifications'
                  : item.diamond_specifications
                  ? "Seller's Certificate of Diamond"
                  : 'About this item'}
              </Text>
              <Ionicons
                name={aboutExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6A0DAD"
              />
            </View>

            {aboutExpanded ? (
              <View style={styles.aboutTable}>
                {/* 🐐 WATCH TECHNICAL SPECIFICATIONS WITH COLLAPSIBLE GROUPS */}
                {(item.category === '2' || item.tags?.toLowerCase().includes('watch')) && (() => {
                  // Parse watch specifications
                  let watchSpecs: any = {};
                  try {
                    watchSpecs = item.watch_specifications ? JSON.parse(item.watch_specifications) : {};
                    console.log('📊 Parsed watch specs:', watchSpecs);
                  } catch (e) {
                    console.error('Failed to parse watch specs:', e);
                  }

                  // Helper to format values
                  const formatValue = (value: any) => {
                    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                    if (!value || value === '') return null;
                    return String(value);
                  };

                  // Extract brand and model from tags
                  const tagArray = item.tags?.split(',') || [];
                  const brand = tagArray[1]?.trim();
                  const model = tagArray[2]?.trim();

                  // BASIC DESCRIPTION - Always visible at the top
                  const basicInfo = [
                    { label: 'Brand', value: brand },
                    { label: 'Model', value: model },
                    { label: 'Model Number', value: watchSpecs.modelNumber },
                    { label: 'Year of Manufacture', value: watchSpecs.yearOfManufacture },
                    { label: 'Condition', value: watchSpecs.condition },
                  ].filter(spec => formatValue(spec.value) !== null);

                  // COLLAPSIBLE GROUPS
                  const movementSpecs = [
                    { label: 'Movement Type', value: watchSpecs.movementType },
                    { label: 'Water Resistance', value: watchSpecs.waterResistance },
                    { label: 'Features', value: watchSpecs.selectedFeatures?.join(', ') },
                  ].filter(spec => formatValue(spec.value) !== null);

                  const caseSpecs = [
                    { label: 'Case Material', value: watchSpecs.caseMaterial },
                    { label: 'Case Shape', value: watchSpecs.caseShape },
                    { label: 'Case Thickness', value: watchSpecs.caseThickness },
                    { label: 'Watch Size', value: watchSpecs.watchSize },
                    { label: 'Bezel Material', value: watchSpecs.bezelMaterial },
                    { label: 'Bezel Type', value: watchSpecs.bezelType },
                    { label: 'Bezel Style', value: watchSpecs.bezelStyle },
                    { label: 'Bezel Weight (carats)', value: watchSpecs.bezelWeight },
                    { label: 'Original Bezel', value: watchSpecs.originalBezel },
                    { label: 'Aftermarket Bezel', value: watchSpecs.aftermarketBezel },
                    { label: 'Dial Material', value: watchSpecs.dialMaterial },
                    { label: 'Dial Color', value: watchSpecs.dialColor },
                    { label: 'Dial Style', value: watchSpecs.dialStyle },
                    { label: 'Dial Type', value: watchSpecs.dialType },
                    { label: 'Hour Markers', value: watchSpecs.dialHourMarkers },
                    { label: 'Original Dial', value: watchSpecs.originalDial },
                    { label: 'Aftermarket Dial', value: watchSpecs.aftermarketDial },
                    { label: 'Skeletal Back', value: watchSpecs.skeletalBack },
                    { label: 'Flip Skeletal Back', value: watchSpecs.flipSkeletalBack },
                    { label: 'Full Skeletal Watch', value: watchSpecs.fullSkeletalWatch },
                  ].filter(spec => formatValue(spec.value) !== null);

                  const bandSpecs = [
                    { label: 'Band Material', value: watchSpecs.bandMaterial },
                    { label: 'Band Link Type', value: watchSpecs.bandLink },
                    { label: 'Band Style', value: watchSpecs.bandStyle },
                    { label: 'Band Size', value: watchSpecs.bandSize },
                    { label: 'Band Length', value: watchSpecs.bandLength },
                    { label: 'Band Size (inches)', value: watchSpecs.bandSizeInches },
                    { label: 'Lug Width', value: watchSpecs.lugWidth },
                    { label: 'Buckle Width', value: watchSpecs.buckleWidth },
                    { label: 'Lug to Lug Length', value: watchSpecs.lugToLugLength },
                    { label: 'Clasp Type', value: watchSpecs.claspType },
                  ].filter(spec => formatValue(spec.value) !== null);

                  const otherSpecs = [
                    { label: 'Gender', value: watchSpecs.gender },
                    { label: 'New/Pre-Owned', value: watchSpecs.isNew ? 'New' : 'Pre-Owned' },
                    { label: 'Rarity', value: watchSpecs.rarity || item.rarity },
                    { label: 'Country of Origin', value: watchSpecs.countryOfOrigin },
                    { label: 'Warranty', value: watchSpecs.warranty },
                    { label: 'Original Packaging', value: watchSpecs.hasOriginalPackaging },
                    { label: 'Diamonds', value: watchSpecs.hasDiamonds },
                  ].filter(spec => formatValue(spec.value) !== null);

                  return (
                    <View>
                      {/* BASIC DESCRIPTION - Always visible */}
                      {basicInfo.length > 0 && (
                        <View style={styles.basicDescriptionSection}>
                          <Text style={styles.basicDescriptionTitle}>Basic Description</Text>
                          {basicInfo.map((spec, index) => (
                            <View key={`basic-${index}`} style={styles.aboutRow}>
                              <Text style={styles.aboutLabel}>{spec.label}</Text>
                              <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* COLLAPSIBLE GROUP: Movement */}
                      {movementSpecs.length > 0 && (
                        <View style={styles.collapsibleGroup}>
                          <TouchableOpacity
                            style={styles.groupHeader}
                            onPress={() => setMovementExpanded(!movementExpanded)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.groupHeaderText}>Movement</Text>
                            <Ionicons
                              name={movementExpanded ? "remove" : "add"}
                              size={20}
                              color="#6A0DAD"
                            />
                          </TouchableOpacity>
                          {movementExpanded && (
                            <View style={styles.groupContent}>
                              {movementSpecs.map((spec, index) => (
                                <View key={`movement-${index}`} style={styles.aboutRow}>
                                  <Text style={styles.aboutLabel}>{spec.label}</Text>
                                  <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}

                      {/* COLLAPSIBLE GROUP: The Case */}
                      {caseSpecs.length > 0 && (
                        <View style={styles.collapsibleGroup}>
                          <TouchableOpacity
                            style={styles.groupHeader}
                            onPress={() => setCaseExpanded(!caseExpanded)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.groupHeaderText}>The Case</Text>
                            <Ionicons
                              name={caseExpanded ? "remove" : "add"}
                              size={20}
                              color="#6A0DAD"
                            />
                          </TouchableOpacity>
                          {caseExpanded && (
                            <View style={styles.groupContent}>
                              {caseSpecs.map((spec, index) => (
                                <View key={`case-${index}`} style={styles.aboutRow}>
                                  <Text style={styles.aboutLabel}>{spec.label}</Text>
                                  <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}

                      {/* COLLAPSIBLE GROUP: Band */}
                      {bandSpecs.length > 0 && (
                        <View style={styles.collapsibleGroup}>
                          <TouchableOpacity
                            style={styles.groupHeader}
                            onPress={() => setBandExpanded(!bandExpanded)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.groupHeaderText}>Band</Text>
                            <Ionicons
                              name={bandExpanded ? "remove" : "add"}
                              size={20}
                              color="#6A0DAD"
                            />
                          </TouchableOpacity>
                          {bandExpanded && (
                            <View style={styles.groupContent}>
                              {bandSpecs.map((spec, index) => (
                                <View key={`band-${index}`} style={styles.aboutRow}>
                                  <Text style={styles.aboutLabel}>{spec.label}</Text>
                                  <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}

                      {/* COLLAPSIBLE GROUP: Other */}
                      {otherSpecs.length > 0 && (
                        <View style={styles.collapsibleGroup}>
                          <TouchableOpacity
                            style={styles.groupHeader}
                            onPress={() => setOtherExpanded(!otherExpanded)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.groupHeaderText}>Other</Text>
                            <Ionicons
                              name={otherExpanded ? "remove" : "add"}
                              size={20}
                              color="#6A0DAD"
                            />
                          </TouchableOpacity>
                          {otherExpanded && (
                            <View style={styles.groupContent}>
                              {otherSpecs.map((spec, index) => (
                                <View key={`other-${index}`} style={styles.aboutRow}>
                                  <Text style={styles.aboutLabel}>{spec.label}</Text>
                                  <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })()}

                {/* Non-watch items with diamond specifications */}
                {!(item.category === '2' || item.tags?.toLowerCase().includes('watch')) && item.diamond_specifications && (() => {
                  try {
                    const diamondSpecs = JSON.parse(item.diamond_specifications);

                    // Helper to format values
                    const formatValue = (value: any) => {
                      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                      if (!value || value === '') return null;
                      return String(value);
                    };

                    // BASIC DESCRIPTION - Always visible at top
                    const basicInfo = [
                      { label: 'Category', value: item.category || 'Not specified' },
                      { label: 'Rarity', value: item.rarity || 'common' },
                      { label: 'Cut', value: diamondSpecs.cut },
                      { label: 'Carat Weight', value: diamondSpecs.carat ? `${diamondSpecs.carat} ct` : null },
                      { label: 'Color', value: diamondSpecs.color },
                      { label: 'Clarity', value: diamondSpecs.clarity },
                    ].filter(spec => formatValue(spec.value) !== null);

                    // COLLAPSIBLE GROUPS
                    const certSourcingSpecs = [
                      { label: 'Certification', value: diamondSpecs.certification },
                      { label: 'Certification Lab', value: diamondSpecs.certificationLab },
                      { label: 'Certification Number', value: diamondSpecs.certificationNumber },
                      { label: 'Ethically Sourced', value: diamondSpecs.ethicallySourced || diamondSpecs.ethically_sourced },
                    ].filter(spec => formatValue(spec.value) !== null);

                    const shippingDetailsSpecs = [
                      { label: 'Shipping Weight', value: item.weight_lbs ? `${item.weight_lbs} lbs` : null },
                      { label: 'Tags', value: item.tags },
                      { label: 'Item Number', value: `#${item.id}` },
                    ].filter(spec => formatValue(spec.value) !== null);

                    return (
                      <View>
                        {/* BASIC DESCRIPTION - Always visible */}
                        {basicInfo.length > 0 && (
                          <View style={styles.basicDescriptionSection}>
                            <Text style={styles.basicDescriptionTitle}>Basic Description</Text>
                            {basicInfo.map((spec, index) => (
                              <View key={`basic-${index}`} style={styles.aboutRow}>
                                <Text style={styles.aboutLabel}>{spec.label}</Text>
                                <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* COLLAPSIBLE GROUP: Certification & Sourcing */}
                        {certSourcingSpecs.length > 0 && (
                          <View style={styles.collapsibleGroup}>
                            <TouchableOpacity
                              style={styles.groupHeader}
                              onPress={() => setDiamondCertExpanded(!diamondCertExpanded)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.groupHeaderText}>Certification & Sourcing</Text>
                              <Ionicons
                                name={diamondCertExpanded ? "remove" : "add"}
                                size={20}
                                color="#6A0DAD"
                              />
                            </TouchableOpacity>
                            {diamondCertExpanded && (
                              <View style={styles.groupContent}>
                                {certSourcingSpecs.map((spec, index) => (
                                  <View key={`cert-${index}`} style={styles.aboutRow}>
                                    <Text style={styles.aboutLabel}>{spec.label}</Text>
                                    <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}

                        {/* COLLAPSIBLE GROUP: Shipping & Details */}
                        {shippingDetailsSpecs.length > 0 && (
                          <View style={styles.collapsibleGroup}>
                            <TouchableOpacity
                              style={styles.groupHeader}
                              onPress={() => setDiamondShippingExpanded(!diamondShippingExpanded)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.groupHeaderText}>Shipping & Details</Text>
                              <Ionicons
                                name={diamondShippingExpanded ? "remove" : "add"}
                                size={20}
                                color="#6A0DAD"
                              />
                            </TouchableOpacity>
                            {diamondShippingExpanded && (
                              <View style={styles.groupContent}>
                                {shippingDetailsSpecs.map((spec, index) => (
                                  <View key={`shipping-${index}`} style={styles.aboutRow}>
                                    <Text style={styles.aboutLabel}>{spec.label}</Text>
                                    <Text style={styles.aboutValue}>{formatValue(spec.value)}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  } catch {
                    return null;
                  }
                })()}

                {/* Non-diamond items: show basic details only */}
                {!(item.category === '2' || item.tags?.toLowerCase().includes('watch')) && !item.diamond_specifications && (
                  <>
                    <View style={styles.aboutRow}>
                      <Text style={styles.aboutLabel}>Category</Text>
                      <Text style={styles.aboutValue}>{item.category || 'Not specified'}</Text>
                    </View>
                    <View style={styles.aboutRow}>
                      <Text style={styles.aboutLabel}>Rarity</Text>
                      <Text style={styles.aboutValue}>{item.rarity || 'common'}</Text>
                    </View>
                    {!!item.weight_lbs && (
                      <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>Shipping Weight</Text>
                        <Text style={styles.aboutValue}>{item.weight_lbs} lbs</Text>
                      </View>
                    )}
                    {!!item.tags && (
                      <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>Tags</Text>
                        <Text style={styles.aboutValue}>{item.tags}</Text>
                      </View>
                    )}
                  </>
                )}

                {/* Common fields for all items (only show Item Number if no diamond specs) */}
                {!!item.listedAt && (
                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutLabel}>Listed</Text>
                    <Text style={styles.aboutValue}>
                      {new Date(item.listedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}

                {/* Only show relist count if NOT a price drop conversion */}
                {(item.relist_count ?? 0) > 0 && !(item.original_price && item.buy_it_now && item.original_price > item.buy_it_now) && (
                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutLabel}>Times Relisted</Text>
                    <Text style={styles.aboutValue}>{item.relist_count}</Text>
                  </View>
                )}

                {/* Only show Item Number here if NOT a diamond (diamonds have it in their collapsible group) */}
                {!item.diamond_specifications && (
                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutLabel}>Item Number</Text>
                    <Text style={styles.aboutValue}>#{item.id}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.seeMoreText}>See product details</Text>
            )}
          </TouchableOpacity>

          {/* Sell a Similar Item Link */}
          <TouchableOpacity
            style={styles.sellSimilarCard}
            onPress={handleSellSimilar}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag-outline" size={20} color="#FF6B35" />
            <Text style={styles.sellSimilarText}>Have a similar item? Get item value here</Text>
            <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>

          {!!(item.original_price && item.price && item.original_price > item.price) && (
  <View style={styles.ribbon}>
    <Text style={styles.ribbonText}>
      {Math.round(((item.original_price - item.price) / item.original_price) * 100)}% OFF
    </Text>
  </View>
)}


          {/* Recent Bids / Bid History */}
          {item.recent_bids && item.recent_bids.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {isAuctionEnded() ? 'Bid History' : 'Recent Bids'}
                </Text>
                <TouchableOpacity onPress={() => setShowRecentBidsHelp(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="help-circle" size={20} color="#6A0DAD" />
                </TouchableOpacity>
              </View>
              {item.recent_bids.map((bid, index) => (
                <Text key={`${bid.user_id}-${bid.timestamp}-${index}`} style={isAuctionEnded() ? styles.bidRowEnded : styles.bidRow}>
                  🏷️ ${bid.amount} by {bid.username || `User #${bid.user_id}`} — {formatDistanceToNow(new Date(bid.timestamp), { addSuffix: true })}
                </Text>
              ))}
            </View>
          )}

          {/* Only show "You're winning!" badge for active auctions */}
          {item.is_highest_bidder && !isAuctionEnded() && (
            <Text style={styles.badge}>🥇 You&apos;re winning!</Text>
          )}

          {/* Enhanced Bid Input - Only show for auction items and if auction hasn't ended */}
          {!item.buy_it_now && !isAuctionEnded() && (
            <View style={styles.bidCard}>
              <View style={styles.bidCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="hammer" size={20} color="#6A0DAD" />
                  <Text style={styles.bidCardTitle}>Place Your Bid</Text>
                </View>
                <TouchableOpacity onPress={() => setShowBiddingHelp(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="help-circle" size={20} color="#6A0DAD" />
                </TouchableOpacity>
              </View>

              {!!item.min_next_bid && (
                <Text style={styles.minBidInfo}>
                  Minimum bid: <Text style={styles.minBidAmount}>${item.min_next_bid.toLocaleString()}</Text>
                </Text>
              )}

              <View style={styles.bidInputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  placeholder={item.min_next_bid ? item.min_next_bid.toString() : "Enter amount"}
                  keyboardType="numeric"
                  style={styles.bidInput}
                  value={bidAmount}
                  onChangeText={(text) => {
                    setBidAmount(text);
                  }}
                />
                {!!bidAmount && !!item.min_next_bid && (
                  <Ionicons
                    name={Number.parseFloat(bidAmount) >= item.min_next_bid ? "checkmark-circle" : "close-circle"}
                    size={24}
                    color={Number.parseFloat(bidAmount) >= item.min_next_bid ? "#2E7D32" : "#D32F2F"}
                  />
                )}
              </View>

              {!!bidAmount && !!item.min_next_bid && Number.parseFloat(bidAmount) < item.min_next_bid && (
                <Text style={styles.bidError}>
                  ⚠️ Bid must be at least ${item.min_next_bid.toLocaleString()}
                </Text>
              )}

              {/* Quick Bid Buttons */}
              {!!item.min_next_bid && (
                <View style={styles.quickBidRow}>
                  <Text style={styles.quickBidLabel}>Quick bid:</Text>
                  <TouchableOpacity
                    style={styles.quickBidButton}
                    onPress={() => setBidAmount((item.min_next_bid ?? 0).toString())}
                  >
                    <Text style={styles.quickBidText}>${(item.min_next_bid ?? 0).toLocaleString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBidButton}
                    onPress={() => {
                      const minBid = item.min_next_bid ?? 0;
                      const increment = minBid < 1000 ? 100 : 1000;
                      setBidAmount((minBid + increment).toString());
                    }}
                  >
                    <Text style={styles.quickBidText}>
                      +{(item.min_next_bid ?? 0) < 1000 ? '$100' : '$1K'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBidButton}
                    onPress={() => {
                      const minBid = item.min_next_bid ?? 0;
                      const increment = minBid < 1000 ? 500 : 5000;
                      setBidAmount((minBid + increment).toString());
                    }}
                  >
                    <Text style={styles.quickBidText}>
                      +{(item.min_next_bid ?? 0) < 1000 ? '$500' : '$5K'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons - Redesigned Full Width */}
          {!isAuctionEnded() && !item.is_sold && item.status !== 'sold' ? (
            <View style={styles.actionButtonsContainer}>
              {/* Primary Action - Place Bid OR Buy It Now */}
              {!item.buy_it_now ? (
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleBidSubmit}
                  activeOpacity={0.8}
                >
                  <Ionicons name="hammer" size={20} color="#FFF" />
                  <Text style={styles.primaryActionText}>Place Bid</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.buyNowButton}
                  onPress={handleBuyNow}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cart" size={20} color="#FFF" />
                  <Text style={styles.primaryActionText}>Buy It Now</Text>
                </TouchableOpacity>
              )}

              {/* Add to Cart - Only for Buy It Now items */}
              {!!item.buy_it_now && (
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={handleAddToCart}
                  activeOpacity={0.8}
                >
                <Ionicons name="bag-add-outline" size={20} color="#6A0DAD" />
                <Text style={styles.secondaryActionText}>Add to Cart</Text>
              </TouchableOpacity>
            )}

            {/* Secondary Actions Row */}
            <View style={styles.secondaryActionsRow}>
              {/* Favorite - Hide if already favorited */}
              {!item.is_favorited && (
                <TouchableOpacity 
                  style={styles.iconActionButton}
                  onPress={handleFavorite}
                  activeOpacity={0.8}
                >
                  <Ionicons name="heart-outline" size={22} color="#E53E3E" />
                  <Text style={styles.iconActionText}>Favorite</Text>
                </TouchableOpacity>
              )}

              {/* Share */}
              <TouchableOpacity
                style={styles.iconActionButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={22} color="#6A0DAD" />
                <Text style={styles.iconActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          ) : (
            <View style={styles.auctionEndedContainer}>
              {/* Show winner celebration if user won */}
              {item.is_highest_bidder ? (
                <>
                  <Ionicons name="trophy" size={56} color="#FFD700" />
                  <Text style={styles.winnerTitle}>🎉 Congratulations! You Won! 🎉</Text>
                  <View style={styles.finalBidSection}>
                    <Text style={styles.finalBidLabel}>Winning Bid</Text>
                    <Text style={styles.finalBidValue}>${item.highest_bid?.toLocaleString()}</Text>
                    {(!item.reserve_price || (item.highest_bid && item.highest_bid >= item.reserve_price)) && (
                      <View style={styles.soldBadge}>
                        <Text style={styles.soldBadgeText}>SOLD</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.winnerMessage}>
                    The seller will contact you shortly to arrange payment and shipping.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={56} color="#718096" />
                  <Text style={styles.auctionEndedTitle}>Auction Ended</Text>

                  {/* Show final bid result */}
                  {item.highest_bid && item.highest_bid > 0 ? (
                    <View style={styles.finalBidSection}>
                      <Text style={styles.finalBidLabel}>Final Bid</Text>
                      <Text style={styles.finalBidValue}>${item.highest_bid.toLocaleString()}</Text>
                      {item.reserve_price && item.highest_bid >= item.reserve_price ? (
                        <View style={styles.soldBadge}>
                          <Text style={styles.soldBadgeText}>SOLD</Text>
                        </View>
                      ) : item.reserve_price && item.highest_bid < item.reserve_price ? (
                        <View style={styles.reserveNotMetBadge}>
                          <Text style={styles.reserveNotMetText}>RESERVE NOT MET</Text>
                        </View>
                      ) : (
                        <View style={styles.soldBadge}>
                          <Text style={styles.soldBadgeText}>SOLD</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.auctionEndedText}>
                      No bids were placed on this auction.
                    </Text>
                  )}

                  <Text style={styles.auctionEndedSubtext}>
                    This auction is no longer available for bidding.
                  </Text>
                </>
              )}
            </View>
          )}

        </View>
        {/* End contentContainer */}

      {showGoatBah && (
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <GoatFlip trigger={showGoatBah} mood="Celebrate" />
          <Text style={{ fontSize: 18, marginTop: 8 }}>🐐 GOAT CONFIRMED!</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.feeBreakdown} 
        onPress={() => setShowCostModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.feeHeader}>
          <Text style={styles.feeTitle}>💰 Cost Breakdown</Text>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>
            {item.buy_it_now ? 'Buy It Now Price' : 'Current Bid'}
          </Text>
          <Text style={styles.feeValue}>
  {displayPrice === null ? 'Price not available' : `$${displayPrice.toFixed(2)}`}
</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>+ Shipping (buyer pays)</Text>
          <Text style={styles.feeNote}>Calculated at checkout</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>+ Insurance (optional)</Text>
          <Text style={styles.feeNote}>Calculated at checkout</Text>
        </View>
        <View style={styles.feeDivider} />
        <View style={styles.feeRow}>
          <Text style={styles.feeTotalLabel}>You Pay</Text>
          <Text style={styles.feeTotalValue}>
  {displayPrice === null ? 'Price not available' : `$${displayPrice.toFixed(2)}+`}
</Text>
        </View>
        <Text style={styles.feeDisclaimer}>
          💡 Sellers earn {item.seller?.is_premium ? '92%' : '89%'} after BidGoat fees
        </Text>
        <Text style={styles.tapToLearnMore}>Tap to learn more</Text>
      </TouchableOpacity>

      {/* Item Condition */}
      {!!item.condition && item.condition !== 'Not specified' && (
        <View style={styles.conditionCard}>
          <Text style={styles.conditionLabel}>Condition</Text>
          <Text style={styles.conditionValue}>{item.condition}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.shippingSection} 
        onPress={() => setShowShippingModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.shippingSectionHeader}>
          <Text style={styles.sectionTitle}>🚚 Shipping & Delivery</Text>
          <Ionicons name="information-circle" size={20} color="#6A0DAD" />
        </View>
        <Text style={styles.shippingText}>📦 Shipping calculated at checkout based on weight ({item.weight_lbs || 1} lbs)</Text>
        <Text style={styles.shippingText}>🔒 Buyer Protection included</Text>
        <Text style={styles.shippingText}>💳 Payments: Credit Card, PayPal, Apple Pay</Text>
        <Text style={styles.tapToLearnMore}>Tap for carrier options & details</Text>
      </TouchableOpacity>



      <View style={styles.similarSection}>
  <View style={styles.similarHeader}>
    <View style={styles.similarTitleRow}>
      <Ionicons name="sparkles" size={24} color="#6A0DAD" />
      <Text style={styles.similarSectionTitle}>Similar Items You&apos;ll Love</Text>
    </View>
    <Text style={styles.similarSubtitle}>
      {similarItems.length > 0 ? `${similarItems.length} items` : 'Curated just for you'}
    </Text>
  </View>

  {renderSimilarItemsContent()}
</View>

        </ScrollView>

        {/* Price Adjustment Modal */}
        <Modal
          visible={showPriceAdjustment}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPriceAdjustment(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adjust Price</Text>
              <Text style={styles.modalSubtitle}>
                Lower your price to attract more buyers
              </Text>

              {item?.original_price && item.original_price > item.price && (
                <View style={styles.discountInfo}>
                  <Text style={styles.discountLabel}>Original Price: ${item.original_price}</Text>
                  <Text style={styles.discountLabel}>Current Price: ${item.price}</Text>
                  <Text style={styles.discountSavings}>
                    Already discounted {Math.round(((item.original_price - item.price) / item.original_price) * 100)}%
                  </Text>
                </View>
              )}

              <TextInput
                style={styles.priceInput}
                placeholder="Enter new price"
                keyboardType="decimal-pad"
                value={newPrice}
                onChangeText={setNewPrice}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowPriceAdjustment(false);
                    setNewPrice('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handlePriceAdjustment}
                >
                  <Text style={styles.confirmButtonText}>Update Price</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Cost Breakdown Modal */}
        <Modal
          visible={showCostModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💰 Cost Breakdown</Text>
                <TouchableOpacity onPress={() => setShowCostModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* Item Price */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Your Purchase</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{item.buy_it_now ? 'Buy It Now Price' : 'Current Bid'}</Text>
                    <Text style={styles.modalValue}>${displayPrice.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Shipping */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Shipping Costs</Text>
                  <Text style={styles.modalDescription}>
                    Shipping is calculated at checkout based on item weight ({item.weight_lbs || 1} lbs) and your delivery address.
                  </Text>
                  <View style={styles.weightTable}>
                    <Text style={styles.tableHeader}>Weight-Based Rates (USPS Priority)</Text>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>0-1 lbs</Text>
                      <Text style={styles.tableCell}>$8-$12</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>1-3 lbs</Text>
                      <Text style={styles.tableCell}>$12-$18</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>3-5 lbs</Text>
                      <Text style={styles.tableCell}>$18-$25</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>5+ lbs</Text>
                      <Text style={styles.tableCell}>$25+</Text>
                    </View>
                  </View>
                </View>

                {/* Insurance */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Insurance (Optional)</Text>
                  <Text style={styles.modalDescription}>
                    Protect your purchase with shipping insurance. Recommended for high-value items.
                  </Text>
                  <View style={styles.insuranceInfo}>
                    <Ionicons name="shield-checkmark" size={20} color="#48BB78" />
                    <Text style={styles.insuranceText}>Covers loss, theft, or damage during transit</Text>
                  </View>
                </View>

                {/* Seller Fees Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>How Sellers Are Paid</Text>
                  <Text style={styles.modalDescription}>
                    {item.seller?.is_premium ? (
                      <>Premium sellers keep <Text style={styles.highlightText}>92%</Text> of the sale price (8% total fees: 5% commission + 3% payment processing).</>
                    ) : (
                      <>Regular sellers keep <Text style={styles.highlightText}>89%</Text> of the sale price (11% total fees: 8% commission + 3% payment processing).</>
                    )}
                  </Text>
                  <View style={styles.feeExample}>
                    <Text style={styles.feeExampleTitle}>Example for ${displayPrice.toFixed(2)} sale:</Text>
                    <View style={styles.feeExampleRow}>
                      <Text style={styles.feeExampleLabel}>Sale Price</Text>
                      <Text style={styles.feeExampleValue}>${displayPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.feeExampleRow}>
                      <Text style={styles.feeExampleLabel}>BidGoat Fees</Text>
                      <Text style={styles.feeExampleValue}>
                        -${(displayPrice * (item.seller?.is_premium ? 0.08 : 0.11)).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.feeDivider} />
                    <View style={styles.feeExampleRow}>
                      <Text style={styles.feeExampleTotal}>Seller Receives</Text>
                      <Text style={styles.feeExampleTotal}>
                        ${(displayPrice * (item.seller?.is_premium ? 0.92 : 0.89)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Accepted Payments</Text>
                  <View style={styles.paymentMethods}>
                    <View style={styles.paymentBadge}>
                      <Ionicons name="card" size={20} color="#635BFF" />
                      <Text style={styles.paymentText}>Credit/Debit</Text>
                    </View>
                    <View style={styles.paymentBadge}>
                      <Ionicons name="logo-paypal" size={20} color="#003087" />
                      <Text style={styles.paymentText}>PayPal</Text>
                    </View>
                    <View style={styles.paymentBadge}>
                      <Ionicons name="logo-apple" size={20} color="#000" />
                      <Text style={styles.paymentText}>Apple Pay</Text>
                    </View>
                  </View>
                  <Text style={styles.securePayment}>
                    🔒 All payments are processed securely via Stripe
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Shipping Modal */}
        <Modal
          visible={showShippingModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowShippingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🚚 Shipping & Delivery</Text>
                <TouchableOpacity onPress={() => setShowShippingModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* Carriers */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Available Carriers</Text>
                  <Text style={styles.modalDescription}>
                    Sellers ship via trusted carriers with tracking and insurance options.
                  </Text>
                  <View style={styles.carrierList}>
                    <View style={styles.carrierItem}>
                      <Ionicons name="mail" size={24} color="#004B87" />
                      <View style={styles.carrierInfo}>
                        <Text style={styles.carrierName}>USPS Priority Mail</Text>
                        <Text style={styles.carrierDelivery}>2-3 business days</Text>
                      </View>
                    </View>
                    <View style={styles.carrierItem}>
                      <Ionicons name="airplane" size={24} color="#FF6200" />
                      <View style={styles.carrierInfo}>
                        <Text style={styles.carrierName}>FedEx</Text>
                        <Text style={styles.carrierDelivery}>1-3 business days</Text>
                      </View>
                    </View>
                    <View style={styles.carrierItem}>
                      <Ionicons name="cube" size={24} color="#351C15" />
                      <View style={styles.carrierInfo}>
                        <Text style={styles.carrierName}>UPS Ground</Text>
                        <Text style={styles.carrierDelivery}>2-5 business days</Text>
                      </View>
                    </View>
                    <View style={styles.carrierItem}>
                      <Ionicons name="flash" size={24} color="#FFCC00" />
                      <View style={styles.carrierInfo}>
                        <Text style={styles.carrierName}>DHL Express</Text>
                        <Text style={styles.carrierDelivery}>1-2 business days</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Item Weight */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>This Item</Text>
                  <View style={styles.itemWeightCard}>
                    <Ionicons name="cube-outline" size={32} color="#6A0DAD" />
                    <Text style={styles.itemWeightText}>
                      Weight: <Text style={styles.itemWeightValue}>{item.weight_lbs || 1} lbs</Text>
                    </Text>
                  </View>
                </View>

                {/* Buyer Protection */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Buyer Protection</Text>
                  <View style={styles.protectionList}>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#48BB78" />
                      <Text style={styles.protectionText}>Full refund if item not as described</Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#48BB78" />
                      <Text style={styles.protectionText}>Coverage for lost or damaged shipments</Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#48BB78" />
                      <Text style={styles.protectionText}>Real-time tracking updates</Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#48BB78" />
                      <Text style={styles.protectionText}>24/7 customer support</Text>
                    </View>
                  </View>
                </View>

                {/* International Shipping */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>International Shipping</Text>
                  <Text style={styles.modalDescription}>
                    Most sellers ship within the US only. International shipping availability varies by seller. Contact seller directly for international options.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Bidding Help Modal */}
        <Modal
          visible={showBiddingHelp}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBiddingHelp(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔨 How Bidding Works</Text>
                <TouchableOpacity onPress={() => setShowBiddingHelp(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Minimum Bid</Text>
                  <Text style={styles.modalDescription}>
                    You must bid at least the minimum shown. This ensures fair increments between bids.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Winning</Text>
                  <Text style={styles.modalDescription}>
                    The highest bidder when the auction ends wins the item. You will be notified if someone outbids you.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Payment</Text>
                  <Text style={styles.modalDescription}>
                    If you win, you will receive payment instructions via email. Complete payment within 48 hours to secure your item.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Bid Increments</Text>
                  <Text style={styles.modalDescription}>
                    Bids increase automatically based on the current price. This keeps auctions competitive and fair for all bidders.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Recent Bids Help Modal */}
        <Modal
          visible={showRecentBidsHelp}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRecentBidsHelp(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📊 Recent Bids</Text>
                <TouchableOpacity onPress={() => setShowRecentBidsHelp(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>What You See</Text>
                  <Text style={styles.modalDescription}>
                    This shows the most recent bids on this item, including the bid amount, username, and when the bid was placed.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Your Bids</Text>
                  <Text style={styles.modalDescription}>
                    If you see your username here, you&#39;ve placed a bid. The top bid is currently winning.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Staying Informed</Text>
                  <Text style={styles.modalDescription}>
                    Watch this list to see bidding activity. If you are outbid, you will receive a notification and can place a higher bid.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Listing Type Selection Modal */}
        <Modal
          visible={showListingTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowListingTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>How would you like to list it?</Text>
                <TouchableOpacity onPress={() => setShowListingTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.listingTypeContainer}>
                {/* Classic Auction */}
                <TouchableOpacity
                  style={styles.listingTypeOption}
                  onPress={() => {
                    setShowListingTypeModal(false);
                    routeToListingScreen('auction');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.listingTypeContent}>
                    <Ionicons name="hammer" size={28} color="#6A0DAD" />
                    <Text style={styles.listingTypeTitle}>Create a Classic Auction</Text>
                    <Text style={styles.listingTypeDescription}>
                      Start bidding at your price. Highest bid wins when auction ends.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowAuctionHelp(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="help-circle" size={24} color="#6A0DAD" />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Buy It Now */}
                <TouchableOpacity
                  style={styles.listingTypeOption}
                  onPress={() => {
                    setShowListingTypeModal(false);
                    routeToListingScreen('buy_it_now');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.listingTypeContent}>
                    <Ionicons name="cart" size={28} color="#FF6B35" />
                    <Text style={styles.listingTypeTitle}>Buy It Now</Text>
                    <Text style={styles.listingTypeDescription}>
                      Set a fixed price. Buyers can purchase instantly without bidding.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowBuyItNowHelp(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="help-circle" size={24} color="#FF6B35" />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Must Sell */}
                <TouchableOpacity
                  style={styles.listingTypeOption}
                  onPress={() => {
                    setShowListingTypeModal(false);
                    routeToListingScreen('must_sell');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.listingTypeContent}>
                    <Ionicons name="flash" size={28} color="#E53E3E" />
                    <Text style={styles.listingTypeTitle}>Must Sell</Text>
                    <Text style={styles.listingTypeDescription}>
                      No reserve price. Highest bid wins regardless of amount.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowMustSellHelp(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="help-circle" size={24} color="#E53E3E" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Auction Help Modal */}
        <Modal
          visible={showAuctionHelp}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAuctionHelp(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔨 Classic Auction</Text>
                <TouchableOpacity onPress={() => setShowAuctionHelp(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>How It Works</Text>
                  <Text style={styles.modalDescription}>
                    Set a starting bid price and auction duration. Buyers compete by placing higher bids. The highest bidder when the auction ends wins the item.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Reserve Price (Optional)</Text>
                  <Text style={styles.modalDescription}>
                    Set a minimum price you are willing to accept. If bids don&#39;t reach this amount, you are not obligated to sell.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Best For</Text>
                  <Text style={styles.modalDescription}>
                    Rare or unique items where competitive bidding may drive the price higher than a fixed price.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Buy It Now Help Modal */}
        <Modal
          visible={showBuyItNowHelp}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBuyItNowHelp(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>⚡ Buy It Now</Text>
                <TouchableOpacity onPress={() => setShowBuyItNowHelp(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>How It Works</Text>
                  <Text style={styles.modalDescription}>
                    Set a fixed price and buyers can purchase instantly without waiting for an auction to end. No bidding wars - immediate sale.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Advantages</Text>
                  <Text style={styles.modalDescription}>
                    • Faster sales - no waiting for auction to end{'\n'}
                    • Predictable pricing{'\n'}
                    • Attracts buyers who want immediate purchase
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Best For</Text>
                  <Text style={styles.modalDescription}>
                    Items with established market values where you know exactly what price you want.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Must Sell Help Modal */}
        <Modal
          visible={showMustSellHelp}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMustSellHelp(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔥 Must Sell</Text>
                <TouchableOpacity onPress={() => setShowMustSellHelp(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>How It Works</Text>
                  <Text style={styles.modalDescription}>
                    No reserve price means you MUST sell to the highest bidder, regardless of the final bid amount. This creates urgency and attracts more bidders.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Benefits</Text>
                  <Text style={styles.modalDescription}>
                    • Attracts more bidders (no risk of reserve not met){'\n'}
                    • Creates excitement and urgency{'\n'}
                    • Guaranteed sale{'\n'}
                    • Often results in competitive bidding
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Caution</Text>
                  <Text style={styles.modalDescription}>
                    You must honor the sale even if the winning bid is lower than expected. Only use this if you&#39;re willing to accept any final price.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>


  )

}



const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fffef8',
  },
  image: {
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
     marginVertical: 8,
    marginBottom: 4,
    color: '#2d3748',
  },
 floatingCart: {
  position: 'absolute',
  top: 48, // adjust for SafeArea / StatusBar
  right: 16,
  zIndex: 999,
  backgroundColor: '#fff',
  padding: 8,
  borderRadius: 24,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 4,
  flexDirection: 'row',
  alignItems: 'center',
},
cartBadge: {
  marginLeft: 6,
  fontSize: 14,
  fontWeight: 'bold',
  color: '#6A0DAD',
},

  arrowCircle: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#fff',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 5,
  marginHorizontal: 8,
},

carouselImage: {
  width: 200,
  height: 200,
  borderRadius: 8,
  marginHorizontal: 8,
},

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  additionalImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  mustSellTease: {
  fontSize: 14,
  color: '#D97706', // warm amber
  fontWeight: '600',
  marginTop: 8,
  marginBottom: 12,
},
  highestBid: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#2f855a', // confident green
  },
  bidRow: {
    fontSize: 14,
    color: '#4a5568', // muted gray
    marginBottom: 4,
    marginVertical: 2,
  },
  bidRowEnded: {
    fontSize: 14,
    color: '#A0AEC0', // lighter gray for historical bids
    marginBottom: 4,
    marginVertical: 2,
  },
  badge: {
    backgroundColor: '#ecc94b', // gold-ish
    padding: 6,
    borderRadius: 4,
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a202c',
  },
  section: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d3748',
  },
  feeBreakdown: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD580',
  },
  feeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  feeLabel: {
    fontSize: 15,
    color: '#4A5568',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  feeNote: {
    fontSize: 13,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  feeDivider: {
    height: 1,
    backgroundColor: '#FFD580',
    marginVertical: 8,
  },
  feeTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  feeTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },
  feeDisclaimer: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    fontStyle: 'italic',
  },
  similarImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonGroup: {
  marginTop: 24,
  marginBottom: 32,
  flexDirection: 'row',
  alignItems: 'center',
    flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginVertical: 12,
},
  arrowButton: {
    padding: 8,
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    marginHorizontal: 6,
  },
  arrowText: {
    fontSize: 18,
    color: '#2d3748',
    fontWeight: '700',
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbnailWrapper: {
  marginRight: 8,
  borderRadius: 8,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#e2e8f0',
},
   thumbActive: {
    borderColor: '#6A0DAD',
    borderWidth: 2,
  },
  actionButton: {
  width: '90%',
  paddingVertical: 14,
  paddingHorizontal: 24,
  marginVertical: 8,
  borderRadius: 32,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  flexBasis: '48%',
  marginBottom: 8,
},
bidButton: {
  backgroundColor: '#4b3f72',
},
buyButton: {
  backgroundColor: '#d69e2e',
},
cartButton: {
  backgroundColor: '#2c7a7b',
},
favoriteButton: {
  backgroundColor: '#e53e3e',
},
// New modern styles
imageGalleryContainer: {
  position: 'relative',
  backgroundColor: '#fff',
},
mainImage: {
  width: '100%',
  height: 400,
  resizeMode: 'cover',
},
soldBannerOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  pointerEvents: 'none',
},
soldBannerDiagonal: {
  transform: [{ rotate: '-15deg' }],
  backgroundColor: '#48BB78',
  paddingHorizontal: 60,
  paddingVertical: 20,
  borderRadius: 8,
  borderWidth: 4,
  borderColor: '#FFF',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
  elevation: 10,
},
soldBannerText: {
  fontSize: 42,
  fontWeight: '900',
  color: '#FFF',
  letterSpacing: 4,
  textShadowColor: 'rgba(0, 0, 0, 0.5)',
  textShadowOffset: { width: 2, height: 2 },
  textShadowRadius: 4,
},
thumbnailScroll: {
  backgroundColor: '#fff',
  paddingVertical: 12,
},
thumbnail: {
  width: 60,
  height: 60,
  borderRadius: 8,
  overflow: 'hidden',
  borderWidth: 2,
  borderColor: 'transparent',
},
thumbnailActive: {
  borderColor: '#6A0DAD',
},
thumbnailImage: {
  width: '100%',
  height: '100%',
},
backButton: {
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: 'rgba(255,255,255,0.9)',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
},
backButtonText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2d3748',
},
contentContainer: {
  padding: 16,
  backgroundColor: '#f8f9fa',
},
headerSection: {
  marginBottom: 16,
},
itemTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: '#1a202c',
  marginBottom: 8,
},
categoryBadge: {
  alignSelf: 'flex-start',
  backgroundColor: '#e2e8f0',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
},
categoryText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#4a5568',
},
priceSection: {
  flexDirection: 'row',
  gap: 12,
  marginBottom: 16,
},
priceCard: {
  flex: 1,
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#4299e1',
},
buyNowCard: {
  borderColor: '#6A0DAD',
  backgroundColor: '#f0e6ff',
},
priceLabel: {
  fontSize: 12,
  color: '#718096',
  marginBottom: 4,
  textTransform: 'uppercase',
  fontWeight: '600',
},
  ribbon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E53935', // red theme
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ribbonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
priceValue: {
  fontSize: 24,
  fontWeight: '700',
  color: '#4299e1',
},
buyNowPrice: {
  color: '#6A0DAD',
},
originalPrice: {
  fontSize: 14,
  color: '#999',
  textDecorationLine: 'line-through',
  marginTop: 8,
},
// Price Drop Deal Card
priceDropDealCard: {
  backgroundColor: '#FFF5F0',
  padding: 20,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 2,
  borderColor: '#FF6B35',
  gap: 16,
},
dealCardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
dealCardTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#FF6B35',
},
dealCardText: {
  fontSize: 15,
  color: '#4A5568',
  lineHeight: 22,
},
priceComparison: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-around',
  backgroundColor: '#FFF',
  padding: 16,
  borderRadius: 10,
  gap: 16,
},
comparisonColumn: {
  alignItems: 'center',
  gap: 4,
},
comparisonLabel: {
  fontSize: 12,
  color: '#718096',
  fontWeight: '600',
  textTransform: 'uppercase',
},
comparisonOld: {
  fontSize: 20,
  fontWeight: '600',
  color: '#999',
  textDecorationLine: 'line-through',
},
comparisonNew: {
  fontSize: 24,
  fontWeight: '700',
  color: '#48BB78',
},
savingsBadgeLarge: {
  backgroundColor: '#48BB78',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
savingsBadgeText: {
  color: '#FFF',
  fontSize: 16,
  fontWeight: '700',
  letterSpacing: 1,
},
urgencyRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
},
urgencyText: {
  fontSize: 14,
  color: '#E65100',
  fontWeight: '600',
  fontStyle: 'italic',
},
// Price Drop Badge - Bottom Left
priceDropBadge: {
  position: 'absolute',
  bottom: 12,
  left: 12,
  backgroundColor: '#FF6B35',
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 6,
  gap: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
},
priceDropBadgeText: {
  fontSize: 11,
  fontWeight: '800',
  color: '#FFF',
  letterSpacing: 0.5,
},
auctionInfoCard: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
},
infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#e2e8f0',
},
infoLabel: {
  fontSize: 14,
  color: '#4a5568',
  fontWeight: '500',
},
infoValue: {
  fontSize: 14,
  color: '#2d3748',
  fontWeight: '600',
},
endTimeText: {
  color: '#c53030',
},
urgentTimeText: {
  color: '#E53E3E',
  fontWeight: 'bold',
  fontSize: 15,
},
highestBidText: {
  color: '#2f855a',
  fontSize: 16,
},
relistInfoCard: {
  backgroundColor: '#fffbeb',
  padding: 12,
  borderRadius: 8,
  marginTop: 8,
  borderLeftWidth: 3,
  borderLeftColor: '#f59e0b',
},
relistLabel: {
  fontSize: 13,
  color: '#92400e',
  fontWeight: '600',
  marginBottom: 4,
},
relistDate: {
  fontSize: 12,
  color: '#78350f',
},
descriptionCard: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#e2e8f0',
},
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
seeMoreText: {
  fontSize: 14,
  color: '#6A0DAD',
  fontWeight: '600',
  marginTop: 8,
},
descriptionText: {
  fontSize: 15,
  color: '#4a5568',
  lineHeight: 22,
  marginTop: 8,
},
aboutCard: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#e2e8f0',
},
sellSimilarCard: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#FFF5F2',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 2,
  borderColor: '#FF6B35',
  gap: 12,
},
sellSimilarText: {
  flex: 1,
  fontSize: 15,
  fontWeight: '600',
  color: '#FF6B35',
},
aboutTable: {
  marginTop: 12,
},
aboutRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#f7fafc',
},
aboutLabel: {
  fontSize: 14,
  color: '#718096',
  fontWeight: '500',
  flex: 1,
},
aboutValue: {
  fontSize: 14,
  color: '#2d3748',
  fontWeight: '600',
  flex: 1,
  textAlign: 'right',
},
specCategoryTitle: {
  fontSize: 12,
  color: '#6A0DAD',
  fontWeight: '700',
  letterSpacing: 0.5,
  marginBottom: 8,
  marginTop: 4,
},
specsCategorySection: {
  marginBottom: 16,
},
specsCategoryTitle: {
  fontSize: 13,
  color: '#6A0DAD',
  fontWeight: '700',
  letterSpacing: 0.8,
  marginBottom: 10,
  marginTop: 8,
  textTransform: 'uppercase',
},
// New collapsible group styles for watch specs
basicDescriptionSection: {
  marginBottom: 20,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
},
basicDescriptionTitle: {
  fontSize: 14,
  color: '#2D3748',
  fontWeight: '600',
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
collapsibleGroup: {
  marginBottom: 12,
  borderRadius: 8,
  backgroundColor: '#F7FAFC',
  overflow: 'hidden',
},
groupHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 14,
  backgroundColor: '#EDF2F7',
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
},
groupHeaderText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#6A0DAD',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
groupContent: {
  padding: 12,
  backgroundColor: '#FFFFFF',
},
buyNowInputContainer: {
  backgroundColor: '#f0e6ff',
  borderRadius: 12,
  padding: 16,
  marginVertical: 12,
  borderWidth: 2,
  borderColor: '#6A0DAD',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
buyNowInputText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#6A0DAD',
},
buyNowInputPrice: {
  fontSize: 24,
  fontWeight: '800',
  color: '#6A0DAD',
},
similarSection: {
  marginTop: 20,
  paddingVertical: 20,
  backgroundColor: '#fff',
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
},
similarHeader: {
  paddingHorizontal: 16,
  marginBottom: 16,
},
similarTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
},
similarSectionTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1a202c',
},
similarSubtitle: {
  fontSize: 13,
  color: '#718096',
},
// Seller Success Card for SOLD relisted items
sellerSuccessCard: {
  backgroundColor: '#F0FDF4',
  padding: 20,
  borderRadius: 12,
  marginTop: 12,
  borderLeftWidth: 4,
  borderLeftColor: '#22C55E',
  gap: 16,
},
successHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
successTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#15803D',
},
successText: {
  fontSize: 15,
  color: '#166534',
  lineHeight: 22,
},
successStats: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  backgroundColor: '#FFF',
  padding: 16,
  borderRadius: 10,
  gap: 16,
},
successStatItem: {
  alignItems: 'center',
  gap: 4,
},
successStatLabel: {
  fontSize: 12,
  color: '#6B7280',
  fontWeight: '600',
  textTransform: 'uppercase',
},
successStatValue: {
  fontSize: 24,
  fontWeight: '700',
  color: '#22C55E',
},
// Seller Recommendation Card for UNSOLD relisted items
sellerRecommendationCard: {
  backgroundColor: '#eff6ff',
  padding: 16,
  borderRadius: 12,
  marginTop: 12,
  borderLeftWidth: 4,
  borderLeftColor: '#3b82f6',
},
recommendationTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1e40af',
  marginBottom: 8,
},
recommendationText: {
  fontSize: 14,
  color: '#1e3a8a',
  marginBottom: 12,
  lineHeight: 20,
},
recommendationList: {
  marginBottom: 16,
},
recommendationItem: {
  fontSize: 13,
  color: '#374151',
  marginBottom: 6,
  lineHeight: 18,
},
adjustPriceButton: {
  backgroundColor: '#3b82f6',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
},
adjustPriceButtonText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '600',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
modalContent: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 400,
},
modalTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1a202c',
  marginBottom: 8,
},
modalSubtitle: {
  fontSize: 14,
  color: '#718096',
  marginBottom: 20,
},
discountInfo: {
  backgroundColor: '#fef3c7',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
},
discountLabel: {
  fontSize: 14,
  color: '#92400e',
  marginBottom: 4,
},
discountSavings: {
  fontSize: 15,
  fontWeight: '700',
  color: '#b45309',
  marginTop: 4,
},
priceInput: {
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
  marginBottom: 20,
},
modalButtons: {
  flexDirection: 'row',
  gap: 12,
},
modalButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: 'center',
},
cancelButton: {
  backgroundColor: '#f3f4f6',
},
confirmButton: {
  backgroundColor: '#3b82f6',
},
cancelButtonText: {
  color: '#374151',
  fontSize: 15,
  fontWeight: '600',
},
confirmButtonText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '600',
  marginLeft: 32,
},
similarItemsList: {
  paddingHorizontal: 16,
},
similarCard: {
  width: 180,
  marginRight: 16,
  backgroundColor: '#fff',
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: '#6A0DAD',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 5,
  borderWidth: 1,
  borderColor: '#f0f0f0',
},
similarImageContainer: {
  position: 'relative',
  width: '100%',
  height: 180,
  backgroundColor: '#f5f5f5',
},
similarCardImage: {
  width: '100%',
  height: '100%',
},
similarBadge: {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: 12,
  padding: 6,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
similarCardContent: {
  padding: 14,
  backgroundColor: '#fff',
},
similarCardTitle: {
  fontSize: 14,
  fontWeight: '600',
  color: '#1a202c',
  marginBottom: 8,
  lineHeight: 18,
  minHeight: 36,
},
similarPriceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
similarCardPrice: {
  fontSize: 18,
  fontWeight: '700',
  color: '#6A0DAD',
},
similarArrow: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#f0e6ff',
  alignItems: 'center',
  justifyContent: 'center',
},
noSimilarContainer: {
  alignItems: 'center',
  paddingVertical: 32,
  paddingHorizontal: 24,
},
noSimilarItems: {
  fontSize: 16,
  fontWeight: '600',
  color: '#4A5568',
  textAlign: 'center',
  marginTop: 12,
  marginBottom: 4,
},
noSimilarSubtext: {
  fontSize: 13,
  color: '#A0AEC0',
  textAlign: 'center',
  fontStyle: 'italic',
},
mustSellBanner: {
  backgroundColor: '#FF4444',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 2,
  borderColor: '#CC0000',
  shadowColor: '#FF4444',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
},
mustSellBannerTitle: {
  fontSize: 18,
  fontWeight: '800',
  color: '#FFFFFF',
  textAlign: 'center',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 1,
},
mustSellBannerSubtitle: {
  fontSize: 14,
  color: '#FFFFFF',
  textAlign: 'center',
  fontWeight: '600',
  opacity: 0.95,
},
highestBidCard: {
  backgroundColor: '#E8F5E9',
  borderColor: '#4CAF50',
  borderWidth: 2,
},
highestBidValue: {
  color: '#2E7D32',
},
startingBidSubtext: {
  fontSize: 12,
  color: '#757575',
  marginTop: 4,
  textAlign: 'center',
},
noBidsText: {
  fontSize: 12,
  color: '#9CA3AF',
  marginTop: 4,
  textAlign: 'center',
  fontStyle: 'italic',
},
// Activity Stats Bar
activityStatsBar: {
  flexDirection: 'row',
  backgroundColor: '#F3E5F5',
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
  gap: 20,
},
endedStatsBar: {
  flexDirection: 'row',
  backgroundColor: '#F7FAFC',
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#E2E8F0',
},
statItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
statText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
},
endedStatText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#718096',
},
// Countdown Timer
countdownCard: {
  backgroundColor: '#E8F5E9',
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
  alignItems: 'center',
},
countdownUrgent: {
  backgroundColor: '#FFEBEE',
},
countdownLabel: {
  fontSize: 16,
  fontWeight: '700',
  color: '#2E7D32',
  marginBottom: 12,
},
countdownNumbers: {
  flexDirection: 'row',
  gap: 12,
},
countdownBlock: {
  alignItems: 'center',
  backgroundColor: '#FFF',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  minWidth: 70,
},
countdownValue: {
  fontSize: 28,
  fontWeight: '700',
  color: '#2E7D32',
},
countdownUnit: {
  fontSize: 12,
  color: '#666',
  marginTop: 4,
},
// Minimum Next Bid
minBidCard: {
  backgroundColor: '#FFF3E0',
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
  borderLeftWidth: 4,
  borderLeftColor: '#FF6B35',
},
minBidLabel: {
  fontSize: 14,
  color: '#E65100',
  fontWeight: '600',
  marginBottom: 4,
},
minBidValue: {
  fontSize: 24,
  fontWeight: '700',
  color: '#E65100',
  marginBottom: 4,
},
minBidHint: {
  fontSize: 12,
  color: '#BF360C',
  fontStyle: 'italic',
},
// Item Condition
conditionCard: {
  backgroundColor: '#E3F2FD',
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
conditionLabel: {
  fontSize: 14,
  color: '#1565C0',
  fontWeight: '600',
},
conditionValue: {
  fontSize: 16,
  color: '#0D47A1',
  fontWeight: '700',
},
// Seller Rating
sellerRatingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginVertical: 8,
},
starsContainer: {
  flexDirection: 'row',
  gap: 2,
},
ratingText: {
  fontSize: 14,
  color: '#333',
  fontWeight: '600',
},
positiveText: {
  fontSize: 13,
  color: '#2E7D32',
  fontWeight: '600',
  marginBottom: 4,
},
// Enhanced Bid Input Card
bidCard: {
  backgroundColor: '#FFF',
  padding: 20,
  borderRadius: 16,
  marginBottom: 20,
  borderWidth: 2,
  borderColor: '#6A0DAD',
  shadowColor: '#6A0DAD',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
},
bidCardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
},
bidCardTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#6A0DAD',
},
minBidInfo: {
  fontSize: 14,
  color: '#666',
  marginBottom: 16,
},
minBidAmount: {
  fontWeight: '700',
  color: '#6A0DAD',
  fontSize: 16,
},
bidInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F8F8F8',
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#E0E0E0',
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginBottom: 8,
},
dollarSign: {
  fontSize: 24,
  fontWeight: '700',
  color: '#6A0DAD',
  marginRight: 8,
},
bidInput: {
  flex: 1,
  fontSize: 24,
  fontWeight: '600',
  color: '#1a202c',
  padding: 0,
},
bidError: {
  fontSize: 13,
  color: '#D32F2F',
  marginBottom: 12,
  fontWeight: '600',
},
quickBidRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginTop: 8,
},
quickBidLabel: {
  fontSize: 14,
  color: '#666',
  fontWeight: '600',
  marginRight: 4,
},
quickBidButton: {
  backgroundColor: '#F0E6FF',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#6A0DAD',
},
quickBidText: {
  fontSize: 13,
  fontWeight: '700',
  color: '#6A0DAD',
},
// Fee Header
feeHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
},
tapToLearnMore: {
  fontSize: 12,
  color: '#6A0DAD',
  fontWeight: '600',
  textAlign: 'center',
  marginTop: 8,
},
// Shipping Section
shippingSection: {
  marginTop: 20,
  padding: 16,
  backgroundColor: '#F0E6FF',
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#6A0DAD',
},
shippingSectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
},
shippingText: {
  fontSize: 14,
  color: '#4A5568',
  marginBottom: 8,
},
// Modal Styles
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
modalScrollView: {
  maxHeight: 500,
},
modalSection: {
  marginBottom: 24,
},
modalSectionTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1A202C',
  marginBottom: 8,
},
modalDescription: {
  fontSize: 14,
  color: '#4A5568',
  lineHeight: 20,
  marginBottom: 12,
},
modalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 8,
},
modalLabel: {
  fontSize: 14,
  color: '#718096',
},
modalValue: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1A202C',
},
// Weight Table
weightTable: {
  backgroundColor: '#F7FAFC',
  borderRadius: 8,
  padding: 12,
  marginTop: 8,
},
tableHeader: {
  fontSize: 13,
  fontWeight: '700',
  color: '#2D3748',
  marginBottom: 8,
},
tableRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 6,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
},
tableCell: {
  fontSize: 14,
  color: '#4A5568',
},
// Insurance Info
insuranceInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#F0FFF4',
  padding: 12,
  borderRadius: 8,
},
insuranceText: {
  flex: 1,
  fontSize: 13,
  color: '#22543D',
},
// Fee Example
feeExample: {
  backgroundColor: '#F7FAFC',
  padding: 12,
  borderRadius: 8,
  marginTop: 8,
},
feeExampleTitle: {
  fontSize: 14,
  fontWeight: '700',
  color: '#2D3748',
  marginBottom: 8,
},
feeExampleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 4,
},
feeExampleLabel: {
  fontSize: 13,
  color: '#718096',
},
feeExampleValue: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2D3748',
},
feeExampleTotal: {
  fontSize: 15,
  fontWeight: '700',
  color: '#1A202C',
},
highlightText: {
  fontWeight: '700',
  color: '#48BB78',
},
// Payment Methods
paymentMethods: {
  flexDirection: 'row',
  gap: 12,
  marginBottom: 12,
},
paymentBadge: {
  flex: 1,
  alignItems: 'center',
  backgroundColor: '#F7FAFC',
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#E2E8F0',
},
paymentText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#2D3748',
  marginTop: 6,
},
securePayment: {
  fontSize: 13,
  color: '#48BB78',
  fontWeight: '600',
  textAlign: 'center',
},
// Carrier List
carrierList: {
  marginTop: 8,
},
carrierItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F7FAFC',
  padding: 14,
  borderRadius: 8,
  marginBottom: 10,
  gap: 12,
},
carrierInfo: {
  flex: 1,
},
carrierName: {
  fontSize: 15,
  fontWeight: '700',
  color: '#1A202C',
  marginBottom: 2,
},
carrierDelivery: {
  fontSize: 13,
  color: '#718096',
},
// Item Weight Card
itemWeightCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F0E6FF',
  padding: 16,
  borderRadius: 12,
  gap: 12,
},
itemWeightText: {
  fontSize: 15,
  color: '#4A5568',
},
itemWeightValue: {
  fontWeight: '700',
  color: '#6A0DAD',
  fontSize: 16,
},
// Protection List
protectionList: {
  marginTop: 8,
},
protectionItem: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 10,
  marginBottom: 12,
},
protectionText: {
  flex: 1,
  fontSize: 14,
  color: '#2D3748',
  lineHeight: 20,
},
// Seller Info Card (relocated)
sellerInfoCard: {
  backgroundColor: '#FFF',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 2,
  borderColor: '#6A0DAD',
  shadowColor: '#6A0DAD',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
sellerInfoHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
},
sellerUsername: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1A202C',
  marginBottom: 8,
},
sellerStats: {
  flexDirection: 'row',
  gap: 16,
  marginTop: 8,
  marginBottom: 12,
},
sellerStatItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
sellerStatText: {
  fontSize: 13,
  color: '#4A5568',
},
viewSellerButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#F0E6FF',
  padding: 12,
  borderRadius: 8,
  marginTop: 8,
},
viewSellerButtonText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#6A0DAD',
},
// Redesigned Action Buttons - Full Width eBay Style
actionButtonsContainer: {
  width: '100%',
  marginTop: 20,
  marginBottom: 20,
  gap: 12,
},
auctionEndedContainer: {
  width: '100%',
  marginTop: 20,
  marginBottom: 20,
  padding: 32,
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#e0e0e0',
  gap: 12,
},
auctionEndedTitle: {
  fontSize: 22,
  fontWeight: '700',
  color: '#4A5568',
  marginTop: 12,
},
auctionEndedText: {
  fontSize: 14,
  color: '#718096',
  textAlign: 'center',
  lineHeight: 20,
},
auctionEndedSubtext: {
  fontSize: 13,
  color: '#A0AEC0',
  textAlign: 'center',
  marginTop: 8,
},
finalBidSection: {
  alignItems: 'center',
  marginVertical: 16,
  gap: 8,
},
finalBidLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#718096',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
finalBidValue: {
  fontSize: 32,
  fontWeight: '700',
  color: '#2D3748',
},
soldBadge: {
  backgroundColor: '#48BB78',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  marginTop: 8,
},
soldBadgeText: {
  color: '#FFF',
  fontSize: 14,
  fontWeight: '700',
  letterSpacing: 1,
},
reserveNotMetBadge: {
  backgroundColor: '#FC8181',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  marginTop: 8,
},
reserveNotMetText: {
  color: '#FFF',
  fontSize: 13,
  fontWeight: '700',
  letterSpacing: 0.5,
},
winnerTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: '#2F855A',
  marginTop: 12,
  textAlign: 'center',
},
winnerMessage: {
  fontSize: 15,
  color: '#2D3748',
  textAlign: 'center',
  lineHeight: 22,
  marginTop: 16,
  paddingHorizontal: 16,
  fontWeight: '500',
},
primaryActionButton: {
  backgroundColor: '#6A0DAD',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 16,
  borderRadius: 12,
  gap: 10,
  shadowColor: '#6A0DAD',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
},
buyNowButton: {
  backgroundColor: '#FF6B35',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 16,
  borderRadius: 12,
  gap: 10,
  shadowColor: '#FF6B35',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
},
primaryActionText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#FFF',
  letterSpacing: 0.5,
},
secondaryActionButton: {
  backgroundColor: '#FFF',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  borderRadius: 12,
  gap: 10,
  borderWidth: 2,
  borderColor: '#6A0DAD',
},
secondaryActionText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#6A0DAD',
},
secondaryActionsRow: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 4,
},
iconActionButton: {
  flex: 1,
  backgroundColor: '#F7FAFC',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  borderRadius: 10,
  gap: 6,
  borderWidth: 1,
  borderColor: '#E2E8F0',
},
iconActionText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#4A5568',
},
// Listing Type Modal Styles
listingTypeContainer: {
  marginTop: 16,
  gap: 16,
},
listingTypeOption: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#F7FAFC',
  padding: 16,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#E2E8F0',
  gap: 12,
},
listingTypeContent: {
  flex: 1,
  gap: 6,
},
listingTypeTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1A202C',
  marginTop: 4,
},
listingTypeDescription: {
  fontSize: 13,
  color: '#718096',
  lineHeight: 18,
},

});

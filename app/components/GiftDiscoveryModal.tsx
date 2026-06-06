import { API_BASE_URL } from '@/config';

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
  Dimensions,
  useWindowDimensions,
  Share,
  Alert,
} from 'react-native';
import { Ionicons,} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/app/theme/ThemeContext';

const { width } = Dimensions.get('window');

interface GiftOccasion {
  id: string;
  label: string;
  icon: string;
  description: string;
  gradient: string[];
  seasonal?: boolean;
  dateRange?: { start: string; end: string }; // MM-DD format
}

interface GiftItem {
  id: number;
  name: string;
  photo_url: string;
  price: number;
  timeLeft?: string;
  category?: string;
  description?: string;
}

interface GiftDiscoveryModalProps {
  visible: boolean;
  onClose: () => void;
}

type Birthstone = {
  month: string;
  stone: string;
  color: string;
  meaning: string;
};

const birthstones: Birthstone[] = [
  { month: 'January', stone: 'Garnet', color: '#8B0000', meaning: 'The official birthstone for January is the garnet, known for its deep red hues symbolizing passion, energy, and regeneration. Named from the Latin "granatum" meaning pomegranate seed, garnets have been treasured since ancient times and are associated with love, friendship, and protection from harm.' },
  { month: 'February', stone: 'Amethyst', color: '#800080', meaning: 'The official birthstone for February is the amethyst, a purple variety of quartz prized for its regal violet color. Its name derives from the Greek "amethystos" meaning not intoxicated, as ancient Greeks believed it prevented drunkenness. Amethyst symbolizes wisdom, clarity, and spiritual protection.' },
  { month: 'March', stone: 'Aquamarine', color: '#40E0D0', meaning: 'The official birthstone for March is the aquamarine, a pale blue-green gemstone from the beryl family. Its name comes from Latin "aqua marina" meaning seawater, reflecting its ocean-like color. Ancient sailors carried aquamarine as a talisman for safe passage. It symbolizes courage, calm, and clarity.' },
  { month: 'April', stone: 'Diamond', color: '#E0E0E0', meaning: 'The official birthstone for April is the diamond, the hardest natural substance on Earth and most coveted gemstone. Formed deep within the Earth under extreme pressure, diamonds symbolize eternal love, strength, and invincibility. The name derives from Greek "adamas" meaning unconquerable.' },
  { month: 'May', stone: 'Emerald', color: '#50C878', meaning: 'The official birthstone for May is the emerald, a deep green variety of beryl celebrated for its vibrant color and rarity. Its name originates from the Greek word "smaragdos" meaning green gem, reflecting its lush verdant hue that embodies the essence of spring and growth. Emeralds have been revered for centuries, associated with love, rebirth, and wisdom, and were prized by ancient civilizations including Egyptians, Romans, and Indian royalty.' },
  { month: 'June', stone: 'Pearl', color: '#F5F5DC', meaning: 'The official birthstone for June is the pearl, the only gemstone created by a living organism. Formed inside oysters and mollusks, pearls have been treasured for millennia and symbolize purity, innocence, and wisdom gained through experience. Their lustrous beauty has adorned royalty throughout history.' },
  { month: 'July', stone: 'Ruby', color: '#E0115F', meaning: 'The official birthstone for July is the ruby, known as the "king of gemstones" for its intense red color and rarity. A variety of corundum, rubies symbolize passion, love, and courage. Ancient cultures believed rubies held the power of life, and warriors wore them for protection in battle.' },
  { month: 'August', stone: 'Peridot', color: '#B4EEB4', meaning: 'The official birthstone for August is the peridot, a vibrant lime-green gemstone formed deep in the Earth\'s mantle. Ancient Egyptians called it the "gem of the sun" and believed it protected against nightmares. Peridot symbolizes strength, growth, and positive energy, and is one of the few gemstones that occurs in only one color.' },
  { month: 'September', stone: 'Sapphire', color: '#0F52BA', meaning: 'The official birthstone for September is the sapphire, a precious gemstone known for its deep blue color, though it occurs in many hues. Associated with royalty, wisdom, and divine favor, sapphires have adorned crowns and religious jewelry for centuries. They symbolize truth, sincerity, and faithfulness.' },
  { month: 'October', stone: 'Opal', color: '#FFB6C1', meaning: 'The official birthstone for October is the opal, a unique gemstone displaying a mesmerizing play of colors called opalescence. Ancient Romans considered opals symbols of hope and purity, while Arabs believed they fell from heaven in flashes of lightning. Opals represent creativity, inspiration, and spontaneity.' },
  { month: 'November', stone: 'Topaz', color: '#FFC87C', meaning: 'The official birthstone for November is the topaz, particularly the golden-yellow to orange variety known as Imperial Topaz. Named from the Sanskrit "tapas" meaning fire, topaz symbolizes love, affection, and strength. Ancient civilizations believed it could increase strength and provide protection from harm.' },
  { month: 'December', stone: 'Tanzanite', color: '#6A0DAD', meaning: 'The official birthstone for December is tanzanite, a rare blue-violet gemstone discovered in Tanzania in 1967. Found only in a small area near Mount Kilimanjaro, tanzanite is celebrated for its remarkable color-shifting properties, appearing blue, violet, or burgundy depending on the light. It symbolizes transformation, wisdom, and spiritual awareness.' },
];

// Automatic holiday detection function
const getActiveOccasions = (): GiftOccasion[] => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  const currentDate = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const allOccasions: GiftOccasion[] = [
    {
      id: 'birthday',
      label: 'Birthday',
      icon: 'gift',
      description: 'Find the perfect birthstone jewelry',
      gradient: ['#FF6B9D', '#FFA06B'],
    },
    {
      id: 'anniversary',
      label: 'Anniversary',
      icon: 'heart',
      description: 'Celebrate your love story',
      gradient: ['#FF6B6B', '#FF8E8E'],
    },
    {
      id: 'christmas',
      label: 'Christmas',
      icon: 'snow',
      description: 'Magical holiday treasures',
      gradient: ['#C41E3A', '#165B33'],
      seasonal: true,
      dateRange: { start: '11-20', end: '12-26' },
    },
    {
      id: 'valentines',
      label: "Valentine's Day",
      icon: 'heart-circle',
      description: 'Express your love with jewelry',
      gradient: ['#E91E63', '#F06292'],
      seasonal: true,
      dateRange: { start: '01-25', end: '02-15' },
    },
    {
      id: 'mothers-day',
      label: "Mother's Day",
      icon: 'flower',
      description: 'Honor the special woman in your life',
      gradient: ['#FF69B4', '#FFB6C1'],
      seasonal: true,
      dateRange: { start: '05-01', end: '05-14' },
    },
    {
      id: 'fathers-day',
      label: "Father's Day",
      icon: 'medal',
      description: 'Show Dad your appreciation',
      gradient: ['#4A90E2', '#5BA3F5'],
      seasonal: true,
      dateRange: { start: '06-08', end: '06-21' },
    },
    {
      id: 'halloween',
      label: 'Halloween',
      icon: 'moon',
      description: 'Spooky & mysterious treasures',
      gradient: ['#FF6600', '#8B00FF'],
      seasonal: true,
      dateRange: { start: '10-15', end: '11-01' },
    },
    {
      id: 'wedding',
      label: 'Wedding',
      icon: 'diamond',
      description: 'Timeless pieces for forever',
      gradient: ['#E8D5C4', '#F5F5DC'],
    },
    {
      id: 'graduation',
      label: 'Graduation',
      icon: 'school',
      description: 'Celebrate their achievement',
      gradient: ['#4169E1', '#87CEEB'],
      seasonal: false,
      // dateRange: { start: '05-15', end: '06-30' },
    },
    {
      id: 'thank-you',
      label: 'Thank You',
      icon: 'hand-right',
      description: 'Show your appreciation',
      gradient: ['#FFD700', '#FFA500'],
    },
    {
      id: 'just-because',
      label: 'Just Because',
      icon: 'sparkles',
      description: 'Surprise someone special',
      gradient: ['#9D50BB', '#6E48AA'],
    },
    {
      id: 'retirement',
      label: 'Retirement',
      icon: 'watch',
      description: 'Timeless timepieces for a new chapter',
      gradient: ['#455A64', '#78909C'],
    },
    {
      id: 'promotions',
      label: 'Promotions',
      icon: 'pricetag',
      description: 'Deals so good you’ll feel promoted.',
      gradient: ['#10B981', '#34D399'],
    },
  ];

  // Filter occasions based on date ranges
  return allOccasions.filter((occasion) => {
    if (!occasion.seasonal || !occasion.dateRange) return true;

    const { start, end } = occasion.dateRange;

    // Handle date ranges that span across year boundary (e.g., Christmas)
    if (start > end) {
      return currentDate >= start || currentDate <= end;
    }

    return currentDate >= start && currentDate <= end;
  });
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BUDGET_RANGES = [
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: '$250 - $500', min: 250, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: 'Over $1,000', min: 1000, max: 999999 },
];

const STYLE_PREFERENCES = [
  { id: 'classic', label: 'Classic', icon: 'diamond-outline' },
  { id: 'rings', label: 'Rings', icon: 'ellipse-outline' },
  { id: 'necklaces', label: 'Necklaces', icon: 'remove-outline' },
  { id: 'watches', label: 'Watches', icon: 'time-outline' },
];

let OCCASION_KEYWORDS;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
OCCASION_KEYWORDS = {
    'birthday': ['birthday', 'birthstone', 'celebration'],
    'anniversary': ['💘', 'anniversary', 'love', 'romantic', 'heart', 'wedding', 'forever'],
    'christmas': ['christmas', 'holiday', 'festive', 'winter', 'xmas'],
    'valentines': ['valentine', 'love', 'heart', 'romantic'],
    'mothers-day': ['mother', 'mom', 'elegant', 'classic'],
    'fathers-day': ['father', 'dad', 'masculine', 'watch', 'cufflinks'],
    'halloween': ['halloween', 'spooky', 'dark', 'gothic', 'vintage'],
    'wedding': ['wedding', 'bridal', 'engagement', 'forever', 'diamond'],
    'graduation': ['graduation', 'achievement', 'success', 'milestone'],
    'thank-you': ['thank you', 'appreciation', 'gratitude', 'gift'],
    'just-because': ['🎁', 'surprise', 'special', 'unique', 'treasure'],
    'retirement': ['⌚', 'watch', 'watches', 'timepiece', 'luxury watch', 'retirement'],
    'promotions': [
        'promotion', 'promotions', 'deal', 'deals', 'sale', 'discount',
        'clearance', 'price drop', 'marked down', 'special offer', 'bargain'
    ],
}

export default function GiftDiscoveryModal({ visible, onClose }: Readonly<GiftDiscoveryModalProps>) {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const numOccasionColumns = isLandscape ? 4 : 2;
  // 16px padding each side + 16px gap per column gap
  const occasionCardWidth = (windowWidth - 32 - 16 * (numOccasionColumns - 1)) / numOccasionColumns;
  const numGiftColumns = isLandscape ? 3 : 2;
  const giftCardWidth = Math.floor((windowWidth - 32 - 8 * (numGiftColumns - 1)) / numGiftColumns);
  const [step, setStep] = useState<'occasions' | 'questionnaire' | 'results'>('occasions');
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>(null);
  const [activeOccasions, setActiveOccasions] = useState<GiftOccasion[]>([]);

  // Questionnaire state
  const [birthMonth, setBirthMonth] = useState<string | null>(null);
  const [budgetRange, setBudgetRange] = useState<typeof BUDGET_RANGES[0] | null>(null);
  const [stylePreference, setStylePreference] = useState<string | null>(null);

  // Result state
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Birthstone modal state
  const [showBirthstoneModal, setShowBirthstoneModal] = useState(false);
  const [selectedMonthInModal, setSelectedMonthInModal] = useState<string | null>(null);

  // Scroll ref and position tracking
  const scrollViewRef = useRef<ScrollView>(null);
  const [budgetSectionY, setBudgetSectionY] = useState(0);
  const [styleSectionY, setStyleSectionY] = useState(0);
  const [findGiftsSectionY, setFindGiftsSectionY] = useState(0);

  useEffect(() => {
    // Update active occasions when modal opens
    if (visible) {
      setActiveOccasions(getActiveOccasions());
      setStep('occasions');
      setSelectedOccasion(null);
      setBirthMonth(null);
      setBudgetRange(null);
      setStylePreference(null);
      setGiftItems([]);
      setSelectedMonthInModal(null);
    }
  }, [visible]);

  // Auto-scroll after birth month selected - scroll to start of "What's your budget?"
  useEffect(() => {
    if (birthMonth && scrollViewRef.current && budgetSectionY > 0) {
      setTimeout(() => {
        // Scroll to budget section header, not below it
        scrollViewRef.current?.scrollTo({ y: budgetSectionY - 50, animated: true });
      }, 300);
    }
  }, [birthMonth, budgetSectionY]);

  // Auto-scroll after budget selected - scroll to "What's their style?" for applicable occasions
  useEffect(() => {
    if (budgetRange && scrollViewRef.current) {
      const needsScroll = selectedOccasion?.id === 'birthday' ||
                         selectedOccasion?.id === 'anniversary' ||
                         selectedOccasion?.id === 'wedding';
      if (needsScroll && styleSectionY > 0) {
        setTimeout(() => {
          // Scroll to style section header
          scrollViewRef.current?.scrollTo({ y: styleSectionY - 50, animated: true });
        }, 300);
      } else if (!needsScroll) {
        // For occasions without style preference, scroll to "Find Gifts" button
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    }
  }, [budgetRange, styleSectionY, selectedOccasion]);

  // Auto-scroll after style selected - scroll to Find Perfect Gifts button
  useEffect(() => {
    if (stylePreference && scrollViewRef.current && findGiftsSectionY > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: findGiftsSectionY - 50, animated: true });
      }, 300);
    }
  }, [stylePreference, findGiftsSectionY]);

  const handleOccasionSelect = (occasion: GiftOccasion) => {
    setSelectedOccasion(occasion);

    // All occasions should show the questionnaire for consistent UX
    setStep('questionnaire');
  };

  const handleQuestionnaireComplete = () => {
    if (selectedOccasion) {
      fetchGiftRecommendations(selectedOccasion, birthMonth, budgetRange, stylePreference);
    }
  };

  const fetchGiftRecommendations = async (
    occasion: GiftOccasion,
    month: string | null,
    budget: typeof BUDGET_RANGES[0] | null,
    style: string | null
  ) => {
    setLoading(true);
    setStep('results');

    try {
      const token = await AsyncStorage.getItem('jwtToken');

      // Build query parameters
      const params: any = {
        occasion: occasion.id,
      };

      if (month && occasion.id === 'birthday') {
        params.birthstone_month = month;
      }

      if (budget) {
        params.min_price = budget.min;
        params.max_price = budget.max;
      }

      if (style) {
        params.style = style;
      }

      // Retirement always searches watches only
      if (occasion.id === 'retirement') {
        params.style = 'watches';
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/api/gift-recommendations?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGiftItems(data.recommendations || []);
      } else {
        console.error('Failed to fetch gift recommendations:', response.status);
        setGiftItems([]);
      }
    } catch (error) {
      console.error('Error fetching gift recommendations:', error);
      setGiftItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (itemId: number) => {
    router.push(`/item/${itemId}`);
    onClose();
  };

  // @ts-ignore
  const renderOccasionCard = ({ item }: { item: GiftOccasion }) => (
    <TouchableOpacity
      style={[styles.occasionCard, { width: occasionCardWidth }]}
      onPress={() => handleOccasionSelect(item)}
      activeOpacity={0.9}
    >
      <LinearGradient
  colors={['#6A0DAD', '#38a169'] as const}
  style={styles.occasionGradient}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>

        <Ionicons name={item.icon as any} size={40} color="#FFF" />
        <Text style={styles.occasionLabel}>{item.label}</Text>
        <Text style={styles.occasionDescription}>{item.description}</Text>
        {item.seasonal && (
          <View style={styles.seasonalBadge}>
            <Text style={styles.seasonalText}>🎉 Seasonal</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderQuestionnaire = () => (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.questionnaireContainer, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.questionnaireTitle, { color: colors.textPrimary }]}>Let&#39;s Find The Perfect Gift!🎀</Text>

      {/* Birthday Month Selection (only for birthday) */}
      {selectedOccasion?.id === 'birthday' && (
        <View style={styles.questionSection}>
          <View style={styles.questionHeaderRow}>
            <Text style={[styles.questionLabel, { color: colors.textPrimary }]}>What&#39;s their birth month?</Text>
            <TouchableOpacity
              style={[styles.birthstoneButton, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF', borderColor: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]}
              onPress={() => setShowBirthstoneModal(true)}
            >
              <Ionicons name="diamond" size={16} color={theme === 'dark' ? '#8B5CF6' : '#6A0DAD'} />
              <Text style={[styles.birthstoneButtonText, { color: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]}>See Birthstones</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.monthGrid}>
            {MONTHS.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                  birthMonth === month && [styles.monthButtonSelected, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF', borderColor: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]
                ]}
                onPress={() => setBirthMonth(month)}
              >
                <Text style={[
                  styles.monthButtonText,
                  { color: theme === 'dark' ? '#999' : '#666' },
                  birthMonth === month && [styles.monthButtonTextSelected, { color: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]
                ]}>
                  {month.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Budget Range */}
      <View
        style={styles.questionSection}
        onLayout={(e) => setBudgetSectionY(e.nativeEvent.layout.y)}
      >
        <Text style={[styles.questionLabel, { color: colors.textPrimary }]}>What&#39;s your budget?</Text>
        {BUDGET_RANGES.map((range) => (
          <TouchableOpacity
            key={range.label}
            style={[
              styles.budgetOption,
              { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
              budgetRange?.label === range.label && [styles.budgetOptionSelected, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF', borderColor: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]
            ]}
            onPress={() => setBudgetRange(range)}
          >
            <Text style={[
              styles.budgetOptionText,
              { color: theme === 'dark' ? '#ECEDEE' : '#333' },
              budgetRange?.label === range.label && [styles.budgetOptionTextSelected, { color: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]
            ]}>
              {range.label}
            </Text>
            {budgetRange?.label === range.label && (
              <Ionicons name="checkmark-circle" size={24} color={theme === 'dark' ? '#8B5CF6' : '#6A0DAD'} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Style Preference - Only for Birthday, Anniversary, Wedding */}
      {(selectedOccasion?.id === 'birthday' ||
        selectedOccasion?.id === 'anniversary' ||
        selectedOccasion?.id === 'wedding') && (
        <View
          style={styles.questionSection}
          onLayout={(e) => setStyleSectionY(e.nativeEvent.layout.y)}
        >
          <Text style={[styles.questionLabel, { color: colors.textPrimary }]}>What&#39;s their style?</Text>
          <View style={styles.styleGrid}>
            {STYLE_PREFERENCES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' },
                  stylePreference === style.id && [styles.styleCardSelected, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F0F4FF', borderColor: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]
                ]}
                onPress={() => setStylePreference(style.id)}
              >
                <Ionicons
                  name={style.icon as any}
                  size={32}
                  color={stylePreference === style.id ? (theme === 'dark' ? '#8B5CF6' : '#6A0DAD') : '#999'}
                />
                <Text style={[
                  styles.styleCardText,
                  { color: theme === 'dark' ? '#999' : '#666' },
                  stylePreference === style.id && [styles.styleCardTextSelected, { color: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]
                ]}>
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Find Gifts Button */}
      <TouchableOpacity
        onLayout={(e) => setFindGiftsSectionY(e.nativeEvent.layout.y)}
        style={[
          styles.findGiftsButton,
          (!budgetRange || (
            (selectedOccasion?.id === 'birthday' ||
             selectedOccasion?.id === 'anniversary' ||
             selectedOccasion?.id === 'wedding') && !stylePreference
          )) && styles.findGiftsButtonDisabled
        ]}
        onPress={handleQuestionnaireComplete}
        disabled={!budgetRange || (
          (selectedOccasion?.id === 'birthday' ||
           selectedOccasion?.id === 'anniversary' ||
           selectedOccasion?.id === 'wedding') && !stylePreference
        )}
      >
        <LinearGradient
          colors={budgetRange && (
            !(selectedOccasion?.id === 'birthday' ||
              selectedOccasion?.id === 'anniversary' ||
              selectedOccasion?.id === 'wedding') || stylePreference
          ) ? ['#6A0DAD', '#9D50BB'] : ['#CCC', '#DDD']}
          style={styles.findGiftsGradient}
        >
          <Ionicons name="search" size={20} color="#FFF" />
          <Text style={styles.findGiftsText}>Find Perfect Gifts</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderGiftItem = ({ item }: { item: GiftItem }) => {
    // Get timer color based on urgency - celebration colors!
    const getTimerColor = (timeLeft: string) => {
      const lowerTime = timeLeft.toLowerCase();

      // Red for urgent (less than 2 hours)
      if (lowerTime.includes('min') || lowerTime.includes('sec')) {
        return '#e53e3e';
      }

      // Red for < 2 hours
      if (lowerTime.includes('h') && !lowerTime.includes('d')) {
        const hours = Number.parseInt(lowerTime);
        if (hours < 2) return '#E53E3E';
        if (hours < 24) return '#DD6B20';
      }

      // Yellow for 1-3 days
      if (lowerTime.includes('d')) {
        const days = Number.parseInt(lowerTime);
        if (days <= 3) return '#38a169';
      }

      // Green for 4+ days
      return '#38a169';
    };

    return (
      <TouchableOpacity
        style={[styles.giftCard, {
          width: giftCardWidth,
          borderWidth: 2,
          borderColor: theme === 'dark' ? '#6A0DAD' : '#38a169',
          backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF',
        }]}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.photo_url }} style={styles.giftImage} />
        <View style={[styles.giftInfoSection, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF' }]}>
          <Text style={[styles.giftName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
          <View style={styles.giftFooter}>
            <Text style={[styles.giftPrice, { color: theme === 'dark' ? '#6A0DAD' : '#9D50BB' }]}>${item.price.toFixed(2)}</Text>
            {item.timeLeft && (
              <View style={[styles.timeContainer, {
                backgroundColor: theme === 'dark' ? '#3C3C3E' : '#FFF5F5',
                borderWidth: 0.5,
                borderColor: getTimerColor(item.timeLeft),
              }]}>
                <Ionicons name="time-outline" size={14} color={getTimerColor(item.timeLeft)} />
                <Text style={[styles.giftTime, { color: getTimerColor(item.timeLeft) }]}>{item.timeLeft}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.celebrationBadge, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
          onPress={async (e) => {
            e.stopPropagation();
            try {
              const shareUrl = `https://bidgoat.com/listing/${item.id}`;
              const result = await Share.share({
                message: `Check out ${item.name} on BidGoat!\n\nPrice: $${item.price.toFixed(2)}\n\nView: ${shareUrl}`,
                title: item.name,
                url: shareUrl,
              });
              if (result.action === Share.sharedAction) {
                Alert.alert('Shared!', 'Thanks for spreading the word!');
              }
            } catch (err) {
              Alert.alert('Error', 'Could not share this item');
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-social-outline" size={16} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderResults = () => (
    <View style={[styles.resultsContainer, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={[styles.loadingText, { color: theme === 'dark' ? '#999' : '#666' }]}>Finding perfect gifts...</Text>
        </View>
      ) : giftItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="gift-outline" size={80} color={theme === 'dark' ? '#666' : '#CCC'} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No gifts found</Text>
          <Text style={[styles.emptySubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>Try adjusting your preferences</Text>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={() => setStep('questionnaire')}
          >
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={giftItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGiftItem}
          numColumns={numGiftColumns}
          key={`gift-cols-${numGiftColumns}`}
          columnWrapperStyle={styles.giftRow}
          contentContainerStyle={styles.giftList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.resultsHeader, { borderBottomColor: theme === 'dark' ? '#333' : '#F0F0F0' }]}>
              <TouchableOpacity onPress={() => setStep('occasions')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
              </TouchableOpacity>
              <View style={styles.resultsHeaderText}>
                <Text style={[styles.resultsTitle, { color: colors.textPrimary }]}>
                  {selectedOccasion?.label} Gift Ideas
                </Text>
                <Text style={[styles.resultsSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
                  {giftItems.length} perfect matches found
                </Text>
              </View>
            </View>
          }
        />
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme === 'dark' ? '#333' : '#F0F0F0' }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>
              {step === 'occasions' ? '👀 Discover Gift Ideas' :
               step === 'questionnaire' ? '✨ Perfect Gift Finder' :
               '🎀 Gift Recommendations'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {step === 'occasions' && (
            <FlatList
              data={activeOccasions}
              keyExtractor={(item) => item.id}
              renderItem={renderOccasionCard}
              numColumns={numOccasionColumns}
              key={`occasion-cols-${numOccasionColumns}`}
              columnWrapperStyle={styles.occasionRow}
              contentContainerStyle={styles.occasionList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {step === 'questionnaire' && renderQuestionnaire()}

          {step === 'results' && renderResults()}
        </View>
      </View>

      {/* Birthstone Modal - Classic View */}
      <Modal visible={showBirthstoneModal} transparent animationType="fade">
        <View style={styles.birthstoneModalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBirthstoneModal(false)} />
          <View style={[styles.birthstoneModalContent, { backgroundColor: colors.background }]}>

            {/* Title scrolls with the grid; shown fixed above detail view */}
            {!selectedMonthInModal ? (
              <FlatList
                data={birthstones}
                numColumns={3}
                keyExtractor={(item: Birthstone) => item.month}
                contentContainerStyle={styles.birthstoneGrid}
                ListHeaderComponent={
                  <>
                    <Text style={[styles.birthstoneModalTitle, { color: colors.textPrimary }]}>💎 Birthday Sparkle Ritual</Text>
                    <Text style={[styles.birthstoneModalSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>Tap a month to see the birthstone meaning</Text>
                  </>
                }
                renderItem={({ item }: { item: Birthstone }) => {
                  const lightColors = ['#dcdcdc', '#E0E0E0', '#F5F5DC', '#40E0D0'];
                  const textColor = lightColors.includes(item.color) ? '#333' : '#fff';
                  return (
                    <TouchableOpacity
                      style={[styles.birthstoneTile, { backgroundColor: item.color }]}
                      onPress={() => setSelectedMonthInModal(item.month)}
                    >
                      <Text style={[styles.birthstoneMonth, { color: textColor }]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.6}>{item.month}</Text>
                      <Text style={[styles.birthstoneStone, { color: textColor }]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.6}>{item.stone}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              /* Detail view: explicit maxHeight so ScrollView isn't collapsed by flex:0 parent */
              <ScrollView
                style={{ maxHeight: windowHeight * 0.65 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.birthstoneMeaningContainer}
              >
                <Text style={[styles.birthstoneModalTitle, { color: colors.textPrimary }]}>💎 Birthday Sparkle Ritual</Text>
                <Text style={[styles.birthstoneMonthTitle, { color: colors.textPrimary }]}>
                  {selectedMonthInModal}
                </Text>
                <Text style={[styles.birthstoneName, { color: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]}>
                  {birthstones.find((b) => b.month === selectedMonthInModal)?.stone}
                </Text>
                <Text style={[styles.birthstoneMeaning, { color: theme === 'dark' ? '#CCC' : '#666' }]}>
                  {birthstones.find((b) => b.month === selectedMonthInModal)?.meaning}
                </Text>
                <TouchableOpacity
                  style={styles.selectMonthButton}
                  onPress={() => {
                    setBirthMonth(selectedMonthInModal);
                    setShowBirthstoneModal(false);
                    setSelectedMonthInModal(null);
                  }}
                >
                  <LinearGradient colors={['#6A0DAD', '#9D50BB']} style={styles.selectMonthGradient}>
                    <Text style={styles.selectMonthButtonText}>Select This Month</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.backToBirthstonesButton, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F5F5F5' }]}
                  onPress={() => setSelectedMonthInModal(null)}
                >
                  <Ionicons name="arrow-back" size={20} color={theme === 'dark' ? '#8B5CF6' : '#6A0DAD'} />
                  <Text style={[styles.backToBirthstonesText, { color: theme === 'dark' ? '#8B5CF6' : '#6A0DAD' }]}>
                    Back to Birthstones
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Fixed Close button — always visible */}
            <TouchableOpacity
              style={styles.birthstoneCloseButton}
              onPress={() => setShowBirthstoneModal(false)}
            >
              <Text style={styles.birthstoneCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
  },
  closeButton: {
    padding: 4,
    marginBottom:6
  },

  // Occasions List
  occasionList: {
    padding: 16,
  },
  occasionRow: {
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  occasionCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  occasionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occasionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A0DAD',
    marginTop: 12,
    textAlign: 'center',
  },
  occasionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  seasonalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonalText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },

  // Questionnaire
  questionnaireContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionnaireTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 24,
    textAlign: 'center',
  },
  questionSection: {
    marginBottom: 28,
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    flex: 1, // Allow label to shrink if needed
    flexShrink: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthButton: {
    width: (width - 64) / 4,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  monthButtonSelected: {
    backgroundColor: '#F0F4FF',
    borderColor: '#4CAF50',
  },
  monthButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  monthButtonTextSelected: {
    color: '#6A0DAD',
  },
  budgetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  budgetOptionSelected: {
    backgroundColor: '#F0F4FF',
    borderColor: '#6A0DAD',
  },
  budgetOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  budgetOptionTextSelected: {
    color: '#6A0DAD',
    fontWeight: '600',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    width: (width - 64) / 2,
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  styleCardSelected: {
    backgroundColor: '#F0F4FF',
    borderColor: '#6A0DAD',
  },
  styleCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  styleCardTextSelected: {
    color: '#6A0DAD',
  },
  findGiftsButton: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  findGiftsButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  findGiftsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  findGiftsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },

  // Results
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  resultsHeaderText: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  tryAgainButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#6A0DAD',
    borderRadius: 24,
  },
  tryAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  giftList: {
    padding: 16,
  },
  giftRow: {
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  giftCard: {
    width: (width - 48) / 2,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  giftImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  giftInfoSection: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
  },
  giftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  giftTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  celebrationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Birthstone Modal Styles
  birthstoneModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  birthstoneModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '85%',
  },
  birthstoneModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  birthstoneModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  birthstoneGrid: {
    paddingBottom: 12,
  },
  birthstoneTile: {
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
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  birthstoneMonth: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  birthstoneStone: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  birthstoneCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#6A0DAD',
    borderRadius: 12,
    alignItems: 'center',
  },
  birthstoneCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  questionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 0,
    gap: 8, // Space between label and button
  },
  birthstoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    flexShrink: 0, // Prevent button from being cut off
  },
  birthstoneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  birthstoneMeaningContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  birthstoneMonthTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  birthstoneName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  birthstoneMeaning: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  selectMonthButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  selectMonthGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectMonthButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  backToBirthstonesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  backToBirthstonesText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  { month: 'January', stone: 'Garnet', color: '#8B0000', meaning: 'Deep red warmth, like a goat\'s heartbeat in winter' },
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
      seasonal: true,
      dateRange: { start: '05-15', end: '06-30' },
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
  { id: 'modern', label: 'Modern', icon: 'flash-outline' },
  { id: 'vintage', label: 'Vintage', icon: 'time-outline' },
  { id: 'bohemian', label: 'Bohemian', icon: 'leaf-outline' },
];

export default function GiftDiscoveryModal({ visible, onClose }: GiftDiscoveryModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'occasions' | 'questionnaire' | 'results'>('occasions');
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>(null);
  const [activeOccasions, setActiveOccasions] = useState<GiftOccasion[]>([]);

  // Questionnaire state
  const [birthMonth, setBirthMonth] = useState<string | null>(null);
  const [budgetRange, setBudgetRange] = useState<typeof BUDGET_RANGES[0] | null>(null);
  const [stylePreference, setStylePreference] = useState<string | null>(null);

  // Results state
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Birthstone modal state
  const [showBirthstoneModal, setShowBirthstoneModal] = useState(false);

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
    }
  }, [visible]);

  const handleOccasionSelect = (occasion: GiftOccasion) => {
    setSelectedOccasion(occasion);

    // For birthday, show questionnaire with birthstone selection
    if (occasion.id === 'birthday' || occasion.id === 'anniversary' || occasion.id === 'wedding') {
      setStep('questionnaire');
    } else {
      // For other occasions, skip questionnaire and go straight to results
      fetchGiftRecommendations(occasion, null, null, null);
    }
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

      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`http://10.0.0.170:5000/api/gift-recommendations?${queryString}`, {
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

  const renderOccasionCard = ({ item }: { item: GiftOccasion }) => (
    <TouchableOpacity
      style={styles.occasionCard}
      onPress={() => handleOccasionSelect(item)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={item.gradient}
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
    <ScrollView style={styles.questionnaireContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.questionnaireTitle}>Let's Find The Perfect Gift! 🎁</Text>

      {/* Birthday Month Selection (only for birthday) */}
      {selectedOccasion?.id === 'birthday' && (
        <View style={styles.questionSection}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionLabel}>What's their birth month?</Text>
            <TouchableOpacity
              style={styles.birthstoneButton}
              onPress={() => setShowBirthstoneModal(true)}
            >
              <Ionicons name="diamond" size={16} color="#6A0DAD" />
              <Text style={styles.birthstoneButtonText}>See Birthstones</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.monthGrid}>
            {MONTHS.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  birthMonth === month && styles.monthButtonSelected
                ]}
                onPress={() => setBirthMonth(month)}
              >
                <Text style={[
                  styles.monthButtonText,
                  birthMonth === month && styles.monthButtonTextSelected
                ]}>
                  {month.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Budget Range */}
      <View style={styles.questionSection}>
        <Text style={styles.questionLabel}>What's your budget?</Text>
        {BUDGET_RANGES.map((range) => (
          <TouchableOpacity
            key={range.label}
            style={[
              styles.budgetOption,
              budgetRange?.label === range.label && styles.budgetOptionSelected
            ]}
            onPress={() => setBudgetRange(range)}
          >
            <Text style={[
              styles.budgetOptionText,
              budgetRange?.label === range.label && styles.budgetOptionTextSelected
            ]}>
              {range.label}
            </Text>
            {budgetRange?.label === range.label && (
              <Ionicons name="checkmark-circle" size={24} color="#6A0DAD" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Style Preference */}
      <View style={styles.questionSection}>
        <Text style={styles.questionLabel}>What's their style?</Text>
        <View style={styles.styleGrid}>
          {STYLE_PREFERENCES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                stylePreference === style.id && styles.styleCardSelected
              ]}
              onPress={() => setStylePreference(style.id)}
            >
              <Ionicons
                name={style.icon as any}
                size={32}
                color={stylePreference === style.id ? '#6A0DAD' : '#999'}
              />
              <Text style={[
                styles.styleCardText,
                stylePreference === style.id && styles.styleCardTextSelected
              ]}>
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Find Gifts Button */}
      <TouchableOpacity
        style={[
          styles.findGiftsButton,
          (!budgetRange || !stylePreference) && styles.findGiftsButtonDisabled
        ]}
        onPress={handleQuestionnaireComplete}
        disabled={!budgetRange || !stylePreference}
      >
        <LinearGradient
          colors={budgetRange && stylePreference ? ['#6A0DAD', '#9D50BB'] : ['#CCC', '#DDD']}
          style={styles.findGiftsGradient}
        >
          <Ionicons name="search" size={20} color="#FFF" />
          <Text style={styles.findGiftsText}>Find Perfect Gifts</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderGiftItem = ({ item }: { item: GiftItem }) => (
    <TouchableOpacity
      style={styles.giftCard}
      onPress={() => handleItemPress(item.id)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.photo_url }} style={styles.giftImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.giftOverlay}
      >
        <Text style={styles.giftName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.giftFooter}>
          <Text style={styles.giftPrice}>${item.price.toFixed(2)}</Text>
          {item.timeLeft && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#FFF" />
              <Text style={styles.giftTime}>{item.timeLeft}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <TouchableOpacity onPress={() => setStep('occasions')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.resultsHeaderText}>
          <Text style={styles.resultsTitle}>
            {selectedOccasion?.label} Gift Ideas
          </Text>
          <Text style={styles.resultsSubtitle}>
            {giftItems.length} perfect matches found
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Finding perfect gifts...</Text>
        </View>
      ) : giftItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="gift-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>No gifts found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your preferences</Text>
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
          numColumns={2}
          columnWrapperStyle={styles.giftRow}
          contentContainerStyle={styles.giftList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {step === 'occasions' ? '🎁 Discover Gift Ideas' :
               step === 'questionnaire' ? '✨ Perfect Gift Finder' :
               '🎀 Gift Recommendations'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {step === 'occasions' && (
            <FlatList
              data={activeOccasions}
              keyExtractor={(item) => item.id}
              renderItem={renderOccasionCard}
              numColumns={2}
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
          <View style={styles.birthstoneModalContent}>
            <Text style={styles.birthstoneModalTitle}>💎 Birthday Sparkle Ritual</Text>
            <Text style={styles.birthstoneModalSubtitle}>Tap a month to see the birthstone meaning</Text>
            <FlatList
              data={birthstones}
              numColumns={3}
              keyExtractor={(item: Birthstone) => item.month}
              contentContainerStyle={styles.birthstoneGrid}
              renderItem={({ item }: { item: Birthstone }) => {
                const textColor = item.color === '#dcdcdc' || item.color === '#E0E0E0' ? '#333' : '#fff';
                return (
                  <TouchableOpacity
                    style={[styles.birthstoneTile, { backgroundColor: item.color }]}
                    onPress={() => {
                      // Auto-select the month when tapping a birthstone
                      setBirthMonth(item.month);
                      setShowBirthstoneModal(false);
                    }}
                  >
                    <Text style={[styles.birthstoneMonth, { color: textColor }]}>{item.month}</Text>
                    <Text style={[styles.birthstoneStone, { color: textColor }]}>{item.stone}</Text>
                  </TouchableOpacity>
                );
              }}
            />
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
  },

  // Occasions List
  occasionList: {
    padding: 16,
  },
  occasionRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  occasionCard: {
    width: (width - 48) / 2,
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
    color: '#FFF',
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
    borderColor: '#6A0DAD',
  },
  monthButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  giftCard: {
    width: (width - 48) / 2,
    height: 240,
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
    height: '100%',
  },
  giftOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    height: 100,
    justifyContent: 'flex-end',
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  giftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftTime: {
    fontSize: 12,
    color: '#FFF',
  },

  // Birthstone Modal Styles
  birthstoneModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  birthstoneModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
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
  },
  birthstoneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A0DAD',
  },
});

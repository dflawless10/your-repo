import { API_BASE_URL } from '@/config';

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import ImageUploader from '@/components/ImageUploader';
import {triggerGoat} from "@/utils/goatFeedback";
import { CharacterCounterInput, CHARACTER_LIMITS, validateCharacterCount } from 'app/components/CharacterCounterInput';
import { handleListingSuccess } from 'app/utils/formHelpers';
import { validateContentQuick } from 'app/utils/contentModeration';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { useImageValidation } from '@/hooks/useImageValidation';
import ImageValidationFeedback from '@/app/components/ImageValidationFeedback';
import GlobalFooter from "@/app/components/GlobalFooter";
import CategorySelector, { QUICK_CATEGORIES } from '@/app/components/CategorySelector';
import { useTheme } from '@/app/theme/ThemeContext';


const API_URL = API_BASE_URL;

 function CreateAuctionForm() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const editItemId = params.editItemId as string | undefined;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [startPrice, setStartPrice] = useState('');
  const [durationHours, setDurationHours] = useState('168'); // Default: 7 days
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [tags, setTags] = useState('');
  const [rarity, setRarity] = useState('common');
  const [reservePrice, setReservePrice] = useState('');
  const [weightLbs, setWeightLbs] = useState('1.0');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [gender, setGender] = useState<string>('unisex');
  const [loading, setLoading] = useState(false);

  // Item-level return policy overrides
  const [returnPolicyOverride, setReturnPolicyOverride] = useState<string>('use_default');
  const [showPolicyOverride, setShowPolicyOverride] = useState(false);

  // Preset duration options
  const presetDurations = [
    { label: '24h', hours: '24' },
    { label: '48h', hours: '48' },
    { label: '7 days', hours: '168' },
    { label: '14 days', hours: '336' },
    { label: '30 days', hours: '720' },
  ];

  // Image validation for first image
  const imageValidation = useImageValidation(imageUris.length > 0 ? imageUris[0] : null);

  useEffect(() => {
    // Fade in header title and arrow - wait for screen to fully render first
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

    if (editItemId) {
      loadItemForEdit();
    }
  }, [editItemId]);


  const loadItemForEdit = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_URL}/item/${editItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const item = await res.json();

        // Safety check: Ensure this is an auction (not must_sell or buy_it_now)
        if (item.selling_strategy === 'must_sell' || item.buy_it_now) {
          Alert.alert('Error', 'This item cannot be edited as an auction.');
          router.back();
          return;
        }

        setName(item.name || '');
        setDescription(item.description || '');
        setStartPrice(item.price?.toString() || '');

        // Set category from item data
        if (item.category_id) {
          setCategoryId(item.category_id.toString());
          const cat = QUICK_CATEGORIES.find(c => c.id === item.category_id.toString());
          setCategoryName(cat?.name || '');
        }

        setTags(item.tags || '');
        setRarity(item.rarity || 'common');
        setReservePrice(item.reserve_price?.toString() || '');
        setWeightLbs(item.weight_lbs?.toString() || '1.0');
        setGender(item.gender || 'unisex');
        setDurationHours(item.duration_hours?.toString() || '');

        // Load existing images
        const existingImages = [item.photo_url];
        if (item.additional_photos && Array.isArray(item.additional_photos)) {
          existingImages.push(...item.additional_photos);
        }
        setImageUris(existingImages);
      }
    } catch (error) {
      console.error('Error loading item for edit:', error);
      Alert.alert('Error', 'Could not load item data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Prevent duplicate submissions
    if (loading) {
      return;
    }

    // Validate required fields
    if (!name || !description || !categoryId || !startPrice || !durationHours || imageUris.length === 0) {
      Alert.alert('Missing Fields', 'Please fill out all fields, select a category, and upload at least one photo');
      return;
    }

    // Validate duration hours
    const duration = parseInt(durationHours);
    if (isNaN(duration)) {
      Alert.alert('Invalid Duration', 'Please enter a valid number for auction duration');
      return;
    }
    if (duration < 24) {
      Alert.alert('Duration Too Short', 'Auctions must run for at least 24 hours (1 day) to give bidders time to discover your item.');
      return;
    }
    if (duration > 720) {
      Alert.alert('Duration Too Long', 'Auctions cannot exceed 720 hours (30 days). For longer listings, use Buy It Now.');
      return;
    }

    // Validate name length
    const nameValidation = validateCharacterCount(name, CHARACTER_LIMITS.NAME_MIN, CHARACTER_LIMITS.NAME_MAX, 'Item name');
    if (!nameValidation.isValid) {
      Alert.alert('Item Name Invalid', nameValidation.errorMessage);
      return;
    }

    // Validate description length
    const descValidation = validateCharacterCount(description, CHARACTER_LIMITS.DESCRIPTION_MIN, CHARACTER_LIMITS.DESCRIPTION_MAX, 'Description');
    if (!descValidation.isValid) {
      Alert.alert('Description Invalid', descValidation.errorMessage + '\n\n💡 Tip: Describe the item\'s condition, materials, size, and any unique features.');
      return;
    }

    // Content Moderation
    const nameModeration = validateContentQuick(name, 'Item name');
    if (!nameModeration.isValid) {
      Alert.alert('Content Policy Violation', nameModeration.errorMessage);
      return;
    }

    const descModeration = validateContentQuick(description, 'Description');
    if (!descModeration.isValid) {
      Alert.alert('Content Policy Violation', descModeration.errorMessage);
      return;
    }

    // Set loading state to prevent duplicate submissions
    setLoading(true);

    const token = await AsyncStorage.getItem('jwtToken');
    const formData = new FormData();

    formData.append('name', name);
    formData.append('description', description);
    formData.append('category_id', categoryId);
    formData.append('price', startPrice);
    formData.append('tags', tags);
    formData.append('duration_hours', durationHours || '96');
    formData.append('rarity', rarity || 'common');
    formData.append('reserve_price', reservePrice || '');
    formData.append('weight_lbs', weightLbs);
    formData.append('gender', gender);
    formData.append('return_policy_override', returnPolicyOverride);

    // Main image (first image)
    formData.append('photo', {
      uri: imageUris[0],
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    // Additional images
    for (let i = 1; i < imageUris.length; i++) {
      formData.append(`additional_photo_${i - 1}`, {
        uri: imageUris[i],
        name: `extra_${i - 1}.jpg`,
        type: 'image/jpeg',
      } as any);
    }


    try {
      let res;

      if (editItemId) {
        // Update existing item
        res = await fetch(`${API_URL}/item/${editItemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Create new item
        res = await fetch(`${API_URL}/item`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (res.ok) {
        const responseData = await res.json();
        const itemId = responseData.item_id || editItemId;

        if (editItemId) {
          // Random compliments for edits
          const compliments = [
            'Your item looks beautiful now! Good luck! 🌟',
            'Good job with the edit! Good luck! ✨',
            'Wow! Those changes look amazing! 🎉',
            'Perfect! Your listing is looking great! 💫',
            'Excellent work! Your item is sure to sell! 🚀',
            'Beautiful updates! Best of luck! 🍀',
            'Looking good! Your changes are impressive! 👏',
            'Fantastic edits! This will catch buyers\' eyes! 👀'
          ];
          const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

          Alert.alert('Success!', randomCompliment, [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          // Clear form only for new listings
          setName('');
          setDescription('');
          setStartPrice('');
          setDurationHours('');
          setTags('');
          setRarity('common');
          setReservePrice('');
          setCategoryId('');
          setCategoryName('');
          setImageUris([]);

          // Show a success message and redirect to item detail
          handleListingSuccess(itemId, router, 'auction');
        }
      } else {
        const msg = await res.text();
        Alert.alert('Error', msg);
        setLoading(false);
      }
    } catch (error) {
      console.error('Listing error:', error);
      Alert.alert('Network Error', 'Could not reach the server.');
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT, paddingBottom: 120, backgroundColor: colors.background }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Title with Back Arrow - Now inside ScrollView */}
        <Animated.View style={[
          styles.headerTitleContainer,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
            backgroundColor: colors.background,
            borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5'
          }
        ]}>
          <View style={styles.titleWithArrow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
               <Ionicons name="arrow-back" size={28} color="#B794F4"  />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{editItemId ? 'Edit Auction' : 'Create Auction'}</Text>
              {editItemId && <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>Update your listing details</Text>}
            </View>
          </View>
        </Animated.View>
        <CategorySelector
          selectedCategory={categoryId}
          onSelectCategory={(id, name) => {
            setCategoryId(id);
            setCategoryName(name);
          }}
          required={true}
          showSelectedBanner={true}
        />

        <ImageUploader
          maxImages={5}
          imageUris={imageUris}
          onImagesChange={(uris) => {
            setImageUris(uris);
            if (uris.length > 0) {
              triggerGoat('UploadConfirmed');
            }
          }}
          title="Upload Auction Photos"
          subtitle="Add up to 5 photos"
        />

        {/* Image Validation Feedback */}
        {imageUris.length > 0 && (
          <ImageValidationFeedback validation={imageValidation} />
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🎯 Auction Details</Text>

        {/* Item Name with Character Counter */}
        <CharacterCounterInput
          label="Item Name"
          placeholder="Enter item name"
          value={name}
          onChangeText={setName}
          minLength={CHARACTER_LIMITS.NAME_MIN}
          maxLength={CHARACTER_LIMITS.NAME_MAX}
        />

        {/* Description with Character Counter */}
        <CharacterCounterInput
          label="Description"
          placeholder="Describe your item in detail (condition, materials, size, unique features...)"
          value={description}
          onChangeText={setDescription}
          minLength={CHARACTER_LIMITS.DESCRIPTION_MIN}
          maxLength={CHARACTER_LIMITS.DESCRIPTION_MAX}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={styles.textArea}
          helpText="💡 Great descriptions include: condition, materials, measurements, brand (if applicable), and what makes this item special"
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Starting Bid Price</Text>
        <TextInput placeholder="Starting Bid Price ($)" placeholderTextColor={theme === 'dark' ? '#666' : '#999'} value={startPrice} onChangeText={setStartPrice} keyboardType="numeric" style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]} />
        <Text style={styles.helperText}>
          💡 Set a competitive starting bid to attract bidders. Lower prices create more bidding activity and can drive final sale price higher.
        </Text>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Auction Duration</Text>
        <View style={styles.presetButtonRow}>
          {presetDurations.map((preset) => (
            <TouchableOpacity
              key={preset.hours}
              style={[
                styles.presetButton,
                durationHours === preset.hours && styles.presetButtonSelected,
              ]}
              onPress={() => {
                setDurationHours(preset.hours);
                setShowCustomDuration(false);
              }}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  durationHours === preset.hours && styles.presetButtonTextSelected,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.presetButton,
              showCustomDuration && styles.presetButtonSelected,
            ]}
            onPress={() => setShowCustomDuration(true)}
          >
            <Text
              style={[
                styles.presetButtonText,
                showCustomDuration && styles.presetButtonTextSelected,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {showCustomDuration && (
          <TextInput
            placeholder="Custom duration (hours)"
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
            value={durationHours}
            onChangeText={setDurationHours}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]}
          />
        )}

        <Text style={styles.helperText}>
          💡 Choose a preset or enter custom duration (24-720 hours)
        </Text>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Reserve Price (Optional)</Text>
        <TextInput placeholder="Reserve Price (minimum to sell, optional)" placeholderTextColor={theme === 'dark' ? '#666' : '#999'} value={reservePrice} onChangeText={setReservePrice} keyboardType="numeric" style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]} />
        <Text style={styles.helperText}>
          💡 Reserve price protects you from selling below your minimum. If bidding doesn't reach this price, the item won't sell. Leave blank to sell to highest bidder.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📦 Item Details</Text>
        <TextInput
          placeholder="Tags (comma-separated)"
          placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
          value={tags}
          onChangeText={setTags}
          style={[styles.input, styles.tagsInput, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Item Rarity Dropdown */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Item Rarity</Text>
        <Picker
          selectedValue={rarity}
          onValueChange={(value) => setRarity(value)}
          style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#ccc' }]}
          dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
          mode="dropdown"
        >
          <Picker.Item label="Common" value="common" />
          <Picker.Item label="Rare" value="rare" />
          <Picker.Item label="Extremely Rare" value="extremely_rare" />
        </Picker>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Shipping Weight</Text>
        <TextInput placeholder="Weight (lbs) - for shipping" placeholderTextColor={theme === 'dark' ? '#666' : '#999'} value={weightLbs} onChangeText={setWeightLbs} keyboardType="decimal-pad" style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]} />

        {/* Only show Gender picker for wearable items (jewelry, accessories, watches, clothing) */}
        {categoryName && (() => {
          const catName = categoryName.toLowerCase();
          const isWearable = ['accessories', 'body jewelry', 'bracelets', 'brooches', 'chains', 'earrings',
                             'engagement', 'necklaces', 'pendants', 'rings', 'watches', 'hat pins'].includes(catName);

          return isWearable ? (
            <>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Gender</Text>
              <Picker
                selectedValue={gender}
                onValueChange={(value) => setGender(value)}
                style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#ccc' }]}
                dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
                mode="dropdown"
              >
                <Picker.Item label="Unisex / Not Specified" value="unisex" />
                <Picker.Item label="👨 Men's" value="men" />
                <Picker.Item label="👩 Women's" value="women" />
              </Picker>
            </>
          ) : null;
        })()}

        {/* Return Policy Override */}
        <TouchableOpacity
          style={[styles.overrideToggle, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F8F9FA', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' }]}
          onPress={() => setShowPolicyOverride(!showPolicyOverride)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.overrideToggleText, { color: colors.textPrimary }]}>
              {returnPolicyOverride === 'use_default' ? '📋 Use My Default Return Policy' : '⚠️ Override Return Policy for This Item'}
            </Text>
            {returnPolicyOverride !== 'use_default' && (
              <Text style={[styles.overrideSubtext, { color: theme === 'dark' ? '#999' : '#666' }]}>
                This item: {returnPolicyOverride === 'no_returns' ? 'No Returns (Final Sale)' : returnPolicyOverride.replace('_', '-')}
              </Text>
            )}
          </View>
          <Ionicons
            name={showPolicyOverride ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6A0DAD"
          />
        </TouchableOpacity>

        {showPolicyOverride && (
          <View style={[styles.overridePanel, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' }]}>
            <Text style={[styles.overrideLabel, { color: colors.textPrimary }]}>Return Policy for THIS Item Only:</Text>
            <Picker
              selectedValue={returnPolicyOverride}
              onValueChange={(value) => setReturnPolicyOverride(value)}
              style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#ccc' }]}
              dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
              mode="dropdown"
            >
              <Picker.Item label="📋 Use My Default Return Policy" value="use_default" />
              <Picker.Item label="30-day Returns" value="30_days" />
              <Picker.Item label="14-day Returns" value="14_days" />
              <Picker.Item label="7-day Returns" value="7_days" />
              <Picker.Item label="🚫 No Returns (Final Sale)" value="no_returns" />
            </Picker>
            <Text style={[styles.overrideHint, { color: theme === 'dark' ? '#999' : '#666' }]}>
              ℹ️ This override only applies to this listing. To change your default return policy, go to Settings → My Store.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.buttonContainer, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.buttonTitle}>Creating...</Text>
              <Ionicons name="hourglass-outline" size={20} color="#FFF" />
            </View>
          ) : (
            <Text style={styles.buttonTitle}>Create Auction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  titleWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
   headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  backArrow: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
  presetButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 70,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  presetButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tagsInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  buttonContainer: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

buttonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  categoryInputContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 12,
  },
  categoryDropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    height: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  categoryScrollView: {
    flex: 1,
  },
  categoryDropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryDropdownText: {
    fontSize: 16,
    color: '#1A202C',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E6F7FF',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#91D5FF',
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  overrideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  overrideToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  overrideSubtext: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
  },
  overridePanel: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  overrideLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  overrideHint: {
    fontSize: 13,
    color: '#718096',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default CreateAuctionForm;

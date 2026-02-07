import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  Alert, ScrollView, Animated, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from '@expo/vector-icons';
import { useGoatBid } from "@/hooks/useGoatBid";
import { GoatFlip } from "@/components/GoatAnimator/goatFlip";
import { useRouter, useLocalSearchParams } from 'expo-router';
import ImageUploader from '@/components/ImageUploader';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { CharacterCounterInput, CHARACTER_LIMITS, validateCharacterCount } from 'app/components/CharacterCounterInput';
import { handleListingSuccess } from 'app/utils/formHelpers';
import { validateContentQuick } from 'app/utils/contentModeration';
import { useImageValidation } from '@/hooks/useImageValidation';
import ImageValidationFeedback from '@/app/components/ImageValidationFeedback';
import { API_BASE_URL } from '@/config';
import GlobalFooter from "@/app/components/GlobalFooter";
import CategorySelector, { QUICK_CATEGORIES } from '@/app/components/CategorySelector';
import { useTheme } from '@/app/theme/ThemeContext';


const API_URL = API_BASE_URL;

function ItemScreen() {
  const { theme, colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const itemNameRef = useRef<View>(null);
  const descriptionRef = useRef<View>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const editItemId = params.editItemId as string | undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [showGoat, setShowGoat] = useState(false);
  const [rarity, setRarity] = useState('common');
  const [weightLbs, setWeightLbs] = useState('1.0');
  const [gender, setGender] = useState<string>('unisex');
  const [durationDays, setDurationDays] = useState(7);
  const [loading, setLoading] = useState(false);

  // Item-level policy overrides
  const [returnPolicyOverride, setReturnPolicyOverride] = useState<string>('use_default');
  const [showPolicyOverride, setShowPolicyOverride] = useState(false);

  const { goatTrigger, lastBidAmount, triggerGoat } = useGoatBid();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Safety check: Ensure this is NOT a must_sell item
        if (item.selling_strategy === 'must_sell') {
          Alert.alert('Error', 'This is a Must Sell item and cannot be edited as Buy It Now.');
          router.back();
          return;
        }

        setName(item.name || '');
        setDescription(item.description || '');
        setPrice(item.price?.toString() || item.buy_it_now?.toString() || '');

        // Set category from item data
        if (item.category_id) {
          setCategoryId(item.category_id.toString());
          const cat = QUICK_CATEGORIES.find(c => c.id === item.category_id.toString());
          setCategoryName(cat?.name || '');
        }

        setTags(item.tags || '');
        setRarity(item.rarity || 'common');
        setWeightLbs(item.weight_lbs?.toString() || '1.0');
        setGender(item.gender || 'unisex');

        // Convert hours back to days
        if (item.duration_hours) {
          setDurationDays(Math.round(item.duration_hours / 24));
        }

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

  const handleBidConfirm = () => {
    setShowGoat(true);
    setTimeout(() => setShowGoat(false), 2000);
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (loading) return;

    if (!name || !description || !price || !categoryId || imageUris.length === 0) {
      Alert.alert('Missing Fields', 'Please fill out all fields, select a category, and upload at least one photo');
      return;
    }

    setLoading(true);

    // Validate name length
    const nameValidation = validateCharacterCount(name, CHARACTER_LIMITS.NAME_MIN, CHARACTER_LIMITS.NAME_MAX, 'Item name');
    if (!nameValidation.isValid) {
      Alert.alert('Item Name Invalid', nameValidation.errorMessage || 'Invalid name length');
      return;
    }

    // Validate description length
    const descValidation = validateCharacterCount(description, CHARACTER_LIMITS.DESCRIPTION_MIN, CHARACTER_LIMITS.DESCRIPTION_MAX, 'Description');
    if (!descValidation.isValid) {
      Alert.alert('Description Invalid', (descValidation.errorMessage || 'Invalid description length') + '\n\n💡 Tip: Describe the item\'s condition, materials, size, and any unique features.');
      return;
    }

    // Layer 1: Client-side Content Moderation
    const nameModeration = validateContentQuick(name, 'Item name');
    if (!nameModeration.isValid) {
      Alert.alert('Content Policy Violation', nameModeration.errorMessage || 'Content not allowed');
      return;
    }

    const descModeration = validateContentQuick(description, 'Description');
    if (!descModeration.isValid) {
      Alert.alert('Content Policy Violation', descModeration.errorMessage || 'Content not allowed');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');

      const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('category_id', categoryId);
  formData.append('tags', tags);
  formData.append('rarity', rarity);
  formData.append('weight_lbs', weightLbs);
  formData.append('gender', gender);
  formData.append('duration_hours', String(durationDays * 24));  // Convert days to hours
  formData.append('buy_it_now', price);  // Buy it now price is the listed price
  formData.append('selling_strategy', 'buy_it_now');  // Explicitly mark as buy_it_now to prevent must_sell confusion

  // Item-level policy override (if not using default)
  if (returnPolicyOverride !== 'use_default') {
    formData.append('return_policy_override', returnPolicyOverride);
  }

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

      triggerGoat(Number(price));
      handleBidConfirm();

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
        setPrice('');
        setCategoryId('');
        setCategoryName('');
        setTags('');
        setImageUris([]);

        // Show success and redirect
        handleListingSuccess(itemId, router, 'Buy It Now listing');
      }
      setLoading(false);
    } else {
      const errorData = await res.json();
      Alert.alert('Error', errorData.error || 'Failed to create listing');
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
      <EnhancedHeader scrollY={scrollY} />

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
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>{editItemId ? 'Edit Buy It Now' : 'Buy It Now'}</Text>
            <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#999' : '#666' }]}>{editItemId ? 'Update your listing details' : 'List your item for instant purchase'}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingBottom: 120, backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
      <CategorySelector
        selectedCategory={categoryId}
        onSelectCategory={(id, name) => {
          setCategoryId(id);
          setCategoryName(name);

          // Auto-scroll to photos section after category is selected
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 200, animated: true });
          }, 400);
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
            triggerGoat(Number(price));

            // Auto-scroll to Item Name after first photo is uploaded
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({ y: 400, animated: true });
            }, 500);
          }
        }}
        title="Upload Item Photos"
        subtitle="Add up to 5 photos"
      />

      {/* Image Validation Feedback */}
      {imageUris.length > 0 && (
        <ImageValidationFeedback validation={imageValidation} />
      )}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💰 Buy It Now Listing</Text>

      <CharacterCounterInput
        label="Item Name"
        placeholder="Enter item name"
        value={name}
        onChangeText={setName}
        minLength={CHARACTER_LIMITS.NAME_MIN}
        maxLength={CHARACTER_LIMITS.NAME_MAX}
        onBlur={() => {
          // Dismiss keyboard when user finishes Item Name
          Keyboard.dismiss();
        }}
      />

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
        helpText="💡 Great descriptions include: condition, materials, measurements, brand (if applicable), and what makes this item special"
        onBlur={() => {
          // Dismiss keyboard when user finishes Description
          Keyboard.dismiss();
        }}
      />

      <TextInput
        placeholder="Price ($)"
        placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]}
      />

      <Text style={[styles.label, { color: colors.textPrimary }]}>⏰ Listing Duration</Text>
      <Picker
        selectedValue={durationDays}
        onValueChange={(value) => setDurationDays(value)}
        style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#ccc' }]}
        dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
        mode="dropdown"
      >
        <Picker.Item label="7 Days" value={7} />
        <Picker.Item label="14 Days" value={14} />
        <Picker.Item label="30 Days" value={30} />
      </Picker>

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
        onBlur={() => {
          // Dismiss keyboard when user finishes Tags
          Keyboard.dismiss();
        }}
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

      <TextInput
        placeholder="Weight (lbs) - for shipping"
        placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
        value={weightLbs}
        onChangeText={setWeightLbs}
        keyboardType="decimal-pad"
        style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]}
      />

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
            <Picker.Item label="Use My Default Policy" value="use_default" />
            <Picker.Item label="No Returns (Final Sale)" value="no_returns" />
            <Picker.Item label="7-Day Returns" value="7_days" />
            <Picker.Item label="14-Day Returns" value="14_days" />
            <Picker.Item label="30-Day Returns" value="30_days" />
          </Picker>
          <Text style={[styles.overrideHelp, { color: theme === 'dark' ? '#999' : '#666' }]}>
            💡 Tip: Use "No Returns" for custom or personalized items. Your other listings will still use your default policy.
          </Text>
        </View>
      )}

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <GoatFlip trigger={goatTrigger || showGoat} bidAmount={lastBidAmount || Number(price)} />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>List Buy It Now</Text>
      </TouchableOpacity>
      </Animated.ScrollView>
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 260,
    padding: 16,
    paddingBottom: 40,
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 34,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  titleWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  label: { marginBottom: 4, fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    color: '#2d3748',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  tagsInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputText: {
    fontSize: 16,
    color: '#1A202C',
  },
  inputPlaceholder: {
    fontSize: 16,
    color: '#999',
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
    fontSize: 15,
    color: '#',
    fontWeight: '600',
  },
  submitButton: {
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

  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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
  overrideHelp: {
    fontSize: 13,
    color: '#718096',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
export default ItemScreen;

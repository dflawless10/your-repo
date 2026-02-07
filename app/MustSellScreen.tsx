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
import GlobalFooter from "./components/GlobalFooter";
import { API_BASE_URL } from '@/config';
import CategorySelector, { QUICK_CATEGORIES } from '@/app/components/CategorySelector';
import { useTheme } from '@/app/theme/ThemeContext';

const API_URL = API_BASE_URL;

export default function MustSellScreen() {
  const { theme, colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const params = useLocalSearchParams();
  const editItemId = params.editItemId as string | undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [showGoat, setShowGoat] = useState(false);
  const [weightLbs, setWeightLbs] = useState('1.0');
  const [gender, setGender] = useState<string>('unisex');
  const [durationHours, setDurationHours] = useState('24');
  const [condition, setCondition] = useState('good');
  const [rarity, setRarity] = useState('common');
  const [loading, setLoading] = useState(false);

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

        // Safety check: Ensure this is actually a must_sell item
        if (item.selling_strategy !== 'must_sell') {
          Alert.alert('Error', 'This item cannot be edited as a Must Sell listing.');
          router.back();
          return;
        }
console.log("🐐 FULL ITEM:", item);

        setName(item.name || '');
        setDescription(item.description || '');

        // Set category from item data
        if (item.category_id) {
          setCategoryId(item.category_id.toString());
          const cat = QUICK_CATEGORIES.find(c => c.id === item.category_id.toString());
          setCategoryName(cat?.name || '');
        }

        setTags(item.tags || '');
        setCondition(item.condition || 'good');
        setRarity(item.rarity || 'common');
        setWeightLbs(item.weight_lbs?.toString() || '1.0');
        setGender(item.gender || 'unisex');
        setDurationHours(item.duration_hours?.toString() || '24');

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
    if (!name || !description || !categoryId || imageUris.length === 0 || !durationHours) {
      Alert.alert('Missing Fields', 'Please fill out all fields, select a category, and upload at least one photo');
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

    // Layer 1: Client-side Content Moderation
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

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      Alert.alert('Error', 'You must be logged in to create a listing.');
      router.push('/login');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('estimated_value', '0');
    formData.append('condition', condition);
    formData.append('duration_hours', durationHours);
    formData.append('tags', tags);
    formData.append('rarity', rarity);
    formData.append('weight_lbs', weightLbs);
    formData.append('category_id', categoryId);
    formData.append('gender', gender);
    formData.append('selling_strategy', 'must_sell');

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
        res = await fetch(`${API_URL}/api/must-sell`, {
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

        triggerGoat(0);
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
          setCategoryId('');
          setCategoryName('');
          setTags('');
          setImageUris([]);
          setCondition('good');
          setRarity('common');
          setDurationHours('24');

          // Show success and redirect to review
          Alert.alert(
            'Success! 🎉',
            'Your Must Sell listing will be live in an hour! Want to preview it?',
            [
              {
                text: 'Preview Now',
                onPress: () => router.push(`/seller/review-item/${itemId}` as any),
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => router.push('/(tabs)/MyAuctionScreen' as any),
              },
            ],
            { cancelable: false }
          );
        }
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.error || 'Failed to save Must Sell listing');
      }
    } catch (error) {
      console.error('Must Sell listing error:', error);
      Alert.alert('Network Error', 'Could not reach the server.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} />

      <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>{editItemId ? 'Edit Must Sell' : 'Must Sell'}</Text>
            <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#999' : '#718096' }]}>{editItemId ? 'Update your listing details' : 'No reserve - highest bidder wins!'}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
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
                triggerGoat(0);
              }
            }}
            title="Upload Item Photos"
            subtitle="Add up to 5 photos"
          />

          {/* Image Validation Feedback */}
          {imageUris.length > 0 && (
            <ImageValidationFeedback validation={imageValidation} />
          )}

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⚡ Must Sell Listing</Text>

          <CharacterCounterInput
            label="Item Name"
            placeholder="Enter item name"
            value={name}
            onChangeText={setName}
            minLength={CHARACTER_LIMITS.NAME_MIN}
            maxLength={CHARACTER_LIMITS.NAME_MAX}
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
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>Condition</Text>
          <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }}>
            <Picker
              selectedValue={condition}
              onValueChange={(value) => setCondition(value)}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
              mode="dropdown"
            >
              <Picker.Item label="New" value="new" />
              <Picker.Item label="Like New" value="like_new" />
              <Picker.Item label="Good" value="good" />
              <Picker.Item label="Fair" value="fair" />
              <Picker.Item label="Poor" value="poor" />
            </Picker>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>⏰ Listing Duration</Text>
          <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }}>
            <Picker
              selectedValue={durationHours}
              onValueChange={(value) => setDurationHours(value)}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
              mode="dropdown"
            >
              <Picker.Item label="24 Hours (Fast Sale)" value="24" />
              <Picker.Item label="48 Hours" value="48" />
              <Picker.Item label="72 Hours (3 Days)" value="72" />
            </Picker>
          </View>

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
          <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }}>
            <Picker
              selectedValue={rarity}
              onValueChange={(value) => setRarity(value)}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
              mode="dropdown"
            >
              <Picker.Item label="Common" value="common" />
              <Picker.Item label="Rare" value="rare" />
              <Picker.Item label="Extremely Rare" value="extremely_rare" />
            </Picker>
          </View>

          <TextInput
            placeholder="Weight (lbs) - for shipping"
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
            value={weightLbs}
            onChangeText={setWeightLbs}
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]}
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>Gender</Text>
          <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }}>
            <Picker
              selectedValue={gender}
              onValueChange={(value) => setGender(value)}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
              mode="dropdown"
            >
              <Picker.Item label="Unisex / Not Specified" value="unisex" />
              <Picker.Item label="👨 Men's" value="men" />
              <Picker.Item label="👩 Women's" value="women" />
            </Picker>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <GoatFlip trigger={goatTrigger || showGoat} bidAmount={lastBidAmount || 0} />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>List Must Sell</Text>
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
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 34,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  label: { marginBottom: 4, fontWeight: '500' },
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
    marginBottom: 12,
    borderRadius: 8,
  },
  tagsInput: {
    minHeight: 80,
    paddingTop: 12,
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
    fontWeight: '600',
  },
});

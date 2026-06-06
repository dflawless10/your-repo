import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Alert, ScrollView, Animated, TouchableOpacity, Pressable,
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from '@expo/vector-icons';
import { useGoatBid } from "@/hooks/useGoatBid";
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { CharacterCounterInput, CHARACTER_LIMITS, validateCharacterCount } from 'app/components/CharacterCounterInput';
import { validateContentQuick } from 'app/utils/contentModeration';
import { useImageValidation } from '@/hooks/useImageValidation';
import ImageValidationFeedback from '@/app/components/ImageValidationFeedback';
import GlobalFooter from "./components/GlobalFooter";
import { API_BASE_URL } from '@/config';
import CategorySelector, { QUICK_CATEGORIES } from '@/app/components/CategorySelector';
import { useTheme } from '@/app/theme/ThemeContext';
import {playGoatSoundByName} from "@/assets/sounds/officialGoatSoundsSoundtrack";
import { Image } from 'expo-image';


const API_URL = API_BASE_URL;

export default function MustSellScreen() {
  const { theme, colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const editItemId = params.editItemId as string | undefined;
  const [showConfetti, setShowConfetti] = useState(false);
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
  const [coverIndex, setCoverIndex] = useState(0);

  // Item-level return policy overrides
  const [returnPolicyOverride, setReturnPolicyOverride] = useState<string>('use_default');
  const [showPolicyOverride, setShowPolicyOverride] = useState(false);

  const { goatTrigger, lastBidAmount, triggerGoat } = useGoatBid();

  const pickImages = async () => {
  if (imageUris.length >= 5) {
    Alert.alert('Maximum Images Reached', 'You can upload up to 5 images.');
    return;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please allow access to your photos.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 1,
  });

  if (!result.canceled) {
    const newUris = result.assets.map(
      (a: ImagePicker.ImagePickerAsset) => a.uri
    );

    const remaining = 5 - imageUris.length;
    const toAdd = newUris.slice(0, remaining);

    setImageUris(prev => [...prev, ...toAdd]);

    if (newUris.length > remaining) {
      Alert.alert('Limit Reached', `Only ${remaining} image(s) were added.`);
    }
  }
};
  //  validation for first image
  const imageValidation = useImageValidation(imageUris.length > 0 ? imageUris[0] : null);

  useEffect(() => {
    // Fade in header title and arrow - wait for screen to fully render first
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000, // 2 seconds - slow and dramatic
        useNativeDriver: true,
      }).start(() => {
        // After fade-in stops, start pulsing animation
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
     void loadItemForEdit();
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

  // Refs for each field to enable auto-scroll
  const categorySelectorRef = useRef<View>(null);
  const nameInputRef = useRef<View>(null);
  const descriptionInputRef = useRef<View>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const rarityPickerRef = useRef<View>(null);
  const weightInputRef = useRef<TextInput>(null);
  const genderPickerRef = useRef<View>(null);

  // Helper function to scroll field into view below EnhancedHeader
  const scrollToField = (ref: React.RefObject<any>) => {
    if (ref.current && scrollViewRef.current) {
      ref.current.measureLayout(
        scrollViewRef.current,
        (x: number, y: number) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - HEADER_MAX_HEIGHT - 10),
            animated: true
          });
        },
        () => {}
      );
    }
  };

  const handleSubmit = async () => {
    // Prevent duplicate submissions
    if (loading) {
      return;
    }

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

    // Set loading state to prevent duplicate submissions
    setLoading(true);

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      Alert.alert('Error', 'You must be logged in to create a listing.');
      setLoading(false);
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
    formData.append('return_policy_override', returnPolicyOverride);
    const primary = imageUris[coverIndex];
    const additional = imageUris.filter((_, i) => i !== coverIndex);
    // Main image (first image)
    // Main image
   formData.append('photo', {
   uri: primary,
   name: 'photo.jpg',
   type: 'image/jpeg',
   } as unknown as Blob);

   // Additional images
   additional.forEach((uri, i) => {
   formData.append(`additional_photo_${i}`, {
    uri,
    name: `extra_${i}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
});

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
            {text: 'OK', onPress: () => {
              setLoading(false);
              router.replace('/(tabs)/MyAuctionScreen');
            }}
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

          // Celebration flow
          // 1. Play goat audio
          await playGoatSoundByName('Victory Baa');

          // 2. Trigger confetti
          setShowConfetti(true);

          // 3. Wait for confetti animation
          setTimeout(() => {
            setLoading(false);
            // 4. Show success alert AFTER confetti
            Alert.alert(
              'Success! 🎉',
              `Your Must Sell listing is live now! It ends in ${durationHours} hours. Want to preview it?`,
              [
                {
                  text: 'Preview Now',
                  onPress: () => router.push(`/seller/review-item/${itemId}`),
                },
                {
                  text: 'Later',
                  style: 'cancel',
                  onPress: () => router.push('/(tabs)/MyAuctionScreen'),
                },
              ],
              {cancelable: false}
            );
          }, 1200);

        }
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.error || 'Failed to save Must Sell listing');
        setLoading(false);
      }
    } catch (error) {
      console.error('Must Sell listing error:', error);
      Alert.alert('Network Error', 'Could not reach the server.');
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        ref={scrollViewRef}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
          <View style={styles.titleWithArrow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
              <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>{editItemId ? 'Edit Must Sell' : 'Must Sell 🔥  '}</Text>
              <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#999' : '#718096' }]}>{editItemId ? 'Update your listing details' : 'No reserve - highest bidder wins!'}</Text>
            </View>
          </View>
        </Animated.View>

          <View ref={categorySelectorRef}>
            <CategorySelector
              selectedCategory={categoryId}
              onSelectCategory={(id, name) => {
                setCategoryId(id);
                setCategoryName(name);
                // Scroll category into view after selection
                setTimeout(() => scrollToField(categorySelectorRef), 100);
              }}
              required={true}
              showSelectedBanner={true}
            />
          </View>


          {/* ------------------ IMAGE SECTION (Diamond Behavior) ------------------ */}

<Text
  style={[
    styles.label,
    { color: theme === 'dark' ? '#E2E8F0' : '#2D3748' }
  ]}
>
  📸 {imageUris.length}/5️⃣  Photos Uploaded
</Text>


<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={{ marginBottom: 16, height: 240 }}
  contentContainerStyle={{ flexGrow: 1, justifyContent: imageUris.length === 0 ? 'center' : 'flex-start', alignItems: 'center' }}
>
  {imageUris.map((uri, index) => (
    <View key={index} style={styles.imageWrapper}>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
      />

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Delete Image',
            'Are you sure you want to remove this image?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  const updated = imageUris.filter((_, i) => i !== index);
                  setImageUris(updated);

                  // Adjust cover index
                  if (coverIndex === index) setCoverIndex(0);
                  else if (coverIndex > index) setCoverIndex(coverIndex - 1);
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>

      {/* Cover Toggle */}
      <TouchableOpacity
        style={[
          styles.coverToggle,
          coverIndex === index && styles.coverToggleActive,
        ]}
        onPress={() => {
          setCoverIndex(index);
          Alert.alert('Cover Image Set', `Image ${index + 1} is now your cover.`);
        }}
      >
        <Text style={styles.coverToggleText}>
          {coverIndex === index ? '✅ Cover Image' : 'Set as Cover'}
        </Text>
      </TouchableOpacity>
    </View>
  ))}

  {/* Add More Button */}
  {imageUris.length < 5 && (
  <View
    style={[
     styles.uploadBadgeContainer,
    {
      backgroundColor: colors.background,
      borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0'
    }
  ]}
  >
    <Pressable onPress={pickImages} style={styles.uploadBadgeWrapper}>
      <Image
        source={require('assets/images/upload-your-gallery.png')}
        style={{ width: 120, height: 120, resizeMode: 'contain' }}
      />
    </Pressable>
  </View>
)}
</ScrollView>

{/* Fullscreen Viewer */}
{imageUris.length > 0 && (
  <TouchableOpacity
    style={styles.fullscreenButton}
    onPress={() =>
      router.push({
        pathname: '/FullImageScreen',
        params: {
          mediaArray: JSON.stringify(imageUris),
          index: coverIndex.toString(),
          title: name || 'Item Photos',
        },
      })
    }
  >
    <Text style={styles.fullscreenText}>🔍 View Fullscreen</Text>
  </TouchableOpacity>
)}

{/* Validation */}
{imageUris.length > 0 && (
  <ImageValidationFeedback validation={imageValidation} />
)}


          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⚡ Must Sell Listing</Text>

          <View ref={nameInputRef}>
            <CharacterCounterInput
              label="Item Name"
              placeholder="Enter item name"
              value={name}
              onChangeText={setName}
              minLength={CHARACTER_LIMITS.NAME_MIN}
              maxLength={CHARACTER_LIMITS.NAME_MAX}
              onFocus={() => scrollToField(nameInputRef)}
            />
          </View>

          <View ref={descriptionInputRef}>
            <CharacterCounterInput
              label="➡️Description"
              placeholder="Describe your item in detail (condition, materials, size, unique features...)"
              value={description}
              onChangeText={setDescription}
              minLength={CHARACTER_LIMITS.DESCRIPTION_MIN}
              maxLength={CHARACTER_LIMITS.DESCRIPTION_MAX}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              helpText="💡 Great descriptions include: condition, materials, measurements, brand (if applicable), and what makes this item special"
              onFocus={() => scrollToField(descriptionInputRef)}
            />
          </View>

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

          <Text style={[styles.label, { color: colors.textPrimary }]}>🏪 Listing Duration</Text>
          <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }}>
            <Picker
              selectedValue={durationHours}
              onValueChange={(value) => setDurationHours(value)}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
              mode="dropdown"
            >
              <Picker.Item label="🏪 Hours (Fast Sale)" value="24" />
              <Picker.Item label="48 Hours" value="48" />
              <Picker.Item label="72 Hours (3 Days)" value="72" />
            </Picker>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📝 Item Details</Text>
          <TextInput
            ref={tagsInputRef}
            placeholder="Tags (comma-separated)"
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
            value={tags}
            onChangeText={setTags}
            style={[styles.input, styles.tagsInput, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => scrollToField(tagsInputRef)}
          />

          {/* Item Rarity Dropdown */}
          <View ref={rarityPickerRef}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Item Rarity</Text>
            <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }}>
              <Picker
                selectedValue={rarity}
                onValueChange={(value) => setRarity(value)}
                style={[styles.picker, { color: colors.textPrimary }]}
                dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
                mode="dropdown"
                onFocus={() => scrollToField(rarityPickerRef)}
              >
                <Picker.Item label="Common" value="common" />
                <Picker.Item label="Rare" value="rare" />
                <Picker.Item label="Extremely Rare" value="extremely_rare" />
              </Picker>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>🚚 Shipping Weight</Text>
          <TextInput
            ref={weightInputRef}
            placeholder="Weight (lbs) - for shipping"
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
            value={weightLbs}
            onChangeText={setWeightLbs}
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }]}
            onFocus={() => scrollToField(weightInputRef)}
          />

          <View ref={genderPickerRef}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Gender</Text>
            <View style={{ backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' }}>
              <Picker
                selectedValue={gender}
                onValueChange={(value) => setGender(value)}
                style={[styles.picker, { color: colors.textPrimary }]}
                dropdownIconColor={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
                mode="dropdown"
                onFocus={() => scrollToField(genderPickerRef)}
              >
                <Picker.Item label="Unisex 🧑‍🤝‍🧑 Not Specified" value="unisex" />
                <Picker.Item label="👨 Men's" value="men" />
                <Picker.Item label="👩 Women's" value="women" />
              </Picker>
            </View>
          </View>

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
            <Ionicons name={showPolicyOverride ? 'chevron-up' : 'chevron-down'} size={20} color="#6A0DAD" />
          </TouchableOpacity>

          {showPolicyOverride && (
            <View style={[styles.overridePanel, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', borderColor: theme === 'dark' ? '#3C3C3E' : '#E0E0E0' }]}>
              <Text style={[styles.overrideLabel, { color: colors.textPrimary }]}>Return Policy for THIS Item Only:</Text>
              <Picker
                selectedValue={returnPolicyOverride}
                onValueChange={(value) => setReturnPolicyOverride(value)}
                style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary }]}
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

        {/* BUTTON ROW */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelButton, {
              backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC',
              borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0'
            }]}
            onPress={() => {
              Alert.alert(
                'Cancel Listing',
                'Are you sure you want to cancel? Your entered information will be lost.',
                [
                  { text: 'Keep Editing', style: 'cancel' },
                  {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => router.back()
                  }
                ]
              );
            }}
          >
            <Ionicons name="close-circle" size={20} color={theme === 'dark' ? '#999' : '#718096'} />
            <Text style={[styles.cancelButtonText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.submitButtonText}>Creating...</Text>
                <Ionicons name="hourglass-outline" size={20} color="#FFF" />
              </View>
            ) : (
              <Text style={styles.submitButtonText}>List Must Sell</Text>
            )}
          </TouchableOpacity>
        </View>
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
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
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 24,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#718096',
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
  imageWrapper: {
  width: 220,
  height: 220,
  borderRadius: 16,
  backgroundColor: '#e0e0e0',
  marginRight: 12,
  overflow: 'hidden',
  position: 'relative',
},
image: {
  width: '100%',
  height: '100%',
  borderRadius: 16,
},
deleteButton: {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: '#ffffffee',
  borderRadius: 12,
  padding: 2,
},
coverToggle: {
  position: 'absolute',
  bottom: 8,
  left: 8,
  backgroundColor: '#ffffffcc',
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 6,
},
coverToggleActive: {
  backgroundColor: '#0077cc',
},
coverToggleText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#2c3e50',
},
addMoreImageCard: {
  width: 220,
  height: 220,
  borderRadius: 16,
  backgroundColor: '#F7FAFC',
  borderWidth: 2,
  borderColor: '#6A0DAD',
  borderStyle: 'dashed',
  marginRight: 12,
  justifyContent: 'center',
  alignItems: 'center',
},
addMoreCardText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#6A0DAD',
  marginTop: 8,
},
fullscreenButton: {
  marginTop: 12,
  alignSelf: 'center',
  backgroundColor: '#EDF2F7',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},
fullscreenText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2D3748',
},
uploadBadgeWrapper: {
  alignItems: 'center',
  justifyContent: 'center',
},
  uploadBadgeContainer: {
  width: 160,
  height: 200,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  borderWidth: 2,
},
});

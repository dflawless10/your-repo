import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  Alert, ScrollView, Animated, TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from '@expo/vector-icons';
import { useGoatBid } from "@/hooks/useGoatBid";
import { GoatFlip } from "@/components/GoatAnimator/goatFlip";
import { useRouter } from 'expo-router';
import ImageUploader from '@/components/ImageUploader';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { CharacterCounterInput, CHARACTER_LIMITS, validateCharacterCount } from 'app/components/CharacterCounterInput';
import { handleListingSuccess } from 'app/utils/formHelpers';
import { validateContentQuick } from 'app/utils/contentModeration';
import { useImageValidation } from '@/hooks/useImageValidation';
import ImageValidationFeedback from '@/app/components/ImageValidationFeedback';


const API_URL = 'http://10.0.0.170:5000';

function ItemScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    { id: number; name: string; emoji: string }[]
  >([]);
  const [showGoat, setShowGoat] = useState(false);
  const [rarity, setRarity] = useState('common');
  const [weightLbs, setWeightLbs] = useState('1.0');
  const [gender, setGender] = useState<string>('unisex');
  const [durationDays, setDurationDays] = useState(7);

  const { goatTrigger, lastBidAmount, triggerGoat } = useGoatBid();
  const router = useRouter();

  // Image validation for first image
  const imageValidation = useImageValidation(imageUris.length > 0 ? imageUris[0] : null);



  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) setCategory(data[0].id);
      })
      .catch(err => console.error("Failed to load categories:", err));
  }, []);

  const handleBidConfirm = () => {
    setShowGoat(true);
    setTimeout(() => setShowGoat(false), 2000);
  };

  const handleSubmit = async () => {
  if (!name || !description || !price || !category || imageUris.length === 0) {
    Alert.alert('Missing Fields', 'Please fill out all fields and upload at least one photo');
    return;
  }

    // Validate name length
    const nameValidation = validateCharacterCount(name, CHARACTER_LIMITS.NAME_MIN, CHARACTER_LIMITS.NAME_MAX, 'Item name');
    if (!nameValidation.isValid) {
      Alert.alert('Item Name Invalid', nameValidation.errorMessage!);
      return;
    }

    // Validate description length
    const descValidation = validateCharacterCount(description, CHARACTER_LIMITS.DESCRIPTION_MIN, CHARACTER_LIMITS.DESCRIPTION_MAX, 'Description');
    if (!descValidation.isValid) {
      Alert.alert('Description Invalid', descValidation.errorMessage! + '\n\n💡 Tip: Describe the item\'s condition, materials, size, and any unique features.');
      return;
    }

    // Layer 1: Client-side Content Moderation
    const nameModeration = validateContentQuick(name, 'Item name');
    if (!nameModeration.isValid) {
      Alert.alert('Content Policy Violation', nameModeration.errorMessage!);
      return;
    }

    const descModeration = validateContentQuick(description, 'Description');
    if (!descModeration.isValid) {
      Alert.alert('Content Policy Violation', descModeration.errorMessage!);
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');


      const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('category_id', category.toString());
  formData.append('tags', tags);
  formData.append('rarity', rarity);
  formData.append('weight_lbs', weightLbs);
  formData.append('gender', gender);
  formData.append('duration_hours', String(durationDays * 24));  // Convert days to hours
  formData.append('buy_it_now', price);  // Buy it now price is the listed price

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
    const res = await fetch(`${API_URL}/item`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,

    });

    if (res.ok) {
      const responseData = await res.json();
      const itemId = responseData.item_id;

      triggerGoat(Number(price));
      handleBidConfirm();

      // Clear form
      setName('');
      setDescription('');
      setPrice('');
      setCategory(null);
      setTags('');
      setImageUris([]);

      // Show success and redirect
      handleListingSuccess(itemId, router, 'Buy It Now listing');
    }
  } catch (error) {
    console.error('Listing error:', error);
    Alert.alert('Network Error', 'Could not reach the server.');
  }
};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitleText}>Buy It Now</Text>
            <Text style={styles.headerSubtitle}>List your item for instant purchase</Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Text style={styles.label}>Select Category</Text>
      <Picker
        selectedValue={category}
        onValueChange={(value) => setCategory(value)}
        style={styles.picker}
      >
        {categories.map((cat) => (
          <Picker.Item
            key={cat.id}
            label={`${cat.emoji} ${cat.name}`}
            value={cat.id}
          />
        ))}
      </Picker>

      <ImageUploader
        maxImages={5}
        imageUris={imageUris}
        onImagesChange={(uris) => {
          setImageUris(uris);
          if (uris.length > 0) {
            triggerGoat(Number(price));
          }
        }}
        title="Upload Item Photos"
        subtitle="Add up to 5 photos"
      />

      {/* Image Validation Feedback */}
      {imageUris.length > 0 && (
        <ImageValidationFeedback validation={imageValidation} />
      )}

      <Text style={styles.sectionTitle}>💰 Buy It Now Listing</Text>

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
      <TextInput placeholder="Price ($)" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>⏰ Listing Duration</Text>
      <Picker
        selectedValue={durationDays}
        onValueChange={(value) => setDurationDays(value)}
        style={styles.picker}
      >
        <Picker.Item label="7 Days" value={7} />
        <Picker.Item label="14 Days" value={14} />
        <Picker.Item label="30 Days" value={30} />
      </Picker>

      <Text style={styles.sectionTitle}>📦 Item Details</Text>
      <TextInput placeholder="Tags (comma-separated)" value={tags} onChangeText={setTags} style={styles.input} />
      <TextInput placeholder="Rarity (e.g. common, rare, legendary)" value={rarity} onChangeText={setRarity} style={styles.input} />
      <TextInput placeholder="Weight (lbs) - for shipping" value={weightLbs} onChangeText={setWeightLbs} keyboardType="decimal-pad" style={styles.input} />

      <Text style={styles.label}>Gender</Text>
      <Picker
        selectedValue={gender}
        onValueChange={(value) => setGender(value)}
        style={styles.picker}
      >
        <Picker.Item label="Unisex / Not Specified" value="unisex" />
        <Picker.Item label="👨 Men's" value="men" />
        <Picker.Item label="👩 Women's" value="women" />
      </Picker>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <GoatFlip trigger={goatTrigger || showGoat} bidAmount={lastBidAmount || Number(price)} />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>List Item</Text>
      </TouchableOpacity>
      </Animated.ScrollView>
    </View>
    </KeyboardAvoidingView>
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
});
export default ItemScreen;

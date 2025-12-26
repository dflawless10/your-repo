import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
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


const API_URL = 'http://10.0.0.170:5000';

 function CreateAuctionForm() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [startPrice, setStartPrice] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [tags, setTags] = useState('');
  const [rarity, setRarity] = useState('common');
  const [reservePrice, setReservePrice] = useState('');
  const [weightLbs, setWeightLbs] = useState('1.0');
  const [category, setCategory] = useState<number | null>(null);
  const [gender, setGender] = useState<string>('unisex');
  const [categories, setCategories] = useState<
    { id: number; name: string; emoji: string }[]
  >([]);

  // Image validation for first image
  const imageValidation = useImageValidation(imageUris.length > 0 ? imageUris[0] : null);

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setCategory(data[0].id);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const handleSubmit = async () => {
    // Validate required fields
    if (!name || !description || !category || !startPrice || !durationHours || imageUris.length === 0) {
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

    // Content Moderation
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
    formData.append('category_id', category.toString());
    formData.append('price', startPrice);
    formData.append('tags', tags);
    formData.append('duration_hours', durationHours || '96');
    formData.append('rarity', rarity || 'common');
    formData.append('reserve_price', reservePrice || '');
    formData.append('weight_lbs', weightLbs);
    formData.append('gender', gender);

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

        // Clear form
        setName('');
        setDescription('');
        setStartPrice('');
        setDurationHours('');
        setTags('');
        setRarity('common');
        setReservePrice('');
        setCategory(null);
        setImageUris([]);

        // Show a success message and redirect to item detail
        handleListingSuccess(itemId, router, 'auction');
      } else {
        const msg = await res.text();
        Alert.alert('Error', msg);
      }
    } catch (error) {
      console.error('Listing error:', error);
      Alert.alert('Network Error', 'Could not reach the server.');
    }
  };

  return (
  <View style={{ flex: 1 }}>
    <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
    
    {/* Title with Back Arrow */}
    <View style={styles.headerTitleContainer}>
      <View style={styles.titleWithArrow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Auction</Text>
      </View>
    </View>

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: 240, paddingBottom: 200 }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Text style={styles.label}>Select Category</Text>

        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
          style={styles.picker}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={`${cat.emoji} ${cat.name}`} value={cat.id} />
          ))}
        </Picker>

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

        <Text style={styles.sectionTitle}>🎯 Auction Details</Text>

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
        <TextInput placeholder="Starting Bid Price ($)" value={startPrice} onChangeText={setStartPrice} keyboardType="numeric" style={styles.input} />
        <TextInput placeholder="Auction Duration (hours)" value={durationHours} onChangeText={setDurationHours} keyboardType="numeric" style={styles.input} />
        <TextInput placeholder="Reserve Price (minimum to sell, optional)" value={reservePrice} onChangeText={setReservePrice} keyboardType="numeric" style={styles.input} />

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

        <View style={styles.buttonContainer}>
          <Button title="Create Auction" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
     <GlobalFooter />
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 48,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
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
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
});

export default CreateAuctionForm;

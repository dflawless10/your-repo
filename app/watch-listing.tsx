import { API_BASE_URL } from '@/config';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { CharacterCounterInput, CHARACTER_LIMITS, validateCharacterCount } from 'app/components/CharacterCounterInput';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useImageValidation } from '@/hooks/useImageValidation';
import ImageValidationFeedback from '@/app/components/ImageValidationFeedback';
import { useTheme } from '@/app/theme/ThemeContext';


type Props = {
  visible: boolean;
  title: string;
  appraisedValue: string; // e.g. "12500"
  condition?: string;     // e.g. "New" / "Used" / "Excellent"
  onClose: () => void;
  onPickPhotos: () => void;
};

export default function WatchListingScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();

  // Debug: Log all params
  console.log('🐐 Watch listing params:', params);
  console.log('🐐 additionalImages param:', params.additionalImages);

  // Parse watchSpecs from URL parameter
  let parsedWatchSpecs: any = {};
  try {
    if (params.watchSpecs && typeof params.watchSpecs === 'string') {
      parsedWatchSpecs = JSON.parse(decodeURIComponent(params.watchSpecs as string));
      console.log('📊 Parsed watch specs from params:', parsedWatchSpecs);
    }
  } catch (e) {
    console.error('Failed to parse watchSpecs:', e);
  }

  const [title, setTitle] = useState(`${params.brand} ${params.model}`);
  const [description, setDescription] = useState<string>('');
  const [imageUris, setImageUris] = useState<string[]>([]);

  // Default starting bid to 60% of appraised value for better auction dynamics
  const defaultStartingBid = params.price
    ? (parseFloat(params.price as string) * 0.6).toFixed(0)
    : '';
  const [startingBid, setStartingBid] = useState(defaultStartingBid);
  const [duration, setDuration] = useState('7');

  // Advanced auction options
  const [hasReserve, setHasReserve] = useState(false);
  const [reservePrice, setReservePrice] = useState('');
  const [hasBuyItNow, setHasBuyItNow] = useState(false);
  const [buyItNowPrice, setBuyItNowPrice] = useState('');
  const [isMustSell, setIsMustSell] = useState(false);

  // Header state
  const [username, setUsername] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Image validation for first image
  const imageValidation = useImageValidation(imageUris.length > 0 ? imageUris[0] : null);

  useEffect(() => {
    const loadUsername = async () => {
      const name = await AsyncStorage.getItem('username');
      setUsername(name);
    };
    loadUsername();
  }, []);

    // Normalize preview URIs
const previewUris: string[] =
  imageUris.length > 0
    ? imageUris
    : params.imageUrl
      ? [params.imageUrl as string]
      : [];

  const pickImages = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required to access photos');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,   // ✅ new API
  quality: 0.8,
  allowsMultipleSelection: true,              // ✅ multiple
  // ❌ drop allowsEditing (conflicts with multiple)
});


  if (!result.canceled && result.assets?.length) {
    const uris = result.assets.map(asset => asset.uri);
    setImageUris(prev => [...prev, ...uris]); // ✅ append
  }
};





useEffect(() => {
  console.log('🖼️ Image URI updated:', imageUris);
}, [imageUris]);



  const handleCreateListing = async () => {
  if (!title || !description || !startingBid) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  // Validate Must Sell constraints
  if (isMustSell) {
    const durationNum = parseInt(duration);
    if (durationNum < 24 || durationNum > 72) {
      Alert.alert('Error', 'Must Sell duration must be 24, 48, or 72 hours');
      return;
    }
    if (hasReserve || hasBuyItNow) {
      Alert.alert('Error', 'Must Sell mode cannot have Reserve Price or Buy It Now options');
      return;
    }
  }

  // Validate Reserve Price
  if (hasReserve && reservePrice) {
    const reserve = parseFloat(reservePrice);
    const starting = parseFloat(startingBid);
    const appraised = params.price ? parseFloat(params.price as string) : starting;

    if (reserve < starting) {
      Alert.alert('Error', 'Reserve price must be greater than or equal to starting bid');
      return;
    }

    if (reserve > appraised) {
      Alert.alert('Error', `Reserve price cannot exceed appraised value of $${appraised.toLocaleString()}`);
      return;
    }
  }

  // Validate Buy It Now Price
  if (hasBuyItNow && buyItNowPrice) {
    const buyNow = parseFloat(buyItNowPrice);
    const starting = parseFloat(startingBid);
    const reserve = hasReserve && reservePrice ? parseFloat(reservePrice) : starting;
    if (buyNow <= reserve) {
      Alert.alert('Error', 'Buy It Now price must be greater than reserve price (or starting bid if no reserve)');
      return;
    }
  }

  // Character count validation with moderation
  const titleValidation = validateCharacterCount(title, CHARACTER_LIMITS.NAME_MIN, CHARACTER_LIMITS.NAME_MAX, 'Title');
  if (!titleValidation.isValid) {
    Alert.alert('Title Invalid', titleValidation.errorMessage);
    return;
  }

  const descValidation = validateCharacterCount(description, CHARACTER_LIMITS.DESCRIPTION_MIN, CHARACTER_LIMITS.DESCRIPTION_MAX, 'Description');
  if (!descValidation.isValid) {
    Alert.alert('Description Invalid', descValidation.errorMessage);
    return;
  }

if (previewUris.length === 0) {
  Alert.alert('Error', 'Please upload a photo of your watch first.');
  return;
}

try {
  const formData = new FormData();
  formData.append('name', title);
  formData.append('description', description);
  formData.append('category', 'watch');
  formData.append('category_id', '2');
  formData.append('tags', `watch,${params.brand},${params.model}`);
  formData.append('rarity', 'collectible');
  formData.append('duration_hours', duration);

  // 🐐 Watch Specifications JSON - Use parsed specs from URL parameter
  formData.append('watch_specifications', JSON.stringify(parsedWatchSpecs));
  console.log('📊 Watch specifications being sent:', parsedWatchSpecs);

  // 🐐 Price - always use starting bid as the price field
  formData.append('price', parseFloat(startingBid).toString());
  console.log('price:', parseFloat(startingBid));

  // Advanced auction options
  if (hasReserve && reservePrice) {
    formData.append('reserve_price', parseFloat(reservePrice).toString());
    console.log('reserve_price:', parseFloat(reservePrice));
  }

  if (hasBuyItNow && buyItNowPrice) {
    formData.append('buy_it_now', parseFloat(buyItNowPrice).toString());
    console.log('buy_it_now:', parseFloat(buyItNowPrice));
  }

  if (isMustSell) {
    formData.append('is_must_sell', '1');
    console.log('is_must_sell: 1');
  }

  // Handle the main image file
  const imageUri = params.imageUrl as string;
  const filename = imageUri.split('/').pop() || 'watch.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('photo', {
    uri: imageUri,
    name: filename,
    type: type,
  } as any);
  console.log('photo:', imageUri, filename, type);

  // Handle additional images (backend expects keys like "additional_photo_0", "additional_photo_1", etc.)
  if (params.additionalImages) {
    try {
      const additionalImagesArray = JSON.parse(params.additionalImages as string);
      console.log('Additional images to upload:', additionalImagesArray.length);

      for (let i = 0; i < additionalImagesArray.length; i++) {
        const addUri = additionalImagesArray[i];
        const addFilename = addUri.split('/').pop() || `watch_${i + 1}.jpg`;
        const addMatch = /\.(\w+)$/.exec(addFilename);
        const addType = addMatch ? `image/${addMatch[1]}` : 'image/jpeg';

        formData.append(`additional_photo_${i}`, {
          uri: addUri,
          name: addFilename,
          type: addType,
        } as any);
        console.log(`Additional photo ${i}:`, addUri, addFilename, addType);
      }
    } catch (error) {
      console.error('Error parsing additional images:', error);
    }
  }



    console.log('📤 Uploading watch listing:', {
      name: title,
      price: startingBid || buyItNowPrice,
      buy_it_now: buyItNowPrice,
      duration,
    });

    const response = await fetch(`${API_BASE_URL}/create_item`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const responseData = await response.json();
    console.log('📥 Server response:', responseData);

    if (response.ok) {
      let successMessage = '⌚ Watch listed successfully!';

      if (hasReserve && reservePrice) {
        successMessage += `\n🔒 Reserve price set at $${parseFloat(reservePrice).toLocaleString()}`;
      }
      if (hasBuyItNow && buyItNowPrice) {
        successMessage += `\n⚡ Buy It Now price: $${parseFloat(buyItNowPrice).toLocaleString()}`;
      }
      if (isMustSell) {
        successMessage += `\n🔥 Must Sell mode activated (${duration} days)`;
      }

      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => router.push('/(tabs)/MyAuctionScreen') },
      ]);
    } else {
      Alert.alert('Error', responseData.error || 'Failed to create listing');
    }
  } catch (error) {
    console.error('🐐 Listing error:', error);
    Alert.alert('Error', `Failed to create listing: ${error instanceof Error ? error.message : 'Please try again.'}`);
  }
};




  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 150, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Title with Back Button */}
        <View style={[styles.pageHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>List Your Watch</Text>
        </View>

      {/* Watch Preview Card */}
      <View style={[styles.previewCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
        <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>⌚ Your Watch Preview</Text>
        <View style={styles.watchInfo}>
          <Text style={[styles.watchBrand, { color: colors.textPrimary }]}>{params.brand} {params.model}</Text>
          <Text style={styles.watchPrice}>💰 Estimated: ${params.price}</Text>
        <View style={styles.watchInfo}>
  <Text style={[styles.watchBrand, { color: colors.textPrimary }]}>{params.brand} {params.model}</Text>

</View>

        </View>

     <View style={styles.imageRow}>
  {previewUris.length > 0 ? (
    previewUris.map((uri: string, idx: number) => (
      <Image
        key={idx}
        source={{ uri }}
        style={{ width: 200, height: 200, borderRadius: 12, marginRight: 8 }}
      />
    ))
  ) : (
    <View style={styles.placeholderImage}>
      <Text>No images selected</Text>
    </View>
  )}
</View>

        <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {imageUris ? 'Change Photo' : 'Upload Photo'}
          </Text>
        </TouchableOpacity>

        {/* Image Validation Feedback */}
        {imageUris.length > 0 && (
          <ImageValidationFeedback validation={imageValidation} />
        )}
      </View>

      <View style={[styles.form, { backgroundColor: colors.background }]}>
        <CharacterCounterInput
          label="Title"
          placeholder="e.g., Rolex Submariner"
          value={title}
          onChangeText={setTitle}
          minLength={CHARACTER_LIMITS.NAME_MIN}
          maxLength={CHARACTER_LIMITS.NAME_MAX}
          helpText="Give your watch a clear, descriptive title"
        />

        <CharacterCounterInput
          label="Description"
          placeholder="Describe your watch..."
          value={description}
          onChangeText={setDescription}
          minLength={CHARACTER_LIMITS.DESCRIPTION_MIN}
          maxLength={CHARACTER_LIMITS.DESCRIPTION_MAX}
          helpText="Provide detailed information about condition, authenticity, and features"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />


        <Text style={[styles.label, { color: colors.textPrimary }]}>Starting Bid ($) *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
          value={startingBid}
          onChangeText={setStartingBid}
          placeholder="0.00"
          placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
          keyboardType="decimal-pad"
        />
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#6A0DAD" />
          <Text style={styles.infoText}>
            This is the minimum opening bid. Set it below appraisal value to attract bidders. You can add a Buy It Now price below for instant purchase.
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Auction Duration (days) *</Text>
        <View style={styles.durationRow}>
          {['3','7', '14', '30'].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.durationButton,
                duration === days && styles.durationButtonActive,
              ]}
              onPress={() => setDuration(days)}
            >
              <Text
                style={[
                  styles.durationText,
                  duration === days && styles.durationTextActive,
                ]}
              >
                {days} days
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Advanced Auction Options */}
        <View style={[styles.advancedOptionsContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}>
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>⌚ Advanced Options</Text>

          {/* Reserve Price Option */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              if (!isMustSell && !hasBuyItNow) {
                setHasReserve(!hasReserve);
                if (hasReserve) setReservePrice('');
              }
            }}
            disabled={isMustSell || hasBuyItNow}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, hasReserve && styles.checkboxActive, (isMustSell || hasBuyItNow) && styles.checkboxDisabled]}>
                {hasReserve && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.optionLabel, { color: (isMustSell || hasBuyItNow) ? (theme === 'dark' ? '#666' : '#CBD5E0') : colors.textPrimary }]}>Set Reserve Price</Text>
            </View>
            <Ionicons name="shield-checkmark" size={20} color={(isMustSell || hasBuyItNow) ? "#CBD5E0" : "#6A0DAD"} />
          </TouchableOpacity>
          {hasReserve && !isMustSell && !hasBuyItNow && (
            <View style={styles.optionInputContainer}>
              <Text style={[styles.optionHelpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Minimum price you will accept (hidden from buyers)</Text>
              {params.price && (
                <View style={styles.quickSelectRow}>
                  <TouchableOpacity
                    style={styles.quickSelectButton}
                    onPress={() => setReservePrice((parseFloat(params.price as string) * 0.70).toFixed(0))}
                  >
                    <Text style={styles.quickSelectText}>70%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSelectButton}
                    onPress={() => setReservePrice((parseFloat(params.price as string) * 0.80).toFixed(0))}
                  >
                    <Text style={styles.quickSelectText}>80%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSelectButton}
                    onPress={() => setReservePrice((parseFloat(params.price as string) * 0.90).toFixed(0))}
                  >
                    <Text style={styles.quickSelectText}>90%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSelectButton}
                    onPress={() => setReservePrice((parseFloat(params.price as string) * 0.95).toFixed(0))}
                  >
                    <Text style={styles.quickSelectText}>95%</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={[styles.optionInput, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
                value={reservePrice}
                onChangeText={setReservePrice}
                placeholder="0.00"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Buy It Now Option */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              if (!isMustSell) {
                setHasBuyItNow(!hasBuyItNow);
                if (hasBuyItNow) {
                  setBuyItNowPrice('');
                } else {
                  // When enabling Buy It Now, disable and clear Reserve Price
                  setHasReserve(false);
                  setReservePrice('');
                }
              }
            }}
            disabled={isMustSell}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, hasBuyItNow && styles.checkboxActive, isMustSell && styles.checkboxDisabled]}>
                {hasBuyItNow && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.optionLabel, { color: isMustSell ? (theme === 'dark' ? '#666' : '#CBD5E0') : colors.textPrimary }]}>Buy It Now Price</Text>
            </View>
            <Ionicons name="flash" size={20} color={isMustSell ? "#CBD5E0" : "#FF6B35"} />
          </TouchableOpacity>
          {hasBuyItNow && !isMustSell && (
            <View style={styles.optionInputContainer}>
              <Text style={[styles.optionHelpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Let buyers purchase instantly at this price</Text>
              <TextInput
                style={[styles.optionInput, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
                value={buyItNowPrice}
                onChangeText={setBuyItNowPrice}
                placeholder="0.00"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* OR Divider */}
          <View style={styles.optionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Must Sell Mode */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              const newMustSell = !isMustSell;
              setIsMustSell(newMustSell);
              if (newMustSell) {
                setHasReserve(false);
                setReservePrice('');
                setHasBuyItNow(false);
                setBuyItNowPrice('');
                setDuration('48'); // Default to 48 hours
              } else {
                setDuration('7'); // Reset to 7 days when disabling
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isMustSell && styles.checkboxActive]}>
                {isMustSell && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Must Sell Mode 🔥</Text>
            </View>
            <Ionicons name="flame" size={20} color="#D97706" />
          </TouchableOpacity>
          {isMustSell && (
            <View style={styles.optionInputContainer}>
              <Text style={[styles.optionHelpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Item MUST sell to highest bidder (no reserve, 24-72 hours only)</Text>
              <View style={styles.mustSellDurationRow}>
                {[{label: '24h', hours: '24'}, {label: '48h', hours: '48'}, {label: '72h', hours: '72'}].map((option) => (
                  <TouchableOpacity
                    key={option.hours}
                    style={[
                      styles.mustSellDurationButton,
                      duration === option.hours && styles.mustSellDurationButtonActive,
                    ]}
                    onPress={() => setDuration(option.hours)}
                  >
                    <Text style={[
                      styles.mustSellDurationText,
                      duration === option.hours && styles.mustSellDurationTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.cancelMustSellButton}
                onPress={() => {
                  setIsMustSell(false);
                  setDuration('7');
                }}
              >
                <Text style={styles.cancelMustSellText}>Cancel Must Sell</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>
            Estimated value: ${params.price}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="cash" size={20} color="#38a169" />
          <Text style={styles.infoText}>
            You will receive 89% after BidGoat fees (8% commission + 3% processing)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCreateListing}
        >
          <Text style={styles.submitButtonText}>⌚ List Watch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  previewCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  watchInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  watchBrand: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  watchPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 12,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#0077cc',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  durationButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  durationTextActive: {
    color: '#FF6B35',
  },
   infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4A5568',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
  // Advanced Auction Options Styles
  advancedOptionsContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  checkboxDisabled: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  optionLabelDisabled: {
    color: '#A0AEC0',
  },
  optionInputContainer: {
    paddingLeft: 36,
    paddingRight: 8,
    paddingBottom: 16,
    marginTop: 8,
  },
  optionHelpText: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickSelectText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  optionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 1,
  },
  mustSellDurationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  mustSellDurationButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  mustSellDurationButtonActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  mustSellDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  mustSellDurationTextActive: {
    color: '#D97706',
  },
  cancelMustSellButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelMustSellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
});

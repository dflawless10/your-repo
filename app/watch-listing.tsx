import { API_BASE_URL } from '@/config';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated, Pressable,
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
import { Image } from 'expo-image';
import GlobalFooter from "@/app/components/GlobalFooter";


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

  const isEditMode = !!params.editItemId;
  const editItemId = params.editItemId as string;

  // Parse watchSpecs from URL parameter
  let parsedWatchSpecs: any = {};
  try {
    if (params.watchSpecs && typeof params.watchSpecs === 'string') {
      parsedWatchSpecs = JSON.parse(decodeURIComponent(params.watchSpecs));
    }
  } catch (e) {
    console.error('Failed to parse watchSpecs:', e);
  }

  const [title, setTitle] = useState<string>(
    isEditMode
      ? (params.name as string || '')
      : `${params.brand} ${params.model}`
  );
  const [description, setDescription] = useState<string>(
    isEditMode ? (params.description as string || '') : ''
  );
  const [imageUris, setImageUris] = useState<string[]>([]);

  const defaultStartingBid = isEditMode
    ? (params.price as string || '')
    : params.price
      ? (Number.parseFloat(params.price as string) * 0.6).toFixed(0)
      : '';
  const [startingBid, setStartingBid] = useState(defaultStartingBid);
  const [duration, setDuration] = useState('7');

  // Advanced auction options
  const [hasReserve, setHasReserve] = useState(false);
  const [reservePrice, setReservePrice] = useState('');
  const [hasBuyItNow, setHasBuyItNow] = useState(false);
  const [buyItNowPrice, setBuyItNowPrice] = useState('');
  const [isMustSell, setIsMustSell] = useState(false);
  const [durationHours, setDurationHours] = useState(30);
  const [coverIndex, setCoverIndex] = useState(0);

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
    void loadUsername();
  }, []);

const pickImages = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required to access photos');
    return;
  }

   const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 1,
  });




  if (!result.canceled) {
    const newUris = result.assets.map(a => a.uri);

    const remaining = 5 - imageUris.length;
    const toAdd = newUris.slice(0, remaining);

    setImageUris(prev => [...prev, ...toAdd]);

    if (newUris.length > remaining) {
      Alert.alert('Limit Reached', `Only ${remaining} image(s) were added.`);
    }
  }
};



 useEffect(() => {
  const existing: string[] = [];

  if (params.imageUrl) existing.push(params.imageUrl as string);

  if (params.additionalImages) {
    try {
      const parsed = JSON.parse(params.additionalImages as string);
      if (Array.isArray(parsed)) existing.push(...parsed);
    } catch (e) {
      console.log('Error parsing additionalImages:', e);
    }
  }

  setImageUris(existing);
}, []);

  useEffect(() => {
    if (!isEditMode) return;
    const rp = params.reservePrice as string;
    if (rp && rp !== '0' && rp !== '') {
      setHasReserve(true);
      setReservePrice(rp);
    }
  }, []);



  const showMustSellConfirmation = () => {
    const appraisedNum = params.price ? Number.parseFloat(params.price as string) : 0;
    const startingBidNum = Number.parseFloat(startingBid) || 0;
    const potentialLoss = appraisedNum - startingBidNum;

    Alert.alert(
      '🐐 BidGoat Must-Sell Terms',
      `📋 IMPORTANT REMINDER - Please Read Carefully:\n\n` +
      `⌚ Appraised Value: $${appraisedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `🔥 Duration: ${duration} hours\n` +
      `⚠️ Potential Loss: $${potentialLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
      `HOW MUST SELL WORKS:\n\n` +
      `✓ Your watch WILL SELL to the highest bidder when time expires\n` +
      `✓ NO RESERVE PRICE — Even if only one bid comes in\n` +
      `✓ NO CANCELLATION — Once listed, you CANNOT cancel\n` +
      `✓ YOU ARE LEGALLY OBLIGATED to sell at the final price\n` +
      `✓ If no bids are received, the item sells at $0 to any taker\n\n` +
      `This creates maximum urgency and attracts bidders, but you accept ALL RISK of selling below appraised value.\n\n` +
      `Do you accept these terms and want to proceed?`,
      [
        { text: 'No, Go Back', style: 'cancel' },
        { text: 'Yes, I Accept Terms', style: 'destructive', onPress: () => submitListing() },
      ],
      { cancelable: true }
    );
  };

  const handleCreateListing = async () => {
  if (!title || !description || (!isMustSell && !hasBuyItNow && !startingBid)) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  // Validate Must-Sell constraints
  if (isMustSell) {
    const hours = Number.parseInt(duration, 10);
    if (hours < 24 || hours > 72) {
      Alert.alert('Error', 'Must Sell duration must be 24, 48, or 72 hours');
      return;
    }
  }


  // Validate Reserve Price
  if (hasReserve && reservePrice) {
    const reserve = Number.parseFloat(reservePrice);
    const starting = Number.parseFloat(startingBid);
    const appraised = params.price ? Number.parseFloat(params.price as string) : starting;

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
    const buyNow = Number.parseFloat(buyItNowPrice);
    const starting = Number.parseFloat(startingBid);
    const reserve = hasReserve && reservePrice ? Number.parseFloat(reservePrice) : starting;
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



  if (isMustSell) {
    showMustSellConfirmation();
    return;
  }

  await submitListing();
};

  let durationToSend = duration;


  if (isMustSell) {
  if (duration === '1') durationToSend = '24';
  if (duration === '2') durationToSend = '48';
  if (duration === '3') durationToSend = '72';
}

const submitListing = async () => {
  try {
    const formData = new FormData();
    formData.append('name', title);
    formData.append('description', description);
    formData.append('category', 'watch');
    formData.append('category_id', '2');
    formData.append('tags', `watch,${params.brand},${params.model}`);
    formData.append('rarity', 'collectible');

    // ✅ Only this — the correct duration
    formData.append('duration_hours', durationToSend);

      // 🐐 Watch Specifications JSON - Use parsed specs from URL parameter
      formData.append('watch_specifications', JSON.stringify(parsedWatchSpecs));
      console.log('📊 Watch specifications being sent:', parsedWatchSpecs);

      // Must Sell has no price; BIN uses the BIN price; auction uses starting bid
      const priceValue = isMustSell ? '0' : hasBuyItNow ? Number.parseFloat(buyItNowPrice).toString() : Number.parseFloat(startingBid).toString();
      formData.append('price', priceValue);
      console.log('price:', priceValue);

      // Advanced auction options
      if (hasReserve && reservePrice) {
        formData.append('reserve_price', Number.parseFloat(reservePrice).toString());
        console.log('reserve_price:', Number.parseFloat(reservePrice));
      }

      if (hasBuyItNow && buyItNowPrice) {
        formData.append('buy_it_now', Number.parseFloat(buyItNowPrice).toString());
        console.log('buy_it_now:', Number.parseFloat(buyItNowPrice));
      }

      if (isMustSell) {
        formData.append('is_must_sell', duration);
        console.log('is_must_sell:', duration);
        if (params.price) {
          formData.append('appraised_price', params.price as string);
        }
      }
      const primary = imageUris[coverIndex];
      const additional = imageUris.filter((_, i) => i !== coverIndex);

      formData.append('photo', {
      uri: primary,
      name: 'photo.jpg',
      type: 'image/jpeg',
      } as any);

      additional.forEach((uri, i) => {
      formData.append(`additional_photo_${i}`, {
       uri,
       name: `extra_${i}.jpg`,
       type: 'image/jpeg',
       } as any);
       });

      console.log('📤 Uploading watch listing:', {
        name: title,
        price: startingBid || buyItNowPrice,
        buy_it_now: buyItNowPrice,
        duration,
      });

      const endpoint = isEditMode
        ? `${API_BASE_URL}/item/${editItemId}`
        : `${API_BASE_URL}/create_item`;

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        const resolvedItemId = isEditMode ? editItemId : responseData.item_id;
        setTimeout(() => {
          Alert.alert(
            'Success! 🎉',
            isEditMode
              ? 'Your watch listing has been updated! Want to preview it?'
              : 'Your watch listing will be live in an hour! Want to preview it?',
            [
              {
                text: 'Preview Now',
                onPress: () => router.push(`/seller/review-item/${resolvedItemId}`),
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => router.push('/(tabs)/MyAuctionScreen'),
              },
            ],
            { cancelable: false }
          );
        }, 1000);
      } else {
        Alert.alert('Error', responseData.error || (isEditMode ? 'Failed to update listing' : 'Failed to create listing'));
      }
    } catch (error) {
      console.error('🐐 Listing error:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} listing: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Title with Back Button */}
        <View style={[styles.pageHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
         <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{isEditMode ? 'Edit Watch Listing' : 'List Your Watch'}</Text>
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
          title: params.title || 'Watch Photos',
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


      {/* Watch Preview Card */}
      <View style={[styles.previewCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
        <Text style={[styles.previewTitle, { color: colors.textPrimary }]}> Your Watch Preview</Text>
        <View style={styles.watchInfo}>
          <Text style={[styles.watchBrand, { color: colors.textPrimary }]}>{params.brand} {params.model}</Text>
          <Text style={styles.watchPrice}>💰 Estimated: ${params.price}</Text>
        <View style={styles.watchInfo}>
  <Text style={[styles.watchBrand, { color: colors.textPrimary }]}>{params.brand} {params.model}</Text>

</View>

        </View>



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
          helpText=" 🧾 Give your watch a clear, descriptive title"
        />

        <CharacterCounterInput
          label="Description"
          placeholder="Describe your watch..."
          value={description}
          onChangeText={setDescription}
          minLength={CHARACTER_LIMITS.DESCRIPTION_MIN}
          maxLength={CHARACTER_LIMITS.DESCRIPTION_MAX}
          helpText="📝Provide detailed information about condition, authenticity, and features"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />


        {!isMustSell && !hasBuyItNow && (
          <>
            <Text style={[styles.label, { color: colors.textPrimary }]}>🚦 Starting Bid (💲) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
              value={startingBid}
              onChangeText={setStartingBid}
              placeholder="0.00"
              placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
              keyboardType="decimal-pad"
            />
            <View style={[
            styles.infoBox,
             { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F7FAFC' }
             ]}
             >
              <Ionicons
              name="information-circle"
              size={20}
               color={theme === 'dark' ? '#9AE6B4' : '#6A0DAD'}
               />
              <Text style={styles.infoText}>
                This is the minimum opening bid. Set it below appraisal value to attract bidders. You can add a Buy It Now price below for instant purchase.
              </Text>
            </View>
          </>
        )}
        {isMustSell && (
     <View
      style={[
      styles.infoBox,
      {
        backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC',
        borderColor: theme === 'dark' ? '#3A3A3C' : '#E2E8F0',
      },
    ]}
  >
    <Ionicons
      name="flame"
      size={20}
      color={theme === 'dark' ? '#FBBF24' : '#D97706'}
    />
    <Text
      style={[
        styles.infoText,
        { color: theme === 'dark' ? '#E2E8F0' : '#2D3748' }
      ]}
    >
      🔥 Must Sell 🔥: no starting price — the highest bidder wins at any price.
    </Text>
       </View>
       )}

        <Text style={[styles.label, { color: colors.textPrimary }]}>⏱️ Auction Duration (🗓️) *</Text>
        <View style={styles.durationRow}>
  {['3','7','14','30'].map((days) => {
    const isActive = duration === days;

    return (
      <TouchableOpacity
        key={days}
        style={[
          styles.durationButton,
          {
            backgroundColor: isActive
              ? (theme === 'dark' ? '#6A0DAD' : '#6A0DAD') // same in both modes
              : (theme === 'dark' ? '#2C2C2E' : '#F7FAFC'),

            borderColor: isActive
              ? (theme === 'dark' ? '#A78BFA' : '#6A0DAD')
              : (theme === 'dark' ? '#3A3A3C' : '#E2E8F0'),
          },
        ]}
        onPress={() => setDuration(days)}
      >
        <Text
          style={[
            styles.durationText,
            {
              color: isActive
                ? '#FFFFFF'
                : (theme === 'dark' ? '#E2E8F0' : '#2D3748'),
            },
          ]}
        >
          {days} days
        </Text>
      </TouchableOpacity>
    );
  })}
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
                    onPress={() => setReservePrice((Number.parseFloat(params.price as string) * 0.7).toFixed(0))}
                  >
                    <Text style={styles.quickSelectText}>70%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSelectButton}
                    onPress={() => setReservePrice((Number.parseFloat(params.price as string) * 0.8).toFixed(0))}
                  >
                    <Text style={styles.quickSelectText}>80%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSelectButton}
                    onPress={() => setReservePrice((Number.parseFloat(params.price as string) * 0.9).toFixed(0))}
                  >
                    <Text style={styles.quickSelectText}>90%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSelectButton}
                    onPress={() => setReservePrice((Number.parseFloat(params.price as string) * 0.95).toFixed(0))}
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
                  // If no starting bid (pure BIN), reset 3-day duration to 7-day minimum
                  if (!startingBid && duration === '3') setDuration('7');
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
              <Text style={[styles.optionLabel, { color: isMustSell ? (theme === 'dark' ? '#666' : '#CBD5E0') : colors.textPrimary }]}>💲Buy It Now Price</Text>
            </View>
            <Ionicons name="flash" size={20} color={isMustSell ? "#CBD5E0" : "#e53e3e"} />
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
                setDuration('7'); // Reset to 7 days when disabling Must Sell
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isMustSell && styles.checkboxActive]}>
                {isMustSell && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>🔥 Must Sell Mode </Text>
            </View>
            <Ionicons name="flame" size={20} color="#D97706" />
          </TouchableOpacity>
         {isMustSell && (
          <View
         style={[
      styles.optionInputContainer,
      {
        backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F7FAFC',
        borderColor: theme === 'dark' ? '#3A3A3C' : '#E2E8F0',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
      },
    ]}
  >

              <Text style={[styles.optionHelpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Item MUST sell to highest bidder (no reserve, 24-72 hours only)</Text>
              <View style={styles.mustSellDurationRow}>
  {[{ label: '24h', hours: '24' }, { label: '48h', hours: '48' }, { label: '72h', hours: '72' }].map((option) => {
    const isActive = duration === option.hours;

    return (
      <TouchableOpacity
        key={option.hours}
        style={[
          styles.mustSellDurationButton,
          {
            backgroundColor: isActive
              ? '#6A0DAD'
              : theme === 'dark'
                ? '#2C2C2E'
                : '#F7FAFC',

            borderColor: isActive
              ? '#A78BFA'
              : theme === 'dark'
                ? '#3A3A3C'
                : '#E2E8F0',
          },
        ]}
        onPress={() => setDuration(option.hours)}
      >
        <Text
          style={[
            styles.mustSellDurationText,
            {
              color: isActive
                ? '#FFFFFF'
                : theme === 'dark'
                  ? '#E2E8F0'
                  : '#2D3748',
            },
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

             <TouchableOpacity
  style={[
    styles.cancelMustSellButton,
    {
      backgroundColor: theme === 'dark' ? '#3A3A3C' : '#EDF2F7',
      borderColor: theme === 'dark' ? '#4A4A4C' : '#CBD5E0',
      borderWidth: 1,
    },
  ]}
  onPress={() => {
    setIsMustSell(false);
    setDuration('7');
  }}
>
  <Text
    style={[
      styles.cancelMustSellText,
      { color: theme === 'dark' ? '#E2E8F0' : '#2D3748' },
    ]}
  >
    Cancel Must Sell
  </Text>
</TouchableOpacity>

            </View>
          )}
        </View>

        <View
  style={[
    styles.infoBox,
    {
      backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F7FAFC',
      borderColor: theme === 'dark' ? '#3A3A3C' : '#E2E8F0',
      borderWidth: 1,
    },
  ]}
>
  <Ionicons
    name="information-circle"
    size={20}
    color={theme === 'dark' ? '#FBBF24' : '#FF6B35'}
  />
  <Text
    style={[
      styles.infoText,
      { color: theme === 'dark' ? '#E2E8F0' : '#2D3748' },
    ]}
  >
    Estimated value: ${params.price}
  </Text>
</View>


        <View
  style={[
    styles.infoBox,
    {
      backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F7FAFC',
      borderColor: theme === 'dark' ? '#3A3A3C' : '#E2E8F0',
      borderWidth: 1,
    },
  ]}
>
  <Ionicons
    name="cash"
    size={20}
    color={theme === 'dark' ? '#4ADE80' : '#38A169'}
  />
  <Text
    style={[
      styles.infoText,
      { color: theme === 'dark' ? '#E2E8F0' : '#2D3748' },
    ]}
  >
    You will receive <Text style={{ fontWeight: '700' }}>89%</Text> after BidGoat fees (8% commission + 3% processing)
  </Text>
</View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelButton, {
              backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC',
              borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0',
            }]}
            onPress={() => {
              Alert.alert(
                'Cancel Listing',
                'Are you sure you want to cancel? Your entered information will be lost.',
                [
                  { text: 'Keep Editing', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: () => router.back() }
                ]
              );
            }}
          >
            <Ionicons name="close-circle" size={20} color={theme === 'dark' ? '#999' : '#718096'} />
            <Text style={[styles.cancelButtonText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateListing}
          >
            <Text style={styles.submitButtonText}>{isEditMode ? '✏️ Update Watch' : '⌚ List Watch'}</Text>
          </TouchableOpacity>
        </View>


      </View>
    </Animated.ScrollView>
    <GlobalFooter />
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
  flex: 1,
  backgroundColor: '#FF6B35',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
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
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 16,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#E2E8F0',
  backgroundColor: '#F7FAFC',
  gap: 6,
},
  buttonRow: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 20,
  paddingBottom: 24,
},

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
  color: '#718096',
},
  cancelButtonWrapper: {
  marginTop: 24,
  marginBottom: 12,
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

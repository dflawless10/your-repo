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
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { CharacterCounterInput, CHARACTER_LIMITS, validateCharacterCount } from './components/CharacterCounterInput';
import { useImageValidation } from '@/hooks/useImageValidation';
import ImageValidationFeedback from '@/app/components/ImageValidationFeedback';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const SpinningDiamond = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AnimatedSvg
      width={24}
      height={24}
      viewBox="0 0 40 40"
      style={{ transform: [{ rotate }], marginRight: 8 }}
    >
      <Defs>
        <LinearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00f0ff" />
          <Stop offset="100%" stopColor="#0044ff" />
        </LinearGradient>
      </Defs>
      <Polygon points="20,0 40,20 20,40 0,20" fill="url(#diamondGradient)" />
      <Polygon points="20,0 30,20 20,20" fill="#00d0dd" />
      <Polygon points="20,0 10,20 20,20" fill="#00aacc" />
      <Polygon points="10,20 20,40 20,20" fill="#0088bb" />
      <Polygon points="30,20 20,40 20,20" fill="#006699" />
    </AnimatedSvg>
  );
};

export default function DiamondListingScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();

  // Check if this is edit mode
  const isEditMode = !!params.editItemId;
  const editItemId = params.editItemId as string;

  // Debug: Log all params including additionalImages
  console.log('🐐 Diamond listing params:', params);
  console.log('🐐 Edit mode:', isEditMode, 'Item ID:', editItemId);
  console.log('🐐 additionalImages param:', params.additionalImages);

  // Helper to safely get string from params (handles string | string[] | undefined)
  const getParamString = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  const [title, setTitle] = useState(`${getParamString(params.carat)}ct ${getParamString(params.shape)} Diamond`);
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState(getParamString(params.price));
  const [duration, setDuration] = useState('7');

  // Advanced auction options
  const [hasReserve, setHasReserve] = useState(false);
  const [reservePrice, setReservePrice] = useState('');
  const [hasBuyItNow, setHasBuyItNow] = useState(false);
  const [buyItNowPrice, setBuyItNowPrice] = useState('');
  const [isMustSell, setIsMustSell] = useState(false);
  const [appraisedValue] = useState(getParamString(params.price));

  // Image validation
  const imageValidation = useImageValidation(params.imageUrl as string | null);

  const showMustSellConfirmation = () => {
    const startingBidNum = parseFloat(startingBid) || 0;
    const appraisedNum = parseFloat(appraisedValue) || 0;
    const potentialLoss = appraisedNum - startingBidNum;

    Alert.alert(
      '🐐 BidGoat Must-Sell Terms',
      `📋 IMPORTANT REMINDER - Please Read Carefully:\n\n` +
      `💎 Appraised Value: $${appraisedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `🔥 Your Starting Bid: $${startingBidNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `⏰ Duration: ${duration} day${duration === '1' ? '' : 's'}\n` +
      `⚠️ Potential Loss: $${potentialLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
      `MUST-SELL TERMS (BidGoat Courtesy Reminder):\n\n` +
      `✓ Your item WILL SELL to the highest bidder when time expires\n` +
      `✓ NO RESERVE PRICE - Even if only one bid at $${startingBidNum.toLocaleString()}\n` +
      `✓ NO CANCELLATION - Once listed, you CANNOT cancel\n` +
      `✓ YOU ARE LEGALLY OBLIGATED to sell at final price\n` +
      `✓ If no bids received, item sells at starting bid\n\n` +
      `This creates maximum urgency and attracts bidders, but you accept ALL RISK of selling below appraisal value.\n\n` +
      `Do you accept these terms and want to proceed?`,
      [
        {
          text: 'No, Go Back',
          style: 'cancel',
        },
        {
          text: 'Yes, I Accept Terms',
          style: 'destructive',
          onPress: () => submitListing(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleCreateListing = async () => {
    if (!title || !startingBid) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!params.imageUrl) {
      Alert.alert('Error', 'Please upload a photo of your diamond first using the "Upload Photo" button above.');
      return;
    }

    // Validate required diamond specifications
    if (!getParamString(params.carat) || !getParamString(params.shape) || !getParamString(params.color) || !getParamString(params.clarity)) {
      Alert.alert('Error', 'Please fill in all diamond specifications (Carat Weight, Cut, Color, and Clarity) before listing.');
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
      if (reserve < starting) {
        Alert.alert('Error', 'Reserve price must be greater than or equal to starting bid');
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

    // Show Must-Sell confirmation if enabled
    if (isMustSell) {
      showMustSellConfirmation();
      return;
    }

    // Otherwise proceed with normal listing
    await submitListing();
  };

  const submitListing = async () => {
    try {
      const formData = new FormData();
      formData.append('name', title);
console.log('name:', title);
      formData.append('description', description);
console.log('description:', description);
      formData.append('price', parseFloat(startingBid).toString());
console.log('price:', parseFloat(startingBid));
      formData.append('duration_hours', parseInt(duration).toString());
console.log('duration_hours:', parseInt(duration));
      formData.append('category_id', '1');
console.log('category_id: 1');
      formData.append('tags', `diamond,${getParamString(params.shape)},${getParamString(params.carat)}ct,${getParamString(params.color)},${getParamString(params.clarity)}`);
console.log('tags:', `diamond,${getParamString(params.shape)},${getParamString(params.carat)}ct,${getParamString(params.color)},${getParamString(params.clarity)}`);
      formData.append('rarity', getParamString(params.rarity) || 'rare');
console.log('rarity:', getParamString(params.rarity) || 'rare');

      // Add diamond specifications as JSON
      const diamondSpecs = JSON.stringify({
        carat: getParamString(params.carat),
        cut: getParamString(params.shape),
        color: getParamString(params.color),
        clarity: getParamString(params.clarity),
        certification: getParamString(params.certified),
        certificationLab: getParamString(params.certificationLab) || '',
        certificationNumber: getParamString(params.certificationNumber) || '',
        ethicallySourced: getParamString(params.ethicallySourced) || 'No'
      });
      formData.append('diamond_specifications', diamondSpecs);
console.log('diamond_specifications:', diamondSpecs);

      // Add advanced auction options
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

      // Add appraised value to preserve it
      if (appraisedValue) {
        formData.append('appraised_value', parseFloat(appraisedValue).toString());
        console.log('appraised_value:', parseFloat(appraisedValue));
      }

      // Handle the main image file
      const imageUri = params.imageUrl as string;
      const filename = imageUri.split('/').pop() || 'diamond.jpg';
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
            const addFilename = addUri.split('/').pop() || `diamond_${i + 1}.jpg`;
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

      // Use PUT for edits, POST for new listings
      const endpoint = isEditMode
        ? `http://10.0.0.170:5000/item/${editItemId}`
        : 'http://10.0.0.170:5000/create_item';

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const itemId = isEditMode ? editItemId : data.item_id;

        // Build congratulations message
        let text2 = isEditMode
          ? '💎 Your diamond has been updated!'
          : '💎 Your diamond is under review!';

        if (hasReserve && reservePrice) {
          text2 += ` Reserve: $${parseFloat(reservePrice).toLocaleString()}`;
        }
        if (hasBuyItNow && buyItNowPrice) {
          text2 += ` • Buy Now: $${parseFloat(buyItNowPrice).toLocaleString()}`;
        }
        if (isMustSell) {
          text2 += ` • Must Sell: ${duration}d`;
        }

        // Show celebratory toast
        Toast.show({
          type: 'success',
          text1: isEditMode
            ? '✨ Diamond Updated Successfully!'
            : '🎉 Congratulations! Diamond Listed!',
          text2: text2,
          visibilityTime: 3000,
          position: 'top',
          topOffset: 60,
        });

        // Show preview modal after short delay
        setTimeout(() => {
          Alert.alert(
            'Success! 🎉',
            isEditMode
              ? 'Your diamond has been updated! Want to preview it?'
              : 'Your diamond listing will be live in an hour! Want to preview it?',
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
            { cancelable: false }
          );
        }, 1000);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create listing');
      }
    } catch (error) {
      console.error('🐐 Listing error:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 150 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E2E8F0' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEditMode ? 'Edit Diamond Listing' : 'List Your Diamond'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {params.imageUrl && (
          <>
            <Image
              source={{ uri: params.imageUrl as string }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            {/* Image Validation Feedback */}
            <View style={{ paddingHorizontal: 16 }}>
              <ImageValidationFeedback validation={imageValidation} />
            </View>
          </>
        )}

        <View style={[styles.form, { backgroundColor: colors.background }]}>
          <CharacterCounterInput
            label="Title"
            placeholder="e.g., 1.25ct Round Diamond"
            value={title}
            onChangeText={setTitle}
            minLength={CHARACTER_LIMITS.NAME_MIN}
            maxLength={CHARACTER_LIMITS.NAME_MAX}
            helpText="Give your diamond a clear, descriptive title"
          />

          <CharacterCounterInput
            label="Description"
            placeholder="Describe your diamond..."
            value={description}
            onChangeText={setDescription}
            minLength={CHARACTER_LIMITS.DESCRIPTION_MIN}
            maxLength={CHARACTER_LIMITS.DESCRIPTION_MAX}
            helpText="Provide detailed information about your diamond's characteristics"
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />

        {/* Display Appraised Value */}
        {appraisedValue && (
          <View style={[styles.appraisedValueContainer, {
            backgroundColor: theme === 'dark' ? '#2C2440' : '#F0F4FF',
            borderColor: theme === 'dark' ? '#B794F4' : '#6A0DAD'
          }]}>
            <View style={styles.appraisedValueHeader}>
              <Ionicons name="diamond" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
              <Text style={[styles.appraisedValueLabel, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>Appraised Value</Text>
            </View>
            <Text style={[styles.appraisedValueAmount, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>
              ${parseFloat(appraisedValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {isMustSell ? 'Starting Bid ($) - Must-Sell *' : 'Starting Bid ($) *'}
        </Text>
        <TextInput
          style={[styles.input, isMustSell && styles.mustSellInput, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
          value={startingBid}
          onChangeText={setStartingBid}
          placeholder={isMustSell ? "0.00 (No minimum!)" : "0.00"}
          placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
          keyboardType="decimal-pad"
        />
        {isMustSell ? (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#D97706" />
            <Text style={styles.warningText}>
              🔥 Must-Sell Mode: Your item will sell to the highest bidder regardless of price! Set starting bid to $0.00 for maximum urgency.
            </Text>
          </View>
        ) : (
          <View style={[styles.infoBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
            <Ionicons name="information-circle" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>
              This is the minimum opening bid. Set it below appraisal value to attract bidders. You can add a Buy It Now price below for instant purchase.
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textPrimary }]}>Auction Duration (days) *</Text>
        <View style={styles.durationRow}>
          {['3', '7', '14', '30'].map((days) => (
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
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>💎 Advanced Options</Text>

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
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, hasReserve && styles.checkboxActive, (isMustSell || hasBuyItNow) && styles.checkboxDisabled]}>
                {hasReserve && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.optionLabel, { color: (isMustSell || hasBuyItNow) ? '#A0AEC0' : colors.textPrimary }]}>Set Reserve Price</Text>
            </View>
            <Ionicons name="shield-checkmark" size={20} color={(isMustSell || hasBuyItNow) ? "#CBD5E0" : "#6A0DAD"} />
          </TouchableOpacity>
          {hasReserve && !isMustSell && !hasBuyItNow && (
            <View style={styles.optionInputContainer}>
              <Text style={[styles.optionHelpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Minimum price you&#39;ll accept (hidden from buyers)</Text>
              <TextInput
                style={[styles.optionInput, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
                value={reservePrice}
                onChangeText={setReservePrice}
                placeholder="Enter reserve price"
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
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, hasBuyItNow && styles.checkboxActive, isMustSell && styles.checkboxDisabled]}>
                {hasBuyItNow && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.optionLabel, { color: isMustSell ? '#A0AEC0' : colors.textPrimary }]}>Add Buy It Now</Text>
            </View>
            <Ionicons name="flash" size={20} color={isMustSell ? "#CBD5E0" : "#FF6B35"} />
          </TouchableOpacity>
          {hasBuyItNow && !isMustSell && (
            <View style={styles.optionInputContainer}>
              <Text style={[styles.optionHelpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>Instant purchase price</Text>
              <TextInput
                style={[styles.optionInput, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
                value={buyItNowPrice}
                onChangeText={setBuyItNowPrice}
                placeholder="Enter Buy It Now price"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Divider */}
          <View style={styles.optionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Must Sell Mode */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              setIsMustSell(!isMustSell);
              if (!isMustSell) {
                // Disable other options when Must Sell is enabled
                setHasReserve(false);
                setHasBuyItNow(false);
                setReservePrice('');
                setBuyItNowPrice('');
                setDuration('48'); // Default to 48 hours
                setStartingBid('0.00'); // Auto-set to $0.00 for maximum urgency
              } else {
                // When disabling must-sell, restore appraised value
                setStartingBid(appraisedValue);
                setDuration('7'); // Reset to 7 days
              }
            }}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isMustSell && styles.checkboxActive]}>
                {isMustSell && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Must Sell (24-72 hours)</Text>
            </View>
            <Ionicons name="flame" size={20} color="#D97706" />
          </TouchableOpacity>
          {isMustSell && (
            <View style={styles.optionInputContainer}>
              <Text style={[styles.optionHelpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>⚠️ No reserve, no buy-it-now. Creates urgency!</Text>
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
                  setStartingBid(appraisedValue);
                }}
              >
                <Text style={styles.cancelMustSellText}>Cancel Must Sell</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>
            Estimated value: ${getParamString(params.price)}
          </Text>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
          <Ionicons name="cash" size={20} color="#38a169" />
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#CCC' : '#4A5568' }]}>
            You&#39;ll receive 89% after BidGoat fees (8% commission + 3% processing)
          </Text>
        </View>

        <View style={styles.buttonContainer}>
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
            style={styles.submitButton}
            onPress={handleCreateListing}
          >
            <SpinningDiamond />
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update Diamond' : 'List Diamond'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E2E8F0',
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
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
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
  appraisedValueContainer: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#6A0DAD',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appraisedValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  appraisedValueLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A0DAD',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appraisedValueAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6A0DAD',
    textAlign: 'center',
  },
  mustSellInput: {
    borderColor: '#D97706',
    borderWidth: 2,
    backgroundColor: '#FEF3C7',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#718096',
  },
});

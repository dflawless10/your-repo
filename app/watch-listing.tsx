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
import * as ImagePicker from 'expo-image-picker';
import { CharacterCounterInput, CHARACTER_LIMITS, validateCharacterCount } from 'app/components/CharacterCounterInput';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// Spins an image
const SpinningImage = ({ uri }: { uri: string }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Image
        source={{ uri }}
        style={{ width: 200, height: 200, borderRadius: 12 }}
      />
    </Animated.View>
  );
};

// Spins the SVG polygon
const SpinningWatch = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
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
        <LinearGradient id="watchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#FF8C00" />
        </LinearGradient>
      </Defs>
      <Polygon points="20,0 40,20 20,40 0,20" fill="url(#watchGradient)" />
    </AnimatedSvg>
  );
};


export default function WatchListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();

  const [title, setTitle] = useState(`${params.brand} ${params.model}`);
  const [description, setDescription] = useState<string>('');
  const [imageUris, setImageUris] = useState<string[]>([]);

  const [startingBid, setStartingBid] = useState(params.price?.toString() || '');
  const [duration, setDuration] = useState('7');
  const [buyItNowPrice, setBuyItNowPrice] = useState<string>('');

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
  if (!title || !description) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  if (!startingBid && !buyItNowPrice) {
    Alert.alert('Error', 'You must enter either a Starting Bid or a Buy It Now price');
    return;
  }

  // Character count validation with moderation
  const titleValidation = validateCharacterCount(title, CHARACTER_LIMITS.NAME_MIN, CHARACTER_LIMITS.NAME_MAX, 'Title');
  if (!titleValidation.isValid) {
    Alert.alert('Title Invalid', titleValidation.errorMessage!);
    return;
  }

  const descValidation = validateCharacterCount(description, CHARACTER_LIMITS.DESCRIPTION_MIN, CHARACTER_LIMITS.DESCRIPTION_MAX, 'Description');
  if (!descValidation.isValid) {
    Alert.alert('Description Invalid', descValidation.errorMessage!);
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

  // 🐐 Price logic
  if (startingBid && buyItNowPrice) {
    formData.append('price', startingBid);
    formData.append('buy_it_now', buyItNowPrice);
  } else if (startingBid) {
    formData.append('price', startingBid);
  } else if (buyItNowPrice) {
    formData.append('price', buyItNowPrice);
    formData.append('buy_it_now', buyItNowPrice);
  }

  // Primary photo
  const firstUri = previewUris[0];
  const firstFilename = firstUri.split('/').pop() || 'watch.jpg';
  const firstMatch = /\.(\w+)$/.exec(firstFilename);
  const firstType = firstMatch ? `image/${firstMatch[1]}` : 'image/jpeg';

  // @ts-ignore
  formData.append('photo', { uri: firstUri, name: firstFilename, type: firstType });

  // Additional photos
  previewUris.slice(1).forEach((uri, idx) => {
    const filename = uri.split('/').pop() || `watch_${idx}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // @ts-ignore
    formData.append('additional_photos', { uri, name: filename, type });
  });

if (previewUris.length > 0) {
  // Primary photo
  const firstUri = previewUris[0];
  const filename = firstUri.split('/').pop() || 'watch.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // @ts-ignore
  formData.append('photo', { uri: firstUri, name: filename, type });
}



    console.log('📤 Uploading watch listing:', {
      name: title,
      price: startingBid || buyItNowPrice,
      buy_it_now: buyItNowPrice,
      duration,
    });

    const response = await fetch('http://10.0.0.170:5000/create_item', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const responseData = await response.json();
    console.log('📥 Server response:', responseData);

    if (response.ok) {
      Alert.alert('Success', '⌚ Watch listed successfully!', [
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 150 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A202C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>List Your Watch</Text>
          <View style={{ width: 24 }} />
        </View>

      {/* Watch Preview Card */}
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>⌚ Your Watch Preview</Text>
        <View style={styles.watchInfo}>
          <Text style={styles.watchBrand}>{params.brand} {params.model}</Text>
          <Text style={styles.watchPrice}>💰 Estimated: ${params.price}</Text>
        <View style={styles.watchInfo}>
  <Text style={styles.watchBrand}>{params.brand} {params.model}</Text>

</View>

        </View>

     <View style={styles.imageRow}>
  {previewUris.length > 0 ? (
    previewUris.map((uri: string, idx: number) => (
      <SpinningImage key={idx} uri={uri} />
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
      </View>

      <View style={styles.form}>
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


        <Text style={styles.label}>Starting Bid ($) (Optional)</Text>
        <TextInput
          style={styles.input}
          value={startingBid}
          onChangeText={setStartingBid}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Buy It Now Price (Optional)</Text>
        <TextInput
          style={styles.input}
          value={buyItNowPrice}
          onChangeText={setBuyItNowPrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />


        <Text style={styles.label}>Auction Duration (days) *</Text>
        <View style={styles.durationRow}>
          {['3','8', '14', '30'].map((days) => (
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

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>
            Estimated value: ${params.price}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="cash" size={20} color="#38a169" />
          <Text style={styles.infoText}>
            You'll receive 89% after BidGoat fees (8% commission + 3% processing)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCreateListing}
        >
          <SpinningWatch />
          <Text style={styles.submitButtonText}>List Watch</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  previewCard: {
    backgroundColor: '#fff',
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
    color: '#1A202C',
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
    color: '#2D3748',
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
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A202C',
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
});

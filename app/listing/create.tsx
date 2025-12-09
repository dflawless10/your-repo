import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  Alert, ScrollView, Image,  TouchableOpacity, ActivityIndicator
} from 'react-native';
import Animated from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Picker } from "@react-native-picker/picker";
import { useGoatBid } from "@/hooks/useGoatBid";
import { GoatFlip } from "@/components/GoatAnimator/goatFlip";
import { useRouter } from 'expo-router';
import { validateContentQuick } from 'app/utils/contentModeration';


const guessMime = (uri: string): string => {
  const ext = (uri.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    case 'jpg':
    case 'jpeg':
    default: return 'image/jpeg';
  }
};

type FormDataFile = {
  uri: string;
  name: string;
  type: string;
};




const API_URL = 'http://10.0.0.170:5000';

function ItemScreen() {
  const buildUploadFormData = async (imageUri: string | null): Promise<FormData> => {
    if (!imageUri) throw new Error('No image selected');
    const type = 'image/jpeg'; // or your guessMime/mime-types lookup
    const ext = type.split('/')[1] || 'jpg';
    const fd = new FormData();
    fd.append('photo', { uri: imageUri, name: `item.${ext}`, type } as any);
    return fd;
  };
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [zoomVisible, setZoomVisible] = useState(false);

  const [additionalImages, setAdditionalImages] = useState<{ uri: string }[]>([]);
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    { id: number; name: string; emoji: string }[]
  >([]);
  const [showGoat, setShowGoat] = useState(false);
  const [buyItNow, setBuyItNow] = useState('');
const [rarity, setRarity] = useState('common');
const [durationHours, setDurationHours] = useState('48');
const [weightLbs, setWeightLbs] = useState('1.0');
const [gender, setGender] = useState('women');
const [pendingUri, setPendingUri] = useState<string | null>(null);
const [chooseVisible, setChooseVisible] = useState(false);
const [uploading, setUploading] = useState(false);

const onPickResult = (newUri: string) => {
  if (!imageUri) {
    setImageUri(newUri);
  } else {
    setPendingUri(newUri);
    setChooseVisible(true);
  }
};

const { goatTrigger, lastBidAmount, triggerGoat } = useGoatBid();
  const router = useRouter();
  
  
  
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
  if (!name || !description || !price || !category || !imageUri) {
    Alert.alert('Missing Fields', 'Please fill out all fields and upload a photo');
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
if (!token) {
  Alert.alert('Not signed in', 'Please sign in to list an item.');
  return;
}






     const formData = new FormData();formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('category_id', category.toString());
  formData.append('tags', tags);
  formData.append('rarity', rarity);
  formData.append('duration_hours', durationHours);
  formData.append('buy_it_now', buyItNow);
  formData.append('weight_lbs', weightLbs);
  formData.append('gender', gender);

  // Add the main photo
  formData.append('photo', {
    uri: imageUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as any);

    additionalImages.forEach((img, idx) => {
      formData.append(`additional_photo_${idx}`, {
        uri: img.uri,
        name: `extra_${idx}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

  try {
    setUploading(true);
    console.log('📤 Starting upload...');

    const res = await fetch(`${API_URL}/item`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('📤 Upload response:', res.status);

    if (res.ok) {
      Alert.alert('Success', 'Item listed successfully!');
      triggerGoat(Number(price));
      handleBidConfirm();
      await res.json();

      setName('');
      setDescription('');
      setPrice('');
      setCategory(null);
      setTags('');
      setImageUri(null);
      setAdditionalImages([]);
      router.push('/discover');
    } else {
      const errorText = await res.text();
      console.error('Upload failed:', res.status, errorText);
      Alert.alert('Upload Failed', `Server returned ${res.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('Listing error:', error);
    Alert.alert('Network Error', 'Could not reach the server.');
  } finally {
    setUploading(false);
  }
};

  const handleImagePick = async () => {
  if (additionalImages.length >= 5) {
    Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.3, // Lower quality for faster processing
    aspect: [4, 3],
    exif: false,
  });

  if (!result.canceled && result.assets.length > 0) {
    const uri = result.assets[0].uri;

    // Compress and resize image for faster uploads
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Resize to max 800px width
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      onPickResult(manipResult.uri);
    } catch (error) {
      console.error('Image compression error:', error);
      onPickResult(uri); // Fallback to original if compression fails
    }
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>

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

      <Text style={styles.label}>Select Gender</Text>
      <Picker
        selectedValue={gender}
        onValueChange={(value) => setGender(value)}
        style={styles.picker}
      >
        <Picker.Item label="👩 Women" value="women" />
        <Picker.Item label="👨 Men" value="men" />
        <Picker.Item label="🚻 Unisex" value="unisex" />
      </Picker>

      <Button title="Upload Photo(s)" onPress={handleImagePick} />
      {imageUri && (
  <TouchableOpacity onPress={() => setZoomVisible(true)}>
    <Image source={{ uri: imageUri }} style={styles.thumbnailPreview} />
  </TouchableOpacity>
)}

      {additionalImages.length > 0 && (
        <ScrollView horizontal style={styles.additionalImageScroll}>
          {additionalImages.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img.uri }}
              style={styles.additionalImage}
            />
          ))}
        </ScrollView>
      )}



      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
      <TextInput placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Tags (comma-separated)" value={tags} onChangeText={setTags} style={styles.input} />
<TextInput
  placeholder="Buy It Now Price (optional)"
  value={buyItNow}
  onChangeText={setBuyItNow}
  keyboardType="numeric"
  style={styles.input}
/>

<TextInput
  placeholder="Weight (lbs) - for shipping"
  value={weightLbs}
  onChangeText={setWeightLbs}
  keyboardType="decimal-pad"
  style={styles.input}
/>

<TextInput
  placeholder="Rarity (e.g. common, rare)"
  value={rarity}
  onChangeText={setRarity}
  style={styles.input}
/>

<TextInput
  placeholder="Auction Duration (hours)"
  value={durationHours}
  onChangeText={setDurationHours}
  keyboardType="numeric"
  style={styles.input}
/>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <GoatFlip trigger={goatTrigger || showGoat} bidAmount={lastBidAmount || Number(price)} />
      </View>

      <Button
        title={uploading ? "Uploading..." : "List Item"}
        onPress={handleSubmit}
        disabled={uploading}
      />

{chooseVisible && (
  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
    <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Use this photo</Text>
    <Button
      title="Replace Main"
      onPress={() => {
        if (pendingUri) setImageUri(pendingUri);
        setChooseVisible(false);
        setPendingUri(null);
      }}
    />
    <View style={{ height: 8 }} />
    <Button
      title="Add as Additional"
      onPress={() => {
        if (pendingUri) setAdditionalImages(prev => [...prev, { uri: pendingUri }]);
        setChooseVisible(false);
        setPendingUri(null);
      }}
    />
    <View style={{ height: 8 }} />
    <Button title="Cancel" color="#999" onPress={() => { setChooseVisible(false); setPendingUri(null); }} />
  </View>
)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { marginBottom: 4, fontWeight: '500' },
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
  thumbnailPreview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  additionalImageScroll: {
    marginBottom: 12,
  },
  additionalImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
  },
});
export default ItemScreen;

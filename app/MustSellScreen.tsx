import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import ImageUploader from '@/components/ImageUploader';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { validateContentQuick } from 'app/utils/contentModeration';

const API_URL = 'http://10.0.0.170:5000';

export default function MustSellScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [condition, setCondition] = useState('good');
  const [durationHours, setDurationHours] = useState('24');
  const [tags, setTags] = useState('');
  const [weightLbs, setWeightLbs] = useState('1.0');
  const [category, setCategory] = useState<number | null>(null);
  const [gender, setGender] = useState<string>('unisex');
  const [categories, setCategories] = useState<{ id: number; name: string; emoji: string }[]>([]);

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
    if (!name || imageUris.length === 0 || !category || !durationHours) {
      Alert.alert('Missing Fields', 'Please fill all required fields and upload at least one image.');
      return;
    }

    // Content Moderation
    const nameModeration = validateContentQuick(name, 'Item name');
    if (!nameModeration.isValid) {
      Alert.alert('Content Policy Violation', nameModeration.errorMessage!);
      return;
    }

    if (description) {
      const descModeration = validateContentQuick(description, 'Description');
      if (!descModeration.isValid) {
        Alert.alert('Content Policy Violation', descModeration.errorMessage!);
        return;
      }
    }

    try {
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
      formData.append('weight_lbs', weightLbs);
      formData.append('category_id', category.toString());
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
        formData.append('additional_images', {
          uri: imageUris[i],
          name: `photo_${i}.jpg`,
          type: 'image/jpeg',
        } as any);
      }

      const response = await fetch(`${API_URL}/api/must-sell`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Your Must Sell listing is live! Highest bidder wins when time expires.');
        router.push('/(tabs)/MyAuctionScreen');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to create Must Sell listing');
      }
    } catch (error) {
      console.error('Must Sell creation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitleText}>⚡ Must Sell</Text>
        <Text style={styles.headerSubtitle}>No reserve - highest bidder wins!</Text>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#F44336" />
          <Text style={styles.infoText}>
            Must Sell starts at $0.00. Buyers make offers, and the highest bidder wins when time expires.
            No reserve, no minimum - you WILL sell!
          </Text>
        </View>

        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Vintage Camera"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your item..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <ImageUploader
          maxImages={5}
          onImagesChange={setImageUris}
          title="Upload Photos"
          subtitle="Add up to 5 photos"
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(value) => setCategory(value)}
            style={styles.picker}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={`${cat.emoji} ${cat.name}`} value={cat.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Condition</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={condition}
            onValueChange={(value) => setCondition(value)}
            style={styles.picker}
          >
            <Picker.Item label="New" value="new" />
            <Picker.Item label="Like New" value="like_new" />
            <Picker.Item label="Good" value="good" />
            <Picker.Item label="Fair" value="fair" />
            <Picker.Item label="Poor" value="poor" />
          </Picker>
        </View>

        <Text style={styles.label}>Duration *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={durationHours}
            onValueChange={(value) => setDurationHours(value)}
            style={styles.picker}
          >
            <Picker.Item label="24 Hours (Fast Sale)" value="24" />
            <Picker.Item label="48 Hours" value="48" />
            <Picker.Item label="72 Hours" value="72" />
          </Picker>
        </View>

        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., vintage, electronics, rare"
          value={tags}
          onChangeText={setTags}
        />

        <Text style={styles.label}>Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          placeholder="1.0"
          value={weightLbs}
          onChangeText={setWeightLbs}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={gender}
            onValueChange={(value) => setGender(value)}
            style={styles.picker}
          >
            <Picker.Item label="Unisex / Not Specified" value="unisex" />
            <Picker.Item label="👨 Men's" value="men" />
            <Picker.Item label="👩 Women's" value="women" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="flash" size={20} color="#FFF" />
          <Text style={styles.submitButtonText}>Create Must Sell</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 10,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  scrollContent: {
    paddingTop: 140,
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#C62828',
    lineHeight: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});

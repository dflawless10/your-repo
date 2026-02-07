import { API_BASE_URL } from '@/config';

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import ImageUploader from '@/components/ImageUploader';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";

type EditableItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  tags: string;
  photo_url: string;
  additional_photos?: string[];
  reserve_price?: number | null;
};

const API_URL = API_BASE_URL;

export default function EditItemScreen() {
  const { itemId } = useLocalSearchParams();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [item, setItem] = useState<EditableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [categories, setCategories] = useState<
    { id: number; name: string; emoji: string }[]
  >([]);

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

    loadCategories();
    loadItem();
  }, [itemId]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadItem = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/item/${itemId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setItem(data);

          // Load existing images
          const existingImages = [data.photo_url];
          if (data.additional_photos && Array.isArray(data.additional_photos)) {
            existingImages.push(...data.additional_photos);
          }
          setImageUris(existingImages);
        } else {
          Alert.alert('Error', 'Could not load item for editing');
          router.back();
        }
      } catch (error) {
        console.error('Error loading item:', error);
        Alert.alert('Error', 'Could not load item');
        router.back();
      } finally {
        setLoading(false);
      }
    };

  if (loading || !item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  const handleUpdate = async () => {
    // Validate reserve price if it exists
    if (item.reserve_price && item.reserve_price < item.price) {
      Alert.alert(
        'Invalid Reserve Price',
        `Reserve price ($${item.reserve_price.toFixed(2)}) must be greater than or equal to the starting price ($${item.price.toFixed(2)}).`
      );
      return;
    }

    if (!item.name || !item.description) {
      Alert.alert('Missing Fields', 'Please fill out all required fields');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');

    // Check if user uploaded any new local images
    // Server URLs start with http:// or https:// or /static/
    const hasNewImages = imageUris.some(uri => {
      const isServerUrl = uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('/static/');
      return !isServerUrl; // If it's not a server URL, it's a new local image
    });

    try {
      let res;

      if (hasNewImages) {
        // Use FormData if there are new images to upload
        const formData = new FormData();
        formData.append('name', item.name);
        formData.append('description', item.description);
        formData.append('price', item.price.toString());
        formData.append('category_id', item.category.toString());
        formData.append('tags', item.tags);
        formData.append('reserve_price', item.reserve_price ? item.reserve_price.toString() : '');
        formData.append('status', 'review');

        // Handle main photo
        const firstImage = imageUris[0];
        if (firstImage && (firstImage.startsWith('file://') || firstImage.startsWith('content://') || firstImage.startsWith('ph://'))) {
          formData.append('photo', {
            uri: firstImage,
            name: 'photo.jpg',
            type: 'image/jpeg',
          } as any);
        } else if (firstImage) {
          // Keep existing URL
          formData.append('photo_url', firstImage);
        }

        // Handle additional images
        for (let i = 1; i < imageUris.length; i++) {
          const imgUri = imageUris[i];
          if (imgUri.startsWith('file://') || imgUri.startsWith('content://') || imgUri.startsWith('ph://')) {
            formData.append(`additional_photo_${i - 1}`, {
              uri: imgUri,
              name: `extra_${i - 1}.jpg`,
              type: 'image/jpeg',
            } as any);
          }
        }

        res = await fetch(`${API_URL}/item/${itemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Use JSON if only text fields changed (no new images)
        const payload = {
          name: item.name,
          description: item.description,
          price: parseFloat(String(item.price)),
          category_id: parseInt(String(item.category)),
          tags: item.tags,
          photo_url: imageUris[0] || item.photo_url,
          reserve_price: item.reserve_price ? parseFloat(String(item.reserve_price)) : null,
          status: 'review',
        };

        res = await fetch(`${API_URL}/item/${itemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        Alert.alert('Success!', 'Item details saved and sent back to review.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const errorText = await res.text();
        console.error('Update error response:', errorText);
        Alert.alert('Error', errorText || 'Failed to update item');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Could not update item.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <EnhancedHeader scrollY={scrollY} />

        <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <View style={styles.titleWithArrow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
              <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitleText}>Edit Item</Text>
              <Text style={styles.headerSubtitle}>Update your listing details</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoText}>
              Making changes will send your item back to review. You&#39;ll have time to preview before it goes live.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>📸 Item Photos</Text>
          <ImageUploader
            maxImages={5}
            imageUris={imageUris}
            onImagesChange={setImageUris}
            title="Update Photos"
            subtitle="Edit or add up to 5 photos"
          />

          <Text style={styles.sectionTitle}>📝 Item Details</Text>

          <Text style={styles.label}>Item Name *</Text>
          <TextInput
            placeholder="Enter item name"
            value={item.name}
            onChangeText={(t) => setItem({ ...item, name: t })}
            style={styles.input}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            placeholder="Describe your item in detail"
            value={item.description}
            onChangeText={(t) => setItem({ ...item, description: t })}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Starting Price ($) *</Text>
          <TextInput
            placeholder="0.00"
            value={item.price.toString()}
            onChangeText={(t) => {
              const num = parseFloat(t);
              if (!isNaN(num)) {
                setItem({ ...item, price: num });
              }
            }}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Reserve Price (optional)</Text>
          <TextInput
            placeholder="Reserve Price (must be ≥ starting price)"
            value={item.reserve_price?.toString() || ''}
            onChangeText={(t) => {
              const num = parseFloat(t);
              if (t === '' || t === null) {
                setItem({ ...item, reserve_price: null });
              } else if (!isNaN(num)) {
                setItem({ ...item, reserve_price: num });
              }
            }}
            keyboardType="numeric"
            style={styles.input}
          />
          {item.reserve_price && item.reserve_price < item.price && (
            <Text style={styles.errorText}>
              ⚠️ Reserve must be ≥ ${item.price.toFixed(2)}
            </Text>
          )}

          <Text style={styles.label}>Category ID</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{item.category}</Text>
          </View>
          <Text style={styles.helperText}>Category ID cannot be changed after listing</Text>

          <Text style={styles.label}>Tags</Text>
          <TextInput
            placeholder="Tags (comma-separated)"
            value={item.tags}
            onChangeText={(t) => setItem({ ...item, tags: t })}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleUpdate}
          >
            <Ionicons name="save" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </Animated.ScrollView>

        <GlobalFooter />
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    color: '#2d3748',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: -8,
    marginBottom: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});

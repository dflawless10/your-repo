import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

type ImageUploaderProps = {
  maxImages?: number;
  onImagesChange: (uris: string[]) => void;
  title?: string;
  subtitle?: string;
  imageUris?: string[]; // Accept external image URIs
};

export default function ImageUploader({
  maxImages = 5,
  onImagesChange,
  title = 'Upload Photos',
  subtitle = `Add up to ${5} photos`,
  imageUris: externalImageUris,
}: ImageUploaderProps) {
  const [imageUris, setImageUris] = useState<string[]>(externalImageUris || []);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Sync external imageUris with internal state
  useEffect(() => {
    if (externalImageUris !== undefined) {
      setImageUris(externalImageUris);
    }
  }, [externalImageUris]);

  const pickImages = async () => {
    if (imageUris.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} photos.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages - imageUris.length,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((asset) => asset.uri);
        const updatedUris = [...imageUris, ...newUris].slice(0, maxImages);
        setImageUris(updatedUris);
        onImagesChange(updatedUris);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const takePhoto = async () => {
    if (imageUris.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} photos.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUri = result.assets[0].uri;
        const updatedUris = [...imageUris, newUri];
        setImageUris(updatedUris);
        onImagesChange(updatedUris);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    const updatedUris = imageUris.filter((_, i) => i !== index);
    setImageUris(updatedUris);
    onImagesChange(updatedUris);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const showActionSheet = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImages },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {subtitle} ({imageUris.length}/{maxImages})
          </Text>
        </View>
        {imageUris.length > 0 && (
          <TouchableOpacity onPress={showActionSheet} style={styles.addMoreButton}>
            <Ionicons name="add-circle" size={32} color="#6A0DAD" />
          </TouchableOpacity>
        )}
      </View>

      {/* Image Grid or Empty State */}
      {imageUris.length === 0 ? (
        <TouchableOpacity style={styles.emptyState} onPress={showActionSheet}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="images-outline" size={48} color="#6A0DAD" />
          </View>
          <Text style={styles.emptyTitle}>Add Photos</Text>
          <Text style={styles.emptySubtitle}>Tap to upload or take a photo</Text>
          <View style={styles.emptyActions}>
            <View style={styles.emptyAction}>
              <Ionicons name="camera-outline" size={20} color="#666" />
              <Text style={styles.emptyActionText}>Camera</Text>
            </View>
            <View style={styles.emptyAction}>
              <Ionicons name="images-outline" size={20} color="#666" />
              <Text style={styles.emptyActionText}>Gallery</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <TouchableOpacity onPress={() => openPreview(index)}>
                <Image source={{ uri }} style={styles.image} contentFit="cover" />
              </TouchableOpacity>

              {/* Remove Button */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>

              {/* Primary Badge */}
              {index === 0 && (
                <View style={styles.primaryBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.primaryText}>Main</Text>
                </View>
              )}
            </View>
          ))}

          {/* Add More Button */}
          {imageUris.length < maxImages && (
            <TouchableOpacity style={styles.addButton} onPress={showActionSheet}>
              <Ionicons name="add-circle-outline" size={40} color="#6A0DAD" />
              <Text style={styles.addButtonText}>Add More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Tips */}
      <View style={styles.tips}>
        <Ionicons name="information-circle-outline" size={16} color="#666" />
        <Text style={styles.tipsText}>
          First photo will be the main image. Drag to reorder.
        </Text>
      </View>

      {/* Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </TouchableOpacity>

            <Image
              source={{ uri: imageUris[previewIndex] }}
              style={styles.previewImage}
              contentFit="contain"
            />

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => removeImage(previewIndex)}
              >
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                <Text style={styles.previewButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.previewCounter}>
              {previewIndex + 1} / {imageUris.length}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  addMoreButton: {
    padding: 4,
  },
  emptyState: {
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 32,
  },
  emptyAction: {
    alignItems: 'center',
    gap: 8,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  imageScroll: {
    marginVertical: 8,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  primaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  addButton: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  tips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '70%',
  },
  previewActions: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    gap: 20,
  },
  previewButton: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  previewButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCounter: {
    position: 'absolute',
    bottom: 50,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

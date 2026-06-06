import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

type ImageCropperModalProps = {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onCropComplete: (croppedUri: string) => void;
  aspectRatio?: [number, number]; // e.g., [1, 1] for square, [16, 9] for landscape
  theme?: 'light' | 'dark';
};

export default function ImageCropperModal({
  visible,
  imageUri,
  onCancel,
  onCropComplete,
  aspectRatio = [1, 1], // Default to square
  theme = 'light',
}: ImageCropperModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<[number, number]>(aspectRatio);

  const aspectRatioOptions: Array<{
    label: string;
    ratio: [number, number];
    icon: string;
  }> = [
    { label: '1:1 Square', ratio: [1, 1], icon: 'square-outline' },
    { label: '16:9 Landscape', ratio: [16, 9], icon: 'tablet-landscape-outline' },
    { label: '4:3 Standard', ratio: [4, 3], icon: 'image-outline' },
    { label: 'Free Crop', ratio: [0, 0], icon: 'crop-outline' }, // 0,0 means no constraint
  ];

  const handleCrop = async (ratio: [number, number]) => {
    setIsProcessing(true);
    try {
      // If free crop (0,0), just compress and optimize without aspect constraint
      if (ratio[0] === 0 && ratio[1] === 0) {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 2000 } }], // Max width 2000px
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        onCropComplete(result.uri);
      } else {
        // Crop to specific aspect ratio
        // Get image dimensions first
        const imgInfo = await ImageManipulator.manipulateAsync(imageUri, [], {});

        const imgWidth = imgInfo.width;
        const imgHeight = imgInfo.height;
        const targetRatio = ratio[0] / ratio[1];
        const currentRatio = imgWidth / imgHeight;

        let cropRegion: ImageManipulator.Action;

        if (currentRatio > targetRatio) {
          // Image is wider than target - crop width
          const newWidth = imgHeight * targetRatio;
          const offsetX = (imgWidth - newWidth) / 2;
          cropRegion = {
            crop: {
              originX: offsetX,
              originY: 0,
              width: newWidth,
              height: imgHeight,
            },
          };
        } else {
          // Image is taller than target - crop height
          const newHeight = imgWidth / targetRatio;
          const offsetY = (imgHeight - newHeight) / 2;
          cropRegion = {
            crop: {
              originX: 0,
              originY: offsetY,
              width: imgWidth,
              height: newHeight,
            },
          };
        }

        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [cropRegion, { resize: { width: 2000 } }], // Crop then resize
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        onCropComplete(result.uri);
      }
    } catch (error) {
      console.error('Image crop error:', error);
      Alert.alert('Crop Failed', 'Unable to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#fff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#fff' : '#1A1A1A' }]}>
              Crop Your Image
            </Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={isDark ? '#BB86FC' : '#6A0DAD'} />
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              contentFit="contain"
            />
          </View>

          {/* Aspect Ratio Options */}
          <View style={styles.optionsContainer}>
            <Text style={[styles.optionsTitle, { color: isDark ? '#ccc' : '#666' }]}>
              Choose Crop Style:
            </Text>
            {aspectRatioOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA',
                    borderColor:
                      selectedAspectRatio[0] === option.ratio[0] &&
                      selectedAspectRatio[1] === option.ratio[1]
                        ? '#4CAF50'
                        : isDark
                        ? '#3C3C3E'
                        : '#E2E8F0',
                  },
                ]}
                onPress={() => setSelectedAspectRatio(option.ratio)}
                disabled={isProcessing}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={isDark ? '#BB86FC' : '#6A0DAD'}
                />
                <Text style={[styles.optionLabel, { color: isDark ? '#fff' : '#1A1A1A' }]}>
                  {option.label}
                </Text>
                {selectedAspectRatio[0] === option.ratio[0] &&
                  selectedAspectRatio[1] === option.ratio[1] && (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.cropButton,
                isProcessing && styles.buttonDisabled,
              ]}
              onPress={() => handleCrop(selectedAspectRatio)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.cropButtonText}>Apply Crop</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxHeight: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  cancelButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  cropButton: {
    backgroundColor: '#4CAF50',
  },
  cropButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

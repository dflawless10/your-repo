import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZoomableImage = ({ uri }: { uri: string }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else if (scale.value > 3) {
        scale.value = withTiming(3);
      }
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, panGesture),
    pinchGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.zoomableContainer}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <Image
            source={{ uri }}
            style={styles.zoomableImage}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

interface EvidencePhoto {
  localUri: string;
  serverUrl: string | null;
}

interface DisputeModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: number;
  itemId: number;
  itemName: string;
  itemPhoto?: string;
}

const DISPUTE_REASONS = [
  { value: 'counterfeit', label: '🚫 Counterfeit / Fake Item', baseline: true },
  { value: 'not_as_described', label: '📝 Not As Described', baseline: true },
  { value: 'damaged_packaging', label: '📦 Damaged Due to Packaging', baseline: true },
  { value: 'undisclosed_defects', label: '⚠️ Undisclosed Defects', baseline: true },
  { value: 'wrong_item', label: '❌ Wrong Item/Size/Color', baseline: true },
  { value: 'buyers_remorse', label: '💭 Changed My Mind', baseline: false },
  { value: 'other', label: '📋 Other Issue', baseline: false },
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  visible,
  onClose,
  orderId,
  itemId,
  itemName,
  itemPhoto,
}) => {
  const { theme, colors } = useTheme();
  const [reason, setReason] = useState('not_as_described');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhoto[]>([]);
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);

  const selectedReason = DISPUTE_REASONS.find(r => r.value === reason);
  const isBaselineProtected = selectedReason?.baseline || false;

  const uploadImageToServer = async (localUri: string): Promise<string> => {
    const token = await AsyncStorage.getItem('jwtToken');

    const formData = new FormData();
    const filename = localUri.split('/').pop() || 'evidence.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    formData.append('file', {
      uri: localUri,
      type,
      name: filename,
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/upload-evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload evidence.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const validUris: string[] = [];
        const invalidReasons: string[] = [];

        for (const asset of result.assets) {
          if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
            invalidReasons.push(`Image too large (${(asset.fileSize / (1024 * 1024)).toFixed(1)}MB). Max 10MB.`);
            continue;
          }
          if (asset.width && asset.height && (asset.width < 400 || asset.height < 400)) {
            invalidReasons.push(`Image too small (${asset.width}x${asset.height}). Min 400x400px.`);
            continue;
          }
          validUris.push(asset.uri);
        }

        if (invalidReasons.length > 0) {
          Alert.alert('Some Photos Invalid', invalidReasons.join('\n'), [{ text: 'OK' }]);
        }

        if (validUris.length === 0) return;

        const remainingSlots = 5 - evidencePhotos.length;
        const toAdd = validUris.slice(0, remainingSlots);

        if (toAdd.length === 0) {
          Alert.alert('Limit Reached', 'You can only upload up to 5 photos');
          return;
        }

        setEvidencePhotos(prev => [
          ...prev,
          ...toAdd.map(uri => ({ localUri: uri, serverUrl: null })),
        ]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setEvidencePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please describe the issue with this item.');
      return;
    }
    if (description.trim().length < 20) {
      Alert.alert('Too Short', 'Please provide more details (at least 20 characters).');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      // Upload any photos not yet on the server
      const photosToSubmit = [...evidencePhotos];
      for (let i = 0; i < photosToSubmit.length; i++) {
        if (photosToSubmit[i].serverUrl === null) {
          try {
            const url = await uploadImageToServer(photosToSubmit[i].localUri);
            photosToSubmit[i] = { ...photosToSubmit[i], serverUrl: url };
          } catch (error) {
            console.error(`Failed to upload photo ${i + 1}:`, error);
          }
        }
      }
      setEvidencePhotos(photosToSubmit);

      const serverUrls = photosToSubmit
        .filter(p => p.serverUrl !== null)
        .map(p => p.serverUrl as string);

      const response = await fetch(`${API_BASE_URL}/api/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          item_id: itemId,
          reason,
          description: description.trim(),
          evidence_photos: JSON.stringify(serverUrls),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Dispute Created! ✅',
          data.baseline_protected
            ? `Platform baseline protection applies. Seller must accept return regardless of their policy.\n\nSeller has 48 hours to respond.`
            : `Dispute submitted successfully.\n\nSeller has 48 hours to respond.`,
          [{
            text: 'OK',
            onPress: () => {
              setDescription('');
              setReason('not_as_described');
              setEvidencePhotos([]);
              onClose();
            },
          }]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Dispute creation error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme === 'dark' ? '#333' : '#E2E8F0' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Open Dispute</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Item Info */}
            <View style={[styles.itemInfo, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{itemName}</Text>
              <Text style={[styles.itemId, { color: colors.textSecondary }]}>Item #{itemId}</Text>
            </View>

            {/* Reason Picker */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>Reason for Dispute:</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF', borderColor: theme === 'dark' ? '#444' : '#E2E8F0' }]}>
              <Picker
                selectedValue={reason}
                onValueChange={(value) => setReason(value)}
                style={[styles.picker, { color: colors.textPrimary }]}
                dropdownIconColor={colors.textPrimary}
              >
                {DISPUTE_REASONS.map((r) => (
                  <Picker.Item key={r.value} label={r.label} value={r.value} color={theme === 'dark' ? '#FFF' : '#000'} />
                ))}
              </Picker>
            </View>

            {/* Baseline Protection Notice */}
            {isBaselineProtected && (
              <View style={[styles.baselineNotice, { backgroundColor: theme === 'dark' ? '#064E3B' : '#D1FAE5' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={[styles.baselineText, { color: theme === 'dark' ? '#6EE7B7' : '#065F46' }]}>
                  🛡️ Platform Baseline Protection - Seller MUST accept return regardless of their policy
                </Text>
              </View>
            )}

            {/* Description */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>Describe the Issue:</Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB',
                borderColor: theme === 'dark' ? '#444' : '#E2E8F0',
                color: colors.textPrimary,
              }]}
              placeholderTextColor={theme === 'dark' ? '#999' : '#9CA3AF'}
              multiline
              numberOfLines={6}
              placeholder="Provide detailed information about the problem. Include specifics like:&#10;• What was wrong with the item?&#10;• How does it differ from the listing?&#10;• What damage or defects exist?"
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>{description.length} / 1000 characters</Text>

            {/* Evidence Photos */}
            <View style={styles.photoSection}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Evidence Photos (Optional):</Text>

              {evidencePhotos.length > 0 && (
                <View style={styles.photoGrid}>
                  {evidencePhotos.map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                      <TouchableOpacity onPress={() => setViewingPhotoIndex(index)}>
                        <Image source={{ uri: photo.localUri }} style={styles.photoThumbnail} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {evidencePhotos.length < 5 && (
                <TouchableOpacity
                  style={[styles.addPhotoButton, { backgroundColor: theme === 'dark' ? '#2D1B4E' : '#F5F0FF' }]}
                  onPress={handlePickImages}
                >
                  <Ionicons name="camera-outline" size={32} color="#6A0DAD" />
                  <Text style={styles.addPhotoText}>
                    {evidencePhotos.length === 0 ? 'Add Evidence Photos' : `Add More (${evidencePhotos.length}/5)`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tips */}
            <View style={[styles.tips, { backgroundColor: theme === 'dark' ? '#2D1A00' : '#FEF3C7' }]}>
              <Text style={[styles.tipsTitle, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>💡 Tips for Disputes:</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>• Be specific and factual</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>• Clear, well-lit photos are crucial evidence</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>• Multiple angles help verify the issue</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>• Compare to original listing photos</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>• Minimum 400x400px, max 10MB per photo</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>• Photos upload when you submit the dispute</Text>
              <Text style={[styles.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' }]}>• BidGoat reviews all evidence for final decision</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.modalFooter, { borderTopColor: theme === 'dark' ? '#333' : '#E2E8F0' }]}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC',
                  borderColor: theme === 'dark' ? '#444' : '#E2E8F0',
                },
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Dispute</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Full Screen Photo Viewer */}
      {viewingPhotoIndex !== null && (
        <Modal visible={true} animationType="fade" transparent={false}>
          <View style={styles.photoViewerContainer}>
            <View style={styles.photoViewerHeader}>
              <TouchableOpacity
                onPress={() => setViewingPhotoIndex(null)}
                style={styles.photoViewerCloseButton}
              >
                <Ionicons name="close" size={32} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.photoViewerTitle}>
                Evidence Photo {viewingPhotoIndex + 1} of {evidencePhotos.length}
              </Text>
            </View>

            <View style={styles.photoViewerImageContainer}>
              <ZoomableImage uri={evidencePhotos[viewingPhotoIndex].localUri} />
            </View>

            {evidencePhotos.length > 1 && (
              <View style={styles.photoViewerDots}>
                {evidencePhotos.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setViewingPhotoIndex(index)}
                  >
                    <View
                      style={[
                        styles.photoViewerDot,
                        { backgroundColor: index === viewingPhotoIndex ? '#6A0DAD' : '#D6D6D6' },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {evidencePhotos.length > 1 && (
              <>
                {viewingPhotoIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.photoViewerArrow, styles.photoViewerArrowLeft]}
                    onPress={() => setViewingPhotoIndex(viewingPhotoIndex - 1)}
                  >
                    <Ionicons name="chevron-back" size={40} color="#FFF" />
                  </TouchableOpacity>
                )}
                {viewingPhotoIndex < evidencePhotos.length - 1 && (
                  <TouchableOpacity
                    style={[styles.photoViewerArrow, styles.photoViewerArrowRight]}
                    onPress={() => setViewingPhotoIndex(viewingPhotoIndex + 1)}
                  >
                    <Ionicons name="chevron-forward" size={40} color="#FFF" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  itemInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemId: {
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 56,
  },
  picker: {
    height: 56,
  },
  baselineNotice: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  baselineText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addPhotoButton: {
    borderWidth: 2,
    borderColor: '#6A0DAD',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 15,
    color: '#6A0DAD',
    fontWeight: '600',
  },
  tips: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 120,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6A0DAD',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  photoViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  photoViewerCloseButton: {
    marginRight: 15,
  },
  photoViewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  photoViewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 100,
  },
  zoomableContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
  },
  photoViewerDots: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoViewerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  photoViewerArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerArrowLeft: {
    left: 20,
  },
  photoViewerArrowRight: {
    right: 20,
  },
});

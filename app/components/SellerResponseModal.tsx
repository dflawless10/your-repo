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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '@/app/theme/ThemeContext';
import { API_BASE_URL } from '@/config';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface SellerResponseModalProps {
  visible: boolean;
  dispute: {
    id: number;
    order_id: number;
    item_name: string;
    buyer_username: string;
    reason: string;
    description: string;
    evidence_photos: string;
    response_deadline: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

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
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
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
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{ width: '100%', height: 200 }, animatedStyle]}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
};

export const SellerResponseModal: React.FC<SellerResponseModalProps> = ({
  visible,
  dispute,
  onClose,
  onSuccess,
}) => {
  const { theme, colors } = useTheme();
  const [response, setResponse] = useState('');
  const [counterEvidencePhotos, setCounterEvidencePhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const parsePhotos = (photosJson: string): string[] => {
    try {
      return JSON.parse(photosJson);
    } catch {
      return [];
    }
  };

  const buyerPhotos = parsePhotos(dispute.evidence_photos);

  const getTimeRemaining = (): { hours: number; minutes: number; isUrgent: boolean } => {
    const now = new Date().getTime();
    const deadlineTime = new Date(dispute.response_deadline).getTime();
    const diff = Math.max(0, deadlineTime - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const isUrgent = hours < 6;

    return { hours, minutes, isUrgent };
  };

  const timeRemaining = getTimeRemaining();

  const uploadImageToServer = async (localUri: string): Promise<string> => {
    const token = await AsyncStorage.getItem('jwtToken');
    const formData = new FormData();
    const filename = localUri.split('/').pop() || 'evidence.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

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
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handlePickPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to upload evidence.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 5 - counterEvidencePhotos.length,
      });

      if (!result.canceled && result.assets) {
        setUploadingPhoto(true);

        const validPhotos: string[] = [];
        const invalidPhotos: string[] = [];

        for (const asset of result.assets) {
          if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
            invalidPhotos.push(`Image too large (${(asset.fileSize / (1024 * 1024)).toFixed(1)}MB). Max 10MB.`);
            continue;
          }
          if (asset.width && asset.height && (asset.width < 400 || asset.height < 400)) {
            invalidPhotos.push(`Image too small (${asset.width}x${asset.height}). Min 400x400px.`);
            continue;
          }
          validPhotos.push(asset.uri);
        }

        if (invalidPhotos.length > 0) {
          Alert.alert('Some photos were rejected', invalidPhotos.join('\n\n'));
        }

        const uploadedUrls: string[] = [];
        for (const uri of validPhotos) {
          try {
            const serverUrl = await uploadImageToServer(uri);
            uploadedUrls.push(serverUrl);
          } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', `Failed to upload one or more photos: ${error}`);
          }
        }

        setCounterEvidencePhotos([...counterEvidencePhotos, ...uploadedUrls]);
        setUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Photo picker error:', error);
      Alert.alert('Error', 'Failed to select photos');
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setCounterEvidencePhotos(counterEvidencePhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!response.trim()) {
      Alert.alert('Error', 'Please provide a response to the dispute');
      return;
    }

    if (response.trim().length < 50) {
      Alert.alert('Error', 'Please provide a more detailed response (minimum 50 characters)');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const payload = {
        response: response.trim(),
        counter_evidence: counterEvidencePhotos.length > 0 ? JSON.stringify(counterEvidencePhotos) : null,
      };

      const response_api = await fetch(`${API_BASE_URL}/api/disputes/${dispute.id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response_api.json();

      if (response_api.ok) {
        Alert.alert(
          'Response Submitted',
          'Your response has been submitted to BidGoat for review. You will be notified of the final decision.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || data.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Response submission error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme === 'dark' ? '#333' : '#E5E7EB' }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Respond to Dispute</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Deadline Warning */}
            <View style={[styles.deadlineWarning, timeRemaining.isUrgent ? styles.deadlineWarningUrgent : styles.deadlineWarningNormal]}>
              <Ionicons
                name={timeRemaining.isUrgent ? "alert-circle" : "time-outline"}
                size={24}
                color={timeRemaining.isUrgent ? "#DC2626" : "#F59E0B"}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deadlineTitle, timeRemaining.isUrgent && styles.deadlineTitleUrgent]}>
                  {timeRemaining.isUrgent ? '⚠️ URGENT' : 'Response Deadline'}
                </Text>
                <Text style={[styles.deadlineText, timeRemaining.isUrgent && styles.deadlineTextUrgent]}>
                  {timeRemaining.hours}h {timeRemaining.minutes}m remaining to respond
                </Text>
                <Text style={[styles.deadlineSubtext, timeRemaining.isUrgent && styles.deadlineSubtextUrgent]}>
                  Failure to respond may result in automatic refund
                </Text>
              </View>
            </View>

            {/* Item Info */}
            <View style={[styles.itemInfo, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{dispute.item_name}</Text>
              <Text style={[styles.itemBuyer, { color: colors.textSecondary }]}>Dispute filed by {dispute.buyer_username}</Text>
            </View>

            {/* Buyer's Complaint */}
            <View style={[styles.complaintBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF7ED', borderColor: theme === 'dark' ? '#444' : '#FED7AA' }]}>
              <Text style={[styles.complaintTitle, { color: colors.textPrimary }]}>Buyer's Complaint</Text>
              <Text style={[styles.complaintReason, { color: colors.textSecondary }]}>Reason: {dispute.reason}</Text>
              <Text style={[styles.complaintDescription, { color: colors.textPrimary }]}>{dispute.description}</Text>

              {buyerPhotos.length > 0 && (
                <>
                  <Text style={[styles.evidenceLabel, { color: colors.textSecondary }]}>
                    Evidence Photos ({buyerPhotos.length})
                  </Text>
                  <Text style={[styles.zoomHint, { color: colors.textSecondary }]}>
                    Tap to expand • Double-tap or pinch to zoom
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                    {buyerPhotos.map((photo, idx) => (
                      <View key={idx} style={styles.zoomableContainer}>
                        <ZoomableImage uri={photo} />
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>

            {/* Your Response */}
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Your Response:</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Provide a detailed explanation of your position. Include any relevant details about the item's condition, listing description, or shipping process.
            </Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB',
                borderColor: theme === 'dark' ? '#444' : '#E2E8F0',
                color: colors.textPrimary
              }]}
              placeholder="Explain your side of the situation..."
              placeholderTextColor={theme === 'dark' ? '#999' : '#9CA3AF'}
              multiline
              numberOfLines={6}
              value={response}
              onChangeText={setResponse}
              maxLength={1000}
            />
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {response.length}/1000 characters {response.length < 50 && `(${50 - response.length} more required)`}
            </Text>

            {/* Counter Evidence */}
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Counter Evidence (Optional):</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Upload photos to support your case (e.g., proof of accurate listing, packaging photos, shipping records)
            </Text>

            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: theme === 'dark' ? '#444' : '#E2E8F0' }]}
              onPress={handlePickPhotos}
              disabled={uploadingPhoto || counterEvidencePhotos.length >= 5}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color="#6A0DAD" />
              ) : (
                <>
                  <Ionicons name="camera" size={24} color="#6A0DAD" />
                  <Text style={styles.uploadText}>
                    {counterEvidencePhotos.length >= 5 ? 'Maximum 5 photos' : `Add Photos (${counterEvidencePhotos.length}/5)`}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {counterEvidencePhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {counterEvidencePhotos.map((photo, idx) => (
                  <View key={idx} style={styles.photoItem}>
                    <Image source={{ uri: photo }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(idx)}
                    >
                      <Ionicons name="close-circle" size={24} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { borderTopColor: theme === 'dark' ? '#333' : '#E5E7EB' }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (response.length < 50 || loading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={response.length < 50 || loading}
            >
              <LinearGradient
                colors={loading || response.length < 50 ? ['#9CA3AF', '#9CA3AF'] : ['#DC2626', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFF" />
                    <Text style={styles.submitText}>Submit Response</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  deadlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
  },
  deadlineWarningNormal: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  deadlineWarningUrgent: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  deadlineTitleUrgent: {
    color: '#DC2626',
  },
  deadlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C2410C',
    marginBottom: 2,
  },
  deadlineTextUrgent: {
    color: '#991B1B',
  },
  deadlineSubtext: {
    fontSize: 12,
    color: '#92400E',
  },
  deadlineSubtextUrgent: {
    color: '#7F1D1D',
  },
  itemInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemBuyer: {
    fontSize: 14,
  },
  complaintBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  complaintTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  complaintReason: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  complaintDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  zoomHint: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  photoScroll: {
    marginTop: 8,
  },
  zoomableContainer: {
    width: 200,
    height: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 150,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  photoItem: {
    position: 'relative',
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default SellerResponseModal;

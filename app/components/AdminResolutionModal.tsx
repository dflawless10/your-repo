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
import { Image } from 'expo-image';
import { useTheme } from '@/app/theme/ThemeContext';
import { API_BASE_URL } from '@/config';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface AdminResolutionModalProps {
  visible: boolean;
  dispute: {
    id: number;
    order_id: number;
    item_name: string;
    buyer_username: string;
    seller_username: string;
    reason: string;
    description: string;
    evidence_photos: string;
    seller_response?: string;
    seller_evidence_photos?: string;
    baseline_protected: boolean;
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
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
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
      <Animated.View style={[{ width: '100%', height: 250 }, animatedStyle]}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
};

export const AdminResolutionModal: React.FC<AdminResolutionModalProps> = ({
  visible,
  dispute,
  onClose,
  onSuccess,
}) => {
  const { theme, colors } = useTheme();
  const [decision, setDecision] = useState<'refund_approved' | 'refund_denied' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const parsePhotos = (photosJson: string): string[] => {
    try {
      return JSON.parse(photosJson);
    } catch {
      return [];
    }
  };

  const buyerPhotos = parsePhotos(dispute.evidence_photos);
  const sellerPhotos = dispute.seller_evidence_photos ? parsePhotos(dispute.seller_evidence_photos) : [];

  const handleSubmit = async () => {
    if (!decision) {
      Alert.alert('Error', 'Please select a resolution decision');
      return;
    }

    if (!adminNotes.trim()) {
      Alert.alert('Error', 'Please provide notes explaining your decision');
      return;
    }

    if (adminNotes.trim().length < 30) {
      Alert.alert('Error', 'Please provide more detailed notes (minimum 30 characters)');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const payload = {
        decision,
        admin_notes: adminNotes.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/disputes/${dispute.id}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Dispute Resolved',
          `The dispute has been resolved. ${decision === 'refund_approved' ? 'Buyer will be refunded.' : 'Seller has prevailed.'}`,
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
        Alert.alert('Error', data.error || data.message || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Resolution submission error:', error);
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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Resolve Dispute</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Baseline Protection Notice */}
            {dispute.baseline_protected && (
              <View style={styles.baselineNotice}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.baselineTitle}>Platform Baseline Protection</Text>
                  <Text style={styles.baselineText}>
                    This dispute falls under BidGoat&#39;s baseline protection policy. Platform standards override seller policies.
                  </Text>
                </View>
              </View>
            )}

            {/* Item Info */}
            <View style={[styles.itemInfo, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{dispute.item_name}</Text>
              <Text style={[styles.itemParties, { color: colors.textSecondary }]}>
                {dispute.buyer_username} vs {dispute.seller_username}
              </Text>
            </View>

            {/* Buyer's Case */}
            <View style={[styles.caseSection, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF7ED', borderColor: theme === 'dark' ? '#444' : '#FED7AA' }]}>
              <View style={styles.caseSectionHeader}>
                <Ionicons name="person" size={20} color="#F59E0B" />
                <Text style={[styles.caseSectionTitle, { color: colors.textPrimary }]}>Buyer&#39;s Case</Text>
              </View>
              <Text style={[styles.caseReason, { color: colors.textSecondary }]}>Reason: {dispute.reason}</Text>
              <Text style={[styles.caseDescription, { color: colors.textPrimary }]}>{dispute.description}</Text>

              {buyerPhotos.length > 0 && (
                <>
                  <Text style={[styles.evidenceLabel, { color: colors.textSecondary }]}>
                    Buyer Evidence ({buyerPhotos.length} photo{buyerPhotos.length !== 1 ? 's' : ''})
                  </Text>
                  <Text style={[styles.zoomHint, { color: colors.textSecondary }]}>
                    Double-tap or pinch to zoom • Analyze closely
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

            {/* Seller's Response */}
            {dispute.seller_response ? (
              <View style={[styles.caseSection, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#EFF6FF', borderColor: theme === 'dark' ? '#444' : '#BFDBFE' }]}>
                <View style={styles.caseSectionHeader}>
                  <Ionicons name="storefront" size={20} color="#3B82F6" />
                  <Text style={[styles.caseSectionTitle, { color: colors.textPrimary }]}>Seller&#39;s Response</Text>
                </View>
                <Text style={[styles.caseDescription, { color: colors.textPrimary }]}>{dispute.seller_response}</Text>

                {sellerPhotos.length > 0 && (
                  <>
                    <Text style={[styles.evidenceLabel, { color: colors.textSecondary }]}>
                      Seller Counter-Evidence ({sellerPhotos.length} photo{sellerPhotos.length !== 1 ? 's' : ''})
                    </Text>
                    <Text style={[styles.zoomHint, { color: colors.textSecondary }]}>
                      Double-tap or pinch to zoom • Analyze closely
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                      {sellerPhotos.map((photo, idx) => (
                        <View key={idx} style={styles.zoomableContainer}>
                          <ZoomableImage uri={photo} />
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            ) : (
              <View style={[styles.noResponseBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FEF3C7' }]}>
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                <Text style={[styles.noResponseText, { color: colors.textPrimary }]}>
                  Seller did not respond within 48 hours
                </Text>
              </View>
            )}

            {/* Decision Selection */}
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Your Decision:</Text>
            <View style={styles.decisionContainer}>
              <TouchableOpacity
                style={[
                  styles.decisionCard,
                  { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF', borderColor: theme === 'dark' ? '#444' : '#E5E7EB' },
                  decision === 'refund_approved' && { borderColor: '#10B981', backgroundColor: theme === 'dark' ? '#1E3A2E' : '#D1FAE5' }
                ]}
                onPress={() => setDecision('refund_approved')}
              >
                <Ionicons name="checkmark-circle" size={32} color={decision === 'refund_approved' ? '#10B981' : (theme === 'dark' ? '#666' : '#9CA3AF')} />
                <Text style={[styles.decisionTitle, { color: colors.textPrimary }, decision === 'refund_approved' && { color: '#10B981' }]}>
                  Approve Refund
                </Text>
                <Text style={[styles.decisionSubtext, { color: colors.textSecondary }]}>
                  Buyer will receive full refund
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.decisionCard,
                  { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF', borderColor: theme === 'dark' ? '#444' : '#E5E7EB' },
                  decision === 'refund_denied' && { borderColor: '#F59E0B', backgroundColor: theme === 'dark' ? '#3A2E1E' : '#FEF3C7' }
                ]}
                onPress={() => setDecision('refund_denied')}
              >
                <Ionicons name="close-circle" size={32} color={decision === 'refund_denied' ? '#F59E0B' : (theme === 'dark' ? '#666' : '#9CA3AF')} />
                <Text style={[styles.decisionTitle, { color: colors.textPrimary }, decision === 'refund_denied' && { color: '#F59E0B' }]}>
                  Deny Refund
                </Text>
                <Text style={[styles.decisionSubtext, { color: colors.textSecondary }]}>
                  Seller keeps payment
                </Text>
              </TouchableOpacity>
            </View>

            {/* Admin Notes */}
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Resolution Notes:</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Explain your decision. This will be shared with both parties.
            </Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB',
                borderColor: theme === 'dark' ? '#444' : '#E2E8F0',
                color: colors.textPrimary
              }]}
              placeholder="Provide a clear explanation of your decision..."
              placeholderTextColor={theme === 'dark' ? '#999' : '#9CA3AF'}
              multiline
              numberOfLines={6}
              value={adminNotes}
              onChangeText={setAdminNotes}
              maxLength={1000}
            />
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {adminNotes.length}/1000 characters {adminNotes.length < 30 && `(${30 - adminNotes.length} more required)`}
            </Text>
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { borderTopColor: theme === 'dark' ? '#333' : '#E5E7EB' }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!decision || adminNotes.length < 30 || loading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!decision || adminNotes.length < 30 || loading}
            >
              <LinearGradient
                colors={loading || !decision || adminNotes.length < 30 ? ['#9CA3AF', '#9CA3AF'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#FFF" />
                    <Text style={styles.submitText}>Submit Resolution</Text>
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
  baselineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  baselineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  baselineText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
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
  itemParties: {
    fontSize: 14,
  },
  caseSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  caseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  caseSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  caseReason: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  caseDescription: {
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
    width: 250,
    height: 250,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  noResponseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  noResponseText: {
    fontSize: 14,
    fontWeight: '500',
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
  decisionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  decisionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  decisionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  decisionSubtext: {
    fontSize: 12,
    textAlign: 'center',
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

export default AdminResolutionModal;

import React, { useState } from 'react';
import { API_BASE_URL } from '@/config';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Order {
  id: number;
  item_name: string;
  seller_username: string;
  sale_price: number;
  photo_url: string;
}

interface DisputeModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DISPUTE_REASONS = [
  { value: 'counterfeit', label: 'Counterfeit / Fake', icon: 'alert-circle' },
  { value: 'not_as_described', label: 'Not as Described', icon: 'document-text' },
  { value: 'damaged', label: 'Item Arrived Damaged', icon: 'warning' },
  { value: 'wrong_item', label: 'Wrong Item Received', icon: 'swap-horizontal' },
  { value: 'missing_parts', label: 'Missing Parts / Accessories', icon: 'cube' },
  { value: 'never_arrived', label: 'Item Never Arrived', icon: 'help-circle' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  visible,
  order,
  onClose,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a dispute reason.');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      Alert.alert('Error', 'Please describe your issue.');
      return;
    }

    const reason =
      selectedReason === 'other'
        ? customReason
        : DISPUTE_REASONS.find(r => r.value === selectedReason)?.label;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${order.id}/dispute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason,
            description: customReason,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Dispute Submitted',
          'Your dispute has been submitted. Our team will review it within 48 hours.',
          [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to submit dispute.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error submitting dispute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Open Dispute</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle}>{order.item_name}</Text>
              <Text style={styles.orderPrice}>${order.sale_price.toFixed(2)}</Text>
              <Text style={styles.orderSeller}>Sold by {order.seller_username}</Text>
            </View>

            {/* Reason Selection */}
            <Text style={styles.sectionLabel}>Why are you opening a dispute?</Text>
            <View style={styles.reasonsContainer}>
              {DISPUTE_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonCard,
                    selectedReason === reason.value && styles.reasonCardSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={24}
                    color={selectedReason === reason.value ? '#6A0DAD' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === reason.value && styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#6A0DAD" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason Input */}
            {selectedReason === 'other' && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.customReasonLabel}>Please describe the issue:</Text>
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Explain the problem in detail..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={customReason}
                  onChangeText={setCustomReason}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>{customReason.length}/500</Text>
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, (!selectedReason || loading) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!selectedReason || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="flag" size={20} color="#FFF" />
                  <Text style={styles.submitText}>Submit Dispute</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  closeButton: { padding: 4 },
  content: { padding: 20 },
  orderInfo: { marginBottom: 16 },
  orderTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  orderPrice: { fontSize: 16, fontWeight: '700', color: '#6A0DAD', marginBottom: 4 },
  orderSeller: { fontSize: 14, color: '#555' },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  reasonsContainer: { gap: 10 },
  reasonCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#DDD', borderRadius: 10 },
  reasonCardSelected: { borderColor: '#6A0DAD', backgroundColor: '#F3E8FF' },
  reasonLabel: { flex: 1, marginLeft: 10, fontSize: 15 },
  reasonLabelSelected: { color: '#6A0DAD', fontWeight: '600' },
  customReasonContainer: { marginTop: 20 },
  customReasonLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  customReasonInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, height: 100 },
  characterCount: { textAlign: 'right', color: '#999', marginTop: 4 },
  footer: { padding: 20 },
  submitButton: { backgroundColor: '#6A0DAD', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from "expo-router";
import { orders } from 'types/orders';
import { useTheme } from '@/app/theme/ThemeContext';


export interface ReturnOrder {
  id: string;
  item_id: string;
  item_name: string;
  photo_url: string;
  sale_price: number;
  delivered_at: string;
  seller_username: string;
}

interface ReturnRequestModalProps {
  visible: boolean;
  order: orders;   // ✔ FIXED
  returnPolicy: {
    return_policy: string;
    return_window_days: number;
    buyer_pays_return_shipping: boolean;
    restocking_fee_percent: number;
  };
  onClose: () => void;
  onSuccess: () => void;
  onOpenDispute: (order: orders) => void;
}


const RETURN_REASONS = [
  { value: 'not_as_described', label: 'Item not as described', icon: 'alert-circle' },
  { value: 'wrong_item', label: 'Received wrong item', icon: 'swap-horizontal' },
  { value: 'damaged', label: 'Item arrived damaged', icon: 'warning' },
  { value: 'defective', label: 'Item is defective', icon: 'construct' },
  { value: 'size_fit', label: "Size/fit doesn't work", icon: 'resize' },
  { value: 'changed_mind', label: "Changed my mind", icon: 'heart-dislike' },
  { value: 'other', label: 'Other reason', icon: 'ellipsis-horizontal' },
];

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  visible,
  order,
  returnPolicy,
  onClose,
  onSuccess,
  onOpenDispute,
}) => {
  const { theme, colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);

  if (!order) return null;


  const deliveredAt = order.delivered_at ?? "";
  const deliveredDate = new Date(deliveredAt);

  const daysRemaining = Math.max(
    0,
    returnPolicy.return_window_days -
      Math.floor(
        (Date.now() - deliveredDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
  );

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for the return');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      Alert.alert('Error', 'Please provide details for your return reason');
      return;
    }

    const reason = selectedReason === 'other'
      ? customReason
      : RETURN_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const response = await fetch(`${API_BASE_URL}/api/returns/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          reason: reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Return Request Submitted',
          `Your return request has been sent to ${order.seller_username}. You'll be notified when they respond.`,
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
        Alert.alert('Error', data.error || data.message || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Return request error:', error);
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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Request Return</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <View style={[styles.orderInfo, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.orderTitle, { color: colors.textPrimary }]}>{order.item_name}</Text>
              <Text style={styles.orderPrice}>${order.sale_price.toFixed(2)}</Text>
              <Text style={[styles.orderSeller, { color: colors.textSecondary }]}>Sold by {order.seller_username}</Text>
            </View>

            {/* Return Window Warning */}
            <View style={[styles.infoBox, daysRemaining <= 3 ? styles.infoBoxWarning : styles.infoBoxInfo]}>
              <Ionicons
                name={daysRemaining <= 3 ? 'warning' : 'information-circle'}
                size={20}
                color={daysRemaining <= 3 ? '#F97316' : '#3B82F6'}
              />
              <Text style={[styles.infoText, daysRemaining <= 3 && styles.infoTextWarning]}>
                {daysRemaining > 0
                  ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to request return`
                  : 'Last day to request return!'}
              </Text>
            </View>

            {/* Return Policy Summary */}
            <View style={[styles.policyBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.policyTitle, { color: colors.textPrimary }]}>Return Policy</Text>
              <Text style={[styles.policyText, { color: colors.textSecondary }]}>
                • {returnPolicy.return_window_days}-day return window
              </Text>
              <Text style={styles.policyText}>
                • Return shipping: {returnPolicy.buyer_pays_return_shipping ? 'You pay' : 'Seller pays'}
              </Text>
              {returnPolicy.restocking_fee_percent > 0 && (
                <Text style={styles.policyText}>
                  • {returnPolicy.restocking_fee_percent}% restocking fee may apply
                </Text>
              )}
            </View>

            {/* Reason Selection */}
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Why are you returning this item?</Text>
            <View style={styles.reasonsContainer}>
              {RETURN_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonCard,
                    { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF', borderColor: theme === 'dark' ? '#444' : '#E5E7EB' },
                    selectedReason === reason.value && { borderColor: '#6A0DAD', backgroundColor: theme === 'dark' ? '#3A2A4D' : '#F5F0FF' },
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={24}
                    color={selectedReason === reason.value ? '#6A0DAD' : (theme === 'dark' ? '#999' : '#9CA3AF')}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      { color: colors.textPrimary },
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
                <Text style={styles.customReasonLabel}>Please provide details:</Text>
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Explain why you're returning this item..."
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
    style={[
      styles.submitButton,
      (!selectedReason || loading) && styles.submitButtonDisabled
    ]}
    onPress={handleSubmit}
    disabled={!selectedReason || loading}
  >

             <LinearGradient
      colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#6A0DAD', '#8B5CF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.submitGradient}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          <Ionicons name="return-up-back" size={20} color="#FFF" />
          <Text style={styles.submitText}>Submit Return Request</Text>
        </>
      )}
             </LinearGradient>
               </TouchableOpacity>

{/* Open Dispute Link — OUTSIDE the button */}
  <TouchableOpacity
    style={styles.disputeLink}
    onPress={() => onOpenDispute(order)}
  >
    <Text style={styles.disputeLinkText}>
      Having trouble? Open a dispute
    </Text>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  orderInfo: {
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 4,
  },
  orderSeller: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoBoxInfo: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBoxWarning: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  infoTextWarning: {
    color: '#C2410C',
  },
  policyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  reasonsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reasonCardSelected: {
    borderColor: '#6A0DAD',
    backgroundColor: '#F5F0FF',
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  reasonLabelSelected: {
    color: '#6A0DAD',
    fontWeight: '600',
  },
  customReasonContainer: {
    marginBottom: 20,
  },
  customReasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  customReasonInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  disputeLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  disputeLinkText: {
    color: '#6A0DAD',
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});

export default ReturnRequestModal;

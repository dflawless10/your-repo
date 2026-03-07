import { API_BASE_URL } from '@/config';

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

interface ReportItemModalProps {
  visible: boolean;
  itemId: number;
  itemName: string;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

interface ReportReason {
  value: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

const REPORT_REASONS: ReportReason[] = [
  { value: 'misleading', label: 'Misleading or False Description', severity: 'high' },
  { value: 'counterfeit', label: 'Suspected Counterfeit Item', severity: 'high' },
  { value: 'inappropriate_photo', label: 'Inappropriate Photo', severity: 'high' },
  { value: 'wrong_category', label: 'Wrong Category', severity: 'low' },
  { value: 'spam', label: 'Spam or Irrelevant Content', severity: 'medium' },
  { value: 'offensive', label: 'Offensive Content', severity: 'high' },
  { value: 'contact_info', label: 'Contains Contact Information', severity: 'high' },
  { value: 'price_manipulation', label: 'Price Manipulation', severity: 'medium' },
  { value: 'stolen', label: 'Suspected Stolen Item', severity: 'high' },
  { value: 'other', label: 'Other (Specify)', severity: 'medium' },
];

export default function ReportItemModal({
  visible,
  itemId,
  itemName,
  onClose,
  onReportSubmitted,
}: ReportItemModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    if (selectedReason === 'other' && !details.trim()) {
      Alert.alert('Error', 'Please provide details for "Other" reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/report/item/${itemId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add auth token from secure storage
          },
          body: JSON.stringify({
            reason: selectedReason,
            details: details.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Report Submitted',
          `Thank you for helping keep BidGoat safe. Our team will review your report within 24 hours.\n\n${
            data.item_flagged
              ? '⚠️ This item has been flagged for immediate review due to multiple reports.'
              : ''
          }`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedReason(null);
                setDetails('');
                onClose();
                if (onReportSubmitted) {
                  onReportSubmitted();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🚩 Report Item</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.itemName}>"{itemName}"</Text>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Instructions */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Please select a reason for reporting this listing. All reports are
                reviewed by our team within 24 hours.
              </Text>
            </View>

            {/* Report Reasons */}
            <Text style={styles.sectionTitle}>Reason for Report:</Text>

            <View style={styles.reasonsList}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason.value && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <View style={styles.reasonHeader}>
                    <View style={styles.radioButton}>
                      {selectedReason === reason.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.reasonLabel,
                        selectedReason === reason.value && styles.reasonLabelSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </View>

                  {reason.severity === 'high' && (
                    <Text style={styles.severityBadge}>High Priority</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Details */}
            <Text style={styles.sectionTitle}>Additional Details (Optional):</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Provide any additional information..."
              placeholderTextColor="#9CA3AF"
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{details.length} / 500 characters</Text>

            {/* Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ False Reports</Text>
              <Text style={styles.warningText}>
                Submitting false or malicious reports may result in your account being
                suspended. Only report listings that genuinely violate BidGoat's
                policies.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  itemName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  scrollView: {
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  reasonsList: {
    marginBottom: 20,
  },
  reasonItem: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  reasonItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  reasonLabelSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  severityBadge: {
    marginTop: 8,
    marginLeft: 32,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginTop: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

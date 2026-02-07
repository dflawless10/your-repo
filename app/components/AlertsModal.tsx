// app/components/AlertsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  registerAlert,
  getAlertDescription,
  getAlertIcon,
  getAvailableAlertTypes,
  type AlertType,
} from '@/api/alerts';

interface AlertsModalProps {
  visible: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  isAuction?: boolean;
  isSeller?: boolean;
}

export default function AlertsModal({
  visible,
  onClose,
  itemId,
  itemName,
  isAuction = false,
  isSeller = false,
}: Readonly<AlertsModalProps>) {
  const [selectedAlerts, setSelectedAlerts] = useState<Set<AlertType>>(new Set());
  const [loading, setLoading] = useState(false);
  const [availableAlerts, setAvailableAlerts] = useState<AlertType[]>([]);

  useEffect(() => {
    if (visible) {
      const alerts = getAvailableAlertTypes(isAuction, isSeller);
      setAvailableAlerts(alerts);
      setSelectedAlerts(new Set());
    }
  }, [visible, isAuction, isSeller]);

  const toggleAlert = (alertType: AlertType) => {
    setSelectedAlerts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alertType)) {
        newSet.delete(alertType);
      } else {
        newSet.add(alertType);
      }
      return newSet;
    });
  };

  const handleSaveAlerts = async () => {
    if (selectedAlerts.size === 0) {
      Alert.alert('No Alerts Selected', 'Please select at least one alert type');
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(
        Array.from(selectedAlerts).map((alertType) =>
          registerAlert(itemId, alertType)
        )
      );

      const failedAlerts = results.filter((r) => !r.success);

      if (failedAlerts.length === 0) {
        Alert.alert(
          '🔔 Alerts Set!',
          `You'll be notified about ${selectedAlerts.size} event${
            selectedAlerts.size === 1 ? '' : 's'
          } for "${itemName}"`
        );
        onClose();
      } else if (failedAlerts.length < results.length) {
        Alert.alert(
          '⚠️ Partial Success',
          `${results.length - failedAlerts.length} alert${
            results.length - failedAlerts.length === 1 ? '' : 's'
          } registered successfully, but ${failedAlerts.length} failed.`
        );
      } else {
        Alert.alert('Error', 'Failed to register alerts. Please try again.');
      }
    } catch (error) {
      console.error('Error saving alerts:', error);
      Alert.alert('Error', 'An error occurred while saving alerts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="notifications" size={28} color="#FF6B35" />
              <Text style={styles.modalTitle}>Set Alerts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Item Name */}
          <Text style={styles.itemName} numberOfLines={2}>
            {itemName}
          </Text>

          <Text style={styles.description}>
            Choose which notifications you would like to receive for this item
          </Text>

          {/* Alert Options */}
          <View style={styles.alertOptions}>
            {availableAlerts.map((alertType) => {
              const isSelected = selectedAlerts.has(alertType);
              return (
                <TouchableOpacity
                  key={alertType}
                  style={[
                    styles.alertOption,
                    isSelected && styles.alertOptionActive,
                  ]}
                  onPress={() => toggleAlert(alertType)}
                  activeOpacity={0.7}
                >
                  <View style={styles.alertOptionLeft}>
                    <Ionicons
                      name={getAlertIcon(alertType) as any}
                      size={24}
                      color={isSelected ? '#FFF' : '#FF6B35'}
                    />
                    <Text
                      style={[
                        styles.alertOptionText,
                        isSelected && styles.alertOptionTextActive,
                      ]}
                    >
                      {getAlertDescription(alertType)}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#4A90E2" />
            <Text style={styles.infoText}>
              You will receive push notifications when these events occur
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (selectedAlerts.size === 0 || loading) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveAlerts}
            disabled={selectedAlerts.size === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.saveButtonText}>
                  Set {selectedAlerts.size} Alert{selectedAlerts.size === 1 ? '' : 's'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
  },
  closeButton: {
    padding: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
    lineHeight: 20,
  },
  alertOptions: {
    gap: 12,
    marginBottom: 20,
  },
  alertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  alertOptionActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  alertOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  alertOptionTextActive: {
    color: '#FFF',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#2C5282',
    flex: 1,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38A169',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});

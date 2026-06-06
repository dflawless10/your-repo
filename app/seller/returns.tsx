import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator, Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import GlobalFooter from '../components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';

interface ReturnRequest {
  return_id: number;
  order_id: number;
  item_id: number;
  item_name: string;
  photo_url: string;
  sale_price: number;
  reason: string;
  status: 'Requested' | 'Approved' | 'Denied';
  requested_at: string;
  approved: boolean;
  refunded: boolean;
  buyer_name: string;
  buyer_username: string;
  buyer_email: string;
}

export default function SellerReturnsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/seller/returns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReturns(data.returns || []);
      } else {
        console.error('Load returns failed:', response.status);
        Alert.alert('Error', 'Failed to load return requests');
      }
    } catch (error) {
      console.error('Load returns error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load returns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = (returnId: number, itemName: string) => {
    Alert.alert(
      'Approve Return',
      `Approve return for "${itemName}"?\n\nThe buyer will ship the item back to you. Once received, process the refund through your payment processor.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => { void respondToReturn(returnId, 'approve'); },
        },
      ]
    );
  };

  const handleDeny = (returnId: number, itemName: string) => {
    Alert.alert(
      'Deny Return',
      `Deny return for "${itemName}"?\n\nThe buyer will be notified. Make sure this aligns with your return policy.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: () => { void respondToReturn(returnId, 'deny'); },
        },
      ]
    );
  };

  const respondToReturn = async (returnId: number, action: 'approve' | 'deny') => {
    try {
      setProcessingId(returnId);
      const token = await AsyncStorage.getItem('jwtToken');

      const response = await fetch(`${API_BASE_URL}/api/returns/${returnId}/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        Alert.alert('Success', `Return ${action}d successfully`);
        loadReturns(); // Refresh list
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to respond to return');
      }
    } catch (error) {
      console.error('Respond to return error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setProcessingId(null);
    }
  };

  const markAsRefunded = async (returnId: number) => {
    try {
      setProcessingId(returnId);
      const token = await AsyncStorage.getItem('jwtToken');

      const response = await fetch(`${API_BASE_URL}/api/returns/${returnId}/refund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        Alert.alert('Success', 'Return marked as refunded');
        loadReturns();
      } else {
        Alert.alert('Error', 'Failed to mark as refunded');
      }
    } catch (error) {
      console.error('Mark refunded error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkRefunded = (returnId: number) => {
    Alert.alert(
      'Mark as Refunded',
      'Confirm that you have processed the refund through your payment processor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => { void markAsRefunded(returnId); },
        },
      ]
    );
  };

  const renderReturnCard = (returnRequest: ReturnRequest) => {
    const isProcessing = processingId === returnRequest.return_id;

    return (
      <View key={returnRequest.return_id} style={[styles.returnCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[
            styles.statusBadge,
            returnRequest.status === 'Requested' && styles.statusRequested,
            returnRequest.status === 'Approved' && styles.statusApproved,
            returnRequest.status === 'Denied' && styles.statusDenied,
          ]}>
            <Text style={styles.statusText}>{returnRequest.status}</Text>
          </View>
          <Text style={[styles.dateText, { color: theme === 'dark' ? '#999' : '#9CA3AF' }]}>
            {new Date(returnRequest.requested_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Item Info */}
        <View style={styles.itemRow}>
          <Image
            source={{ uri: returnRequest.photo_url || 'https://via.placeholder.com/60' }}
            style={styles.itemImage}
          />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
              {returnRequest.item_name}
            </Text>
            <Text style={styles.itemPrice}>${returnRequest.sale_price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Buyer Info */}
        <View style={styles.buyerInfo}>
          <Ionicons name="person-circle-outline" size={16} color={theme === 'dark' ? '#999' : '#6B7280'} />
          <Text style={[styles.buyerText, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
            {returnRequest.buyer_name} (@{returnRequest.buyer_username})
          </Text>
        </View>

        {/* Reason */}
        <View style={[styles.reasonBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
          <Text style={[styles.reasonLabel, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>Reason:</Text>
          <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{returnRequest.reason}</Text>
        </View>

        {/* Action Buttons */}
        {returnRequest.status === 'Requested' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.denyButton]}
              onPress={() => handleDeny(returnRequest.return_id, returnRequest.item_name)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#DC2626" />
                  <Text style={[styles.actionButtonText, styles.denyButtonText]}>Deny</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(returnRequest.return_id, returnRequest.item_name)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {returnRequest.status === 'Approved' && !returnRequest.refunded && (
          <TouchableOpacity
            style={styles.refundButton}
            onPress={() => handleMarkRefunded(returnRequest.return_id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#6A0DAD" />
            ) : (
              <>
                <Ionicons name="cash-outline" size={18} color="#6A0DAD" />
                <Text style={styles.refundButtonText}>Mark as Refunded</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {returnRequest.refunded && (
          <View style={styles.refundedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.refundedText}>Refund Processed</Text>
          </View>
        )}
      </View>
    );
  };

  const pendingReturns = returns.filter(r => r.status === 'Requested');
  const otherReturns = returns.filter(r => r.status !== 'Requested');

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading returns...</Text>
        </View>
      );
    }

    if (returns.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="return-up-back-outline" size={80} color={theme === 'dark' ? '#555' : '#D1D5DB'} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Return Requests</Text>
          <Text style={[styles.emptyText, { color: theme === 'dark' ? '#999' : '#6B7280' }]}>
            When buyers request returns, they&#39;ll appear here for you to review.
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Pending Returns */}
        {pendingReturns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#F97316" />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Pending ({pendingReturns.length})
              </Text>
            </View>
            {pendingReturns.map(renderReturnCard)}
          </View>
        )}

        {/* Other Returns */}
        {otherReturns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-done" size={20} color={theme === 'dark' ? '#999' : '#6B7280'} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Processed ({otherReturns.length})
              </Text>
            </View>
            {otherReturns.map(renderReturnCard)}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={new Animated.Value(0)} />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 100, backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReturns(); }} />
        }
      >
        {/* Page Header */}
        <View style={[styles.pageHeader, { backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Return Requests</Text>
        </View>

        {renderContent()}
      </ScrollView>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  returnCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusRequested: {
    backgroundColor: '#FEF3C7',
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
  },
  statusDenied: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  buyerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  reasonBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  denyButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  denyButtonText: {
    color: '#DC2626',
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F0FF',
    borderWidth: 1.5,
    borderColor: '#6A0DAD',
  },
  refundButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  refundedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  refundedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
});

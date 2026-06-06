import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';
import { API_BASE_URL } from '@/config';
import AdminResolutionModal from '@/app/components/AdminResolutionModal';

type Dispute = {
  id: number;
  order_id: number;
  item_id: number;
  item_name: string;
  photo_url: string;
  buyer_username: string;
  seller_username: string;
  reason: string;
  description: string;
  evidence_photos: string;
  seller_response?: string;
  seller_evidence_photos?: string;
  status: 'open' | 'seller_responded' | 'resolved';
  baseline_protected: boolean;
  created_at: string;
  seller_response_at?: string;
  admin_decision?: string;
  admin_notes?: string;
  resolved_at?: string;
  response_deadline: string;
};

export default function AdminDisputesScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'seller_responded' | 'resolved'>('all');
  const scrollY = new Animated.Value(0);
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);

    fetchDisputes();
    loadUsername();
  }, []);

  const loadUsername = async () => {
    const name = await AsyncStorage.getItem('userEmail');
    setUsername(name);
  };

  const fetchDisputes = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/disputes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐐 Admin disputes fetched:', data.disputes?.length);
        setDisputes(data.disputes || []);
      } else {
        console.error('🐐 Admin disputes fetch failed:', response.status);
        if (response.status === 403) {
          Alert.alert('Access Denied', 'You do not have admin permissions.');
          router.back();
        }
      }
    } catch (error) {
      console.error('Admin disputes fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#F59E0B';
      case 'seller_responded':
        return '#3B82F6';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Awaiting Seller';
      case 'seller_responded':
        return 'Ready for Review';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parsePhotos = (photosJson: string): string[] => {
    try {
      return JSON.parse(photosJson);
    } catch {
      return [];
    }
  };

  const handleResolve = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolutionModalVisible(true);
  };

  const filteredDisputes = disputes.filter(d =>
    filterStatus === 'all' ? true : d.status === filterStatus
  );

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    seller_responded: disputes.filter(d => d.status === 'seller_responded').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading disputes...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Page Header with Back Button */}
        <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Admin: Dispute Resolution</Text>
        </Animated.View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.open}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Open</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{stats.seller_responded}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.resolved}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {(['all', 'open', 'seller_responded', 'resolved'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F3F4F6' },
                filterStatus === status && styles.filterTabActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterTabText,
                { color: colors.textSecondary },
                filterStatus === status && styles.filterTabTextActive
              ]}>
                {status === 'all' ? 'All' : status === 'seller_responded' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredDisputes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={64} color={theme === 'dark' ? '#666' : '#CBD5E0'} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No disputes to review</Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#718096' }]}>
              {filterStatus === 'all' ? 'No disputes in the system' : `No ${filterStatus} disputes`}
            </Text>
          </View>
        ) : (
          <View style={styles.disputesContainer}>
            {filteredDisputes.map((dispute) => {
              const buyerPhotos = parsePhotos(dispute.evidence_photos);
              const sellerPhotos = dispute.seller_evidence_photos ? parsePhotos(dispute.seller_evidence_photos) : [];

              return (
                <View key={dispute.id} style={[styles.disputeCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
                  {/* Baseline Protection Badge */}
                  {dispute.baseline_protected && (
                    <View style={styles.baselineBadge}>
                      <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                      <Text style={styles.baselineBadgeText}>Baseline Protected - Platform Policy Applies</Text>
                    </View>
                  )}

                  {/* Item Info */}
                  <View style={styles.itemHeader}>
                    <Image source={{ uri: dispute.photo_url }} style={styles.itemImage} />
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                        {dispute.item_name}
                      </Text>
                      <Text style={[styles.disputeId, { color: theme === 'dark' ? '#999' : '#718096' }]}>
                        Dispute #{dispute.id}
                      </Text>
                      <Text style={[styles.parties, { color: colors.textSecondary }]}>
                        {dispute.buyer_username} vs {dispute.seller_username}
                      </Text>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispute.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(dispute.status)}</Text>
                  </View>

                  {/* Buyer's Case */}
                  <View style={[styles.caseBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF7ED' }]}>
                    <View style={styles.caseHeader}>
                      <Ionicons name="person" size={18} color="#F59E0B" />
                      <Text style={[styles.caseTitle, { color: colors.textPrimary }]}>Buyer's Case</Text>
                    </View>
                    <Text style={[styles.caseReason, { color: colors.textSecondary }]}>Reason: {dispute.reason}</Text>
                    <Text style={[styles.caseDescription, { color: colors.textPrimary }]}>{dispute.description}</Text>
                    {buyerPhotos.length > 0 && (
                      <Text style={[styles.evidenceCount, { color: colors.textSecondary }]}>
                        📷 {buyerPhotos.length} evidence photo{buyerPhotos.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>

                  {/* Seller's Response */}
                  {dispute.seller_response ? (
                    <View style={[styles.caseBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#EFF6FF' }]}>
                      <View style={styles.caseHeader}>
                        <Ionicons name="storefront" size={18} color="#3B82F6" />
                        <Text style={[styles.caseTitle, { color: colors.textPrimary }]}>Seller's Response</Text>
                      </View>
                      <Text style={[styles.caseDescription, { color: colors.textPrimary }]}>{dispute.seller_response}</Text>
                      {sellerPhotos.length > 0 && (
                        <Text style={[styles.evidenceCount, { color: colors.textSecondary }]}>
                          📷 {sellerPhotos.length} counter-evidence photo{sellerPhotos.length !== 1 ? 's' : ''}
                        </Text>
                      )}
                      <Text style={[styles.responseDate, { color: colors.textSecondary }]}>
                        Responded: {formatDate(dispute.seller_response_at!)}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.noResponseBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FEF3C7' }]}>
                      <Ionicons name="time-outline" size={18} color="#F59E0B" />
                      <Text style={[styles.noResponseText, { color: colors.textPrimary }]}>
                        Seller has not responded yet
                      </Text>
                    </View>
                  )}

                  {/* Resolution (if resolved) */}
                  {dispute.status === 'resolved' && dispute.admin_decision && (
                    <View style={[styles.resolutionBox, {
                      backgroundColor: dispute.admin_decision === 'refund_approved'
                        ? (theme === 'dark' ? '#1E3A2E' : '#D1FAE5')
                        : (theme === 'dark' ? '#3A2E1E' : '#FEF3C7'),
                      borderColor: dispute.admin_decision === 'refund_approved'
                        ? '#10B981'
                        : '#F59E0B'
                    }]}>
                      <Text style={[styles.resolutionTitle, {
                        color: dispute.admin_decision === 'refund_approved' ? '#10B981' : '#F59E0B'
                      }]}>
                        {dispute.admin_decision === 'refund_approved' ? '✅ Refund Approved' : '⚠️ Dispute Denied'}
                      </Text>
                      {dispute.admin_notes && (
                        <Text style={[styles.resolutionNotes, { color: colors.textSecondary }]}>
                          {dispute.admin_notes}
                        </Text>
                      )}
                      <Text style={[styles.resolutionDate, { color: colors.textSecondary }]}>
                        Resolved: {formatDate(dispute.resolved_at!)}
                      </Text>
                    </View>
                  )}

                  {/* Action Button */}
                  {dispute.status !== 'resolved' && dispute.status === 'seller_responded' && (
                    <TouchableOpacity
                      style={styles.resolveButton}
                      onPress={() => handleResolve(dispute)}
                    >
                      <Ionicons name="checkmark-done" size={20} color="#FFF" />
                      <Text style={styles.resolveButtonText}>Review & Resolve</Text>
                    </TouchableOpacity>
                  )}

                  {dispute.status === 'open' && (
                    <View style={styles.waitingBox}>
                      <Ionicons name="hourglass-outline" size={18} color={colors.textSecondary} />
                      <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
                        Waiting for seller response
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>
      <GlobalFooter />

      {/* Admin Resolution Modal */}
      {selectedDispute && resolutionModalVisible && (
        <AdminResolutionModal
          visible={resolutionModalVisible}
          dispute={selectedDispute}
          onClose={() => {
            setResolutionModalVisible(false);
            setSelectedDispute(null);
          }}
          onSuccess={() => {
            fetchDisputes();
          }}
        />
      )}
    </View>
  );
}

const createStyles = (isDark: boolean, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#6A0DAD',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  disputesContainer: {
    padding: 16,
  },
  disputeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  baselineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  baselineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  disputeId: {
    fontSize: 13,
    marginBottom: 2,
  },
  parties: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  caseBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 14,
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
    marginBottom: 8,
  },
  evidenceCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  responseDate: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  noResponseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  noResponseText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resolutionBox: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  resolutionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  resolutionNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resolutionDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  resolveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  waitingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

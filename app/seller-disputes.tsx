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
import SellerResponseModal from '@/app/components/SellerResponseModal';

type Dispute = {
  id: number;
  order_id: number;
  item_id: number;
  item_name: string;
  photo_url: string;
  buyer_username: string;
  reason: string;
  description: string;
  evidence_photos: string;
  status: 'open' | 'seller_responded' | 'resolved';
  baseline_protected: boolean;
  created_at: string;
  seller_response?: string;
  seller_response_at?: string;
  admin_decision?: string;
  admin_notes?: string;
  resolved_at?: string;
  response_deadline: string;
};

export default function SellerDisputesScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
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

      const response = await fetch(`${API_BASE_URL}/api/disputes/seller-disputes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐐 Seller disputes fetched:', data.disputes?.length);
        setDisputes(data.disputes || []);
      } else {
        console.error('🐐 Seller disputes fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Seller disputes fetch error:', error);
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
        return 'Awaiting Your Response';
      case 'seller_responded':
        return 'Under BidGoat Review';
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

  const getTimeRemaining = (deadline: string): { hours: number; minutes: number; isUrgent: boolean } => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const diff = Math.max(0, deadlineTime - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const isUrgent = hours < 6;

    return { hours, minutes, isUrgent };
  };

  const handleRespond = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResponseModalVisible(true);
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
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Disputes Against Me</Text>
        </Animated.View>

        {disputes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={64} color={theme === 'dark' ? '#666' : '#CBD5E0'} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No disputes yet</Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#718096' }]}>
              Any disputes filed against your items will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.disputesContainer}>
            {disputes.map((dispute) => {
              const photos = parsePhotos(dispute.evidence_photos);
              const timeRemaining = dispute.status === 'open' ? getTimeRemaining(dispute.response_deadline) : null;

              return (
                <View key={dispute.id} style={[styles.disputeCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
                  {/* Urgency Badge */}
                  {timeRemaining && timeRemaining.isUrgent && (
                    <View style={styles.urgencyBadge}>
                      <Ionicons name="warning" size={16} color="#DC2626" />
                      <Text style={styles.urgencyText}>
                        ⏰ {timeRemaining.hours}h {timeRemaining.minutes}m remaining to respond!
                      </Text>
                    </View>
                  )}

                  {/* Baseline Protection Badge */}
                  {dispute.baseline_protected && (
                    <View style={styles.baselineBadge}>
                      <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                      <Text style={styles.baselineBadgeText}>Baseline Protected</Text>
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
                      <Text style={[styles.buyerName, { color: colors.textSecondary }]}>
                        Filed by {dispute.buyer_username}
                      </Text>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispute.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(dispute.status)}</Text>
                  </View>

                  {/* Dispute Details */}
                  <View style={[styles.detailsBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
                    <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>Buyer's Complaint</Text>
                    <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>Reason:</Text>
                    <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{dispute.reason}</Text>
                    <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>Description:</Text>
                    <Text style={[styles.descriptionText, { color: colors.textPrimary }]}>{dispute.description}</Text>

                    {photos.length > 0 && (
                      <>
                        <Text style={[styles.evidenceLabel, { color: colors.textSecondary }]}>Evidence Photos: {photos.length}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                          {photos.map((photo, idx) => (
                            <Image key={idx} source={{ uri: photo }} style={styles.evidenceThumb} />
                          ))}
                        </ScrollView>
                      </>
                    )}
                  </View>

                  {/* Response Deadline */}
                  {dispute.status === 'open' && timeRemaining && (
                    <View style={[styles.deadlineBox, timeRemaining.isUrgent ? styles.deadlineBoxUrgent : styles.deadlineBoxNormal]}>
                      <Ionicons
                        name={timeRemaining.isUrgent ? "alert-circle" : "time-outline"}
                        size={20}
                        color={timeRemaining.isUrgent ? "#DC2626" : "#F59E0B"}
                      />
                      <Text style={[styles.deadlineText, timeRemaining.isUrgent && styles.deadlineTextUrgent]}>
                        You have {timeRemaining.hours} hours, {timeRemaining.minutes} minutes to respond or buyer may receive automatic refund
                      </Text>
                    </View>
                  )}

                  {/* Your Response (if submitted) */}
                  {dispute.seller_response && (
                    <View style={[styles.responseBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#EFF6FF' }]}>
                      <Text style={[styles.responseTitle, { color: colors.textPrimary }]}>Your Response</Text>
                      <Text style={[styles.responseDate, { color: colors.textSecondary }]}>
                        {formatDate(dispute.seller_response_at!)}
                      </Text>
                      <Text style={[styles.responseText, { color: colors.textPrimary }]}>
                        {dispute.seller_response}
                      </Text>
                    </View>
                  )}

                  {/* Resolution Details */}
                  {dispute.status === 'resolved' && dispute.admin_decision && (
                    <View style={[styles.resolutionBox, {
                      backgroundColor: dispute.admin_decision === 'refund_approved'
                        ? (theme === 'dark' ? '#3A2E1E' : '#FEF3C7')
                        : (theme === 'dark' ? '#1E3A2E' : '#D1FAE5'),
                      borderColor: dispute.admin_decision === 'refund_approved'
                        ? '#F59E0B'
                        : '#10B981'
                    }]}>
                      <Text style={[styles.resolutionTitle, {
                        color: dispute.admin_decision === 'refund_approved' ? '#F59E0B' : '#10B981'
                      }]}>
                        {dispute.admin_decision === 'refund_approved' ? '⚠️ Refund Issued to Buyer' : '✅ Dispute Ruled in Your Favor'}
                      </Text>
                      {dispute.admin_notes && (
                        <Text style={[styles.resolutionNotes, { color: colors.textSecondary }]}>
                          {dispute.admin_notes}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Action Buttons */}
                  {dispute.status === 'open' ? (
                    <TouchableOpacity
                      style={styles.respondButton}
                      onPress={() => handleRespond(dispute)}
                    >
                      <Ionicons name="chatbox-ellipses" size={20} color="#FFF" />
                      <Text style={styles.respondButtonText}>Respond to Dispute</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() => router.push(`/dispute-details?id=${dispute.id}` as any)}
                    >
                      <Text style={styles.viewDetailsText}>View Full Details</Text>
                      <Ionicons name="chevron-forward" size={20} color="#6A0DAD" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>
      <GlobalFooter />

      {/* Seller Response Modal */}
      {selectedDispute && responseModalVisible && (
        <SellerResponseModal
          visible={responseModalVisible}
          dispute={selectedDispute}
          onClose={() => {
            setResponseModalVisible(false);
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
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
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
    fontSize: 12,
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
  buyerName: {
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
  detailsBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 14,
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  photoScroll: {
    marginTop: 8,
  },
  evidenceThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  deadlineBoxNormal: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  deadlineBoxUrgent: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deadlineText: {
    flex: 1,
    fontSize: 13,
    color: '#C2410C',
    fontWeight: '500',
  },
  deadlineTextUrgent: {
    color: '#DC2626',
    fontWeight: '600',
  },
  responseBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
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
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  respondButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A0DAD',
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

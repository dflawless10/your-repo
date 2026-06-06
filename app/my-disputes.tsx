import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';

const API_URL = `${API_BASE_URL}`;

type Dispute = {
  id: number;
  order_id: number;
  item_id: number;
  item_name: string;
  photo_url: string;
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
  refund_amount?: number;
};

export default function MyDisputesScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
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

      const response = await fetch(`${API_URL}/api/disputes/my-disputes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐐 Disputes fetched:', data.disputes?.length);
        setDisputes(data.disputes || []);
      } else {
        console.error('🐐 Disputes fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Disputes fetch error:', error);
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
        return 'Awaiting Seller Response';
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
        {/* Page Title with Back Button */}
        <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
             <Ionicons name="arrow-back" size={28} color="#B794F4"  />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>My Disputes</Text>
        </Animated.View>

        {disputes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={64} color={theme === 'dark' ? '#666' : '#CBD5E0'} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No disputes yet</Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#999' : '#718096' }]}>
              Any disputes or return requests you open will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.disputesContainer}>
            {disputes.map((dispute) => {
              const photos = parsePhotos(dispute.evidence_photos);

              return (
                <View key={dispute.id} style={[styles.disputeCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
                  {/* Baseline Protection Badge */}
                  {dispute.baseline_protected && (
                    <View style={styles.baselineBadge}>
                      <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                      <Text style={styles.baselineBadgeText}>Platform Protected</Text>
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
                    </View>
                  </View>

                  {/* Status */}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispute.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(dispute.status)}</Text>
                  </View>

                  {/* Timeline */}
                  <View style={[styles.timeline, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
                    <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>Dispute Timeline</Text>

                    {/* Step 1: Created */}
                    <View style={styles.timelineItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <View style={styles.timelineContent}>
                        <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Dispute Opened</Text>
                        <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>{formatDate(dispute.created_at)}</Text>
                      </View>
                    </View>

                    {/* Step 2: Seller Response */}
                    {dispute.seller_response_at ? (
                      <View style={styles.timelineItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Seller Responded</Text>
                          <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>{formatDate(dispute.seller_response_at)}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.timelineItem}>
                        <Ionicons name="time-outline" size={20} color="#F59E0B" />
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Awaiting Seller (48h)</Text>
                        </View>
                      </View>
                    )}

                    {/* Step 3: Resolution */}
                    {dispute.resolved_at ? (
                      <View style={styles.timelineItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Resolved by BidGoat</Text>
                          <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>{formatDate(dispute.resolved_at)}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.timelineItem}>
                        <Ionicons name="ellipse-outline" size={20} color="#9CA3AF" />
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>Pending Resolution</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Resolution Details */}
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
                      {dispute.refund_amount && (
                        <Text style={[styles.resolutionAmount, { color: colors.textPrimary }]}>
                          Refund: ${dispute.refund_amount.toFixed(2)}
                        </Text>
                      )}
                      {dispute.admin_notes && (
                        <Text style={[styles.resolutionNotes, { color: colors.textSecondary }]}>
                          {dispute.admin_notes}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* View Details Button */}
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => router.push(`/dispute-details?id=${dispute.id}` as any)}
                  >
                    <Text style={styles.viewDetailsText}>View Full Details</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6A0DAD" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>
      <GlobalFooter />
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
  timeline: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
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
  resolutionAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  resolutionNotes: {
    fontSize: 14,
    lineHeight: 20,
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

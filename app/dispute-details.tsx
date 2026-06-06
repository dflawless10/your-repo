import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';

const API_URL = `${API_BASE_URL}`;

type DisputeDetails = {
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
  seller_response_photos?: string;
  seller_response_at?: string;
  admin_decision?: string;
  admin_notes?: string;
  resolved_at?: string;
  refund_amount?: number;
  buyer_email: string;
  seller_email: string;
};

export default function DisputeDetailsScreen() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dispute, setDispute] = useState<DisputeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in and pulsate animation
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

    fetchDisputeDetails();
    loadUsername();
  }, [id]);

  const loadUsername = async () => {
    const name = await AsyncStorage.getItem('userEmail');
    setUsername(name);
  };

  const fetchDisputeDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch(`${API_URL}/api/disputes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐐 Dispute details fetched:', data);
        setDispute(data.dispute);
      } else {
        console.error('🐐 Failed to fetch dispute details:', response.status);
        Alert.alert('Error', 'Failed to load dispute details');
        router.back();
      }
    } catch (error) {
      console.error('Dispute details fetch error:', error);
      Alert.alert('Error', 'Failed to load dispute details');
      router.back();
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading details...</Text>
      </View>
    );
  }

  if (!dispute) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Dispute not found</Text>
      </View>
    );
  }

  const evidencePhotos = parsePhotos(dispute.evidence_photos);
  const sellerPhotos = dispute.seller_response_photos ? parsePhotos(dispute.seller_response_photos) : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EnhancedHeader scrollY={scrollY} username={username} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Header with animations */}
        <Animated.View style={[
          styles.pageHeader,
          {
            backgroundColor: colors.background,
            borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5',
            opacity: headerOpacity,
            transform: [{ scale: headerScale }]
          }
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Dispute Details</Text>
        </Animated.View>

        {/* Baseline Protection Badge */}
        {dispute.baseline_protected && (
          <View style={[styles.protectionBanner, { backgroundColor: theme === 'dark' ? '#1E3A2E' : '#D1FAE5' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <View style={styles.protectionText}>
              <Text style={[styles.protectionTitle, { color: '#10B981' }]}>Platform Protection Active</Text>
              <Text style={[styles.protectionSubtitle, { color: theme === 'dark' ? '#A7F3D0' : '#047857' }]}>
                BidGoat baseline policies will enforce your rights
              </Text>
            </View>
          </View>
        )}

        {/* Item Card */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Disputed Item</Text>
          <View style={styles.itemContainer}>
            <Image source={{ uri: dispute.photo_url }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{dispute.item_name}</Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Order #{dispute.order_id}</Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Dispute #{dispute.id}</Text>
            </View>
          </View>
        </View>

        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispute.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(dispute.status)}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Opened on {formatDate(dispute.created_at)}
          </Text>
        </View>

        {/* Your Complaint */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Complaint</Text>
          <View style={[styles.reasonBadge, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
            <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{dispute.reason}</Text>
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{dispute.description}</Text>

          {evidencePhotos.length > 0 && (
            <>
              <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>Evidence Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {evidencePhotos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.evidencePhoto} />
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Seller's Response */}
        {dispute.seller_response && (
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginLeft: 8 }]}>Seller&#39;s Response</Text>
            </View>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{dispute.seller_response}</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              Responded on {dispute.seller_response_at ? formatDate(dispute.seller_response_at) : 'N/A'}
            </Text>

            {sellerPhotos.length > 0 && (
              <>
                <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>Seller&#39;s Evidence</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                  {sellerPhotos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.evidencePhoto} />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

        {/* BidGoat Decision */}
        {dispute.status === 'resolved' && dispute.admin_decision && (
          <View style={[styles.card, {
            backgroundColor: dispute.admin_decision === 'refund_approved'
              ? (theme === 'dark' ? '#1E3A2E' : '#D1FAE5')
              : (theme === 'dark' ? '#3A2E1E' : '#FEF3C7'),
            borderWidth: 2,
            borderColor: dispute.admin_decision === 'refund_approved' ? '#10B981' : '#F59E0B'
          }]}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name={dispute.admin_decision === 'refund_approved' ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={dispute.admin_decision === 'refund_approved' ? '#10B981' : '#F59E0B'}
              />
              <Text style={[styles.sectionTitle, {
                color: dispute.admin_decision === 'refund_approved' ? '#10B981' : '#F59E0B',
                marginLeft: 8
              }]}>
                {dispute.admin_decision === 'refund_approved' ? 'Refund Approved' : 'Dispute Denied'}
              </Text>
            </View>

            {dispute.refund_amount && (
              <Text style={[styles.refundAmount, { color: '#10B981' }]}>
                Refund Amount: ${dispute.refund_amount.toFixed(2)}
              </Text>
            )}

            {dispute.admin_notes && (
              <>
                <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>BidGoat&#39;s Decision</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>{dispute.admin_notes}</Text>
              </>
            )}

            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              Resolved on {dispute.resolved_at ? formatDate(dispute.resolved_at) : 'N/A'}
            </Text>
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dispute Timeline</Text>

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Dispute Opened</Text>
              <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>{formatDate(dispute.created_at)}</Text>
            </View>
          </View>

          {dispute.seller_response_at ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#3B82F6' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Seller Responded</Text>
                <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>{formatDate(dispute.seller_response_at)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Awaiting Seller Response (48h)</Text>
              </View>
            </View>
          )}

          {dispute.resolved_at ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>Resolved by BidGoat</Text>
                <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>{formatDate(dispute.resolved_at)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#9CA3AF' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>Pending Resolution</Text>
              </View>
            </View>
          )}
        </View>

        {/* Help Text */}
        <View style={[styles.helpBox, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F7FAFC' }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme === 'dark' ? '#999' : '#718096'} />
          <Text style={[styles.helpText, { color: theme === 'dark' ? '#999' : '#718096' }]}>
            BidGoat will review all disputes within 48-72 hours. You&#39;ll be notified via email when a decision is made.
          </Text>
        </View>
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
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  protectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  protectionText: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  protectionSubtitle: {
    fontSize: 14,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    marginTop: 4,
  },
  reasonBadge: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  photoScroll: {
    marginTop: 8,
  },
  evidencePhoto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  refundAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 13,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

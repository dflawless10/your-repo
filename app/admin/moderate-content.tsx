import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { PROHIBITED_CONTENT, REPORT_REASONS } from '../config/moderationPolicy';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

interface FlaggedItem {
  id: number;
  item_id: number;
  item_name: string;
  item_image?: string;
  reason: string;
  violation_type?: string;
  violation_severity?: 'low' | 'medium' | 'high';
  violation_details?: any;
  reported_by: string;
  reported_at: string;
  status: 'pending' | 'reviewed' | 'removed';
}

interface PendingReport {
  id: number;
  type: 'item' | 'user' | 'message';
  target_id: number;
  target_name: string;
  reason: string;
  details?: string;
  reported_by: string;
  created_at: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
}

export default function ModerateContentScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [activeTab, setActiveTab] = useState<'flagged' | 'reports'>('flagged');
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    // Fade in header title and arrow
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
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');

      if (activeTab === 'flagged') {
        const response = await fetch(`${API_BASE_URL}/api/admin/flagged-items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setFlaggedItems(data.flagged_items || []);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApproveItem = (itemId: number) => {
    Alert.alert(
      'Approve Item',
      'Are you sure this item is safe and does not violate policies?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            (async () => {
              try {
                const token = await AsyncStorage.getItem('jwtToken');
                const response = await fetch(`${API_BASE_URL}/api/admin/flagged-items/${itemId}/approve`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                  Alert.alert('Success', 'Item approved');
                  await loadData();
                }
              } catch (error) {
                console.error('Failed to approve item:', error);
                Alert.alert('Error', 'Failed to approve item');
              }
            })();
          },
        },
      ]
    );
  };

  const handleRemoveItem = (itemId: number) => {
    Alert.alert(
      'Remove Item',
      'This will permanently remove the item from the platform.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                const token = await AsyncStorage.getItem('jwtToken');
                const response = await fetch(`${API_BASE_URL}/api/admin/flagged-items/${itemId}/remove`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                  Alert.alert('Success', 'Item removed');
                  await loadData();
                }
              } catch (error) {
                console.error('Failed to remove item:', error);
                Alert.alert('Error', 'Failed to remove item');
              }
            })();
          },
        },
      ]
    );
  };

  const handleReportAction = async (reportId: number, action: 'resolve' | 'dismiss') => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        Alert.alert('Success', `Report ${action}d`);
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} report`);
    }
  };

  const getSeverityColor = (severity?: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#FBC02D';
      default: return '#999';
    }
  };

  const getSeverityIcon = (severity?: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      case 'low': return 'information-circle';
      default: return 'flag';
    }
  };

  const renderFlaggedItem = (item: FlaggedItem) => {
    const severityColor = getSeverityColor(item.violation_severity);
    const severityIcon = getSeverityIcon(item.violation_severity);

    return (
      <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
        <View style={styles.cardHeader}>
          {item.item_image && (
            <Image source={{ uri: item.item_image }} style={styles.itemImage} />
          )}
          <View style={styles.cardHeaderText}>
            <View style={styles.itemNameRow}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.item_name}</Text>
              {item.violation_severity && (
                <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                  <Text style={styles.severityText}>{item.violation_severity.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.reason, { color: severityColor }]}>
              <Ionicons name={severityIcon as any} size={14} color={severityColor} /> {item.reason}
            </Text>
            {item.violation_type && (
              <View style={styles.policyReference}>
                <Ionicons name="shield-checkmark" size={12} color="#6A0DAD" />
                <Text style={styles.policyText}>Policy: {item.violation_type}</Text>
              </View>
            )}
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Reported by {item.reported_by}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{new Date(item.reported_at).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveItem(item.item_id)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleRemoveItem(item.item_id)}
          >
            <Ionicons name="trash" size={18} color="#F44336" />
            <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Remove</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => router.push(`/item/${item.item_id}` as any)}
          >
            <Ionicons name="eye" size={18} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getReportReasonDetails = (reason: string) => {
    const reportReason = REPORT_REASONS.find(r => r.value === reason);
    return reportReason || null;
  };

  const renderReport = (report: PendingReport) => {
    const reasonDetails = getReportReasonDetails(report.reason);
    const severityColor = reasonDetails?.severity === 'high' ? '#F44336' : reasonDetails?.severity === 'medium' ? '#FF9800' : '#FBC02D';

    return (
      <View key={report.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <View style={styles.reportTypeRow}>
              <View style={[styles.typeBadge, { backgroundColor: getReportColor(report.type) }]}>
                <Text style={styles.typeBadgeText}>{report.type.toUpperCase()}</Text>
              </View>
              {reasonDetails && (
                <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                  <Text style={styles.severityText}>{reasonDetails.severity.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{report.target_name}</Text>
            <Text style={[styles.reason, { color: severityColor }]}>
              <Ionicons name="warning" size={14} color={severityColor} /> {reasonDetails?.label || report.reason}
            </Text>
            {report.details && <Text style={[styles.details, { color: colors.textSecondary }]}>{report.details}</Text>}
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Reported by {report.reported_by}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{new Date(report.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleReportAction(report.id, 'resolve')}
          >
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Resolve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleReportAction(report.id, 'dismiss')}
          >
            <Ionicons name="close-circle" size={18} color="#F44336" />
            <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'item': return '#FF9800';
      case 'user': return '#2196F3';
      case 'message': return '#9C27B0';
      default: return '#666';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Page Header with Back Arrow */}
        <Animated.View style={[styles.pageHeader, { backgroundColor: colors.surface, opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Moderate Content</Text>
        </Animated.View>

        {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: isDark ? '#333' : '#E0E0E0' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'flagged' && styles.tabActive]}
          onPress={() => setActiveTab('flagged')}
        >
          <Text style={[styles.tabText, { color: isDark ? '#999' : '#666' }, activeTab === 'flagged' && styles.tabTextActive]}>
            Flagged Items ({flaggedItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, { color: isDark ? '#999' : '#666' }, activeTab === 'reports' && styles.tabTextActive]}>
            Reports ({reports.length})
          </Text>
        </TouchableOpacity>
      </View>

        {/* Info Banner */}
        <LinearGradient
          colors={['#6A0DAD', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoBanner}
        >
          <Ionicons name="shield-checkmark" size={24} color="#FFF" />
          <Text style={styles.infoBannerText}>
            Review and moderate {activeTab === 'flagged' ? 'flagged content' : 'user reports'} to ensure platform safety
          </Text>
        </LinearGradient>

        {/* Content */}
        {activeTab === 'flagged' ? (
          flaggedItems.length > 0 ? (
            flaggedItems.map(renderFlaggedItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Flagged Items</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>All clear! No items require moderation.</Text>
            </View>
          )
        ) : (
          reports.length > 0 ? (
            reports.map(renderReport)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Pending Reports</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>All reports have been handled.</Text>
            </View>
          )
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6A0DAD',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#6A0DAD',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 220 : 220,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  cardHeaderText: {
    flex: 1,
  },
  reportTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  policyReference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  policyText: {
    fontSize: 11,
    color: '#6A0DAD',
    fontWeight: '600',
  },
  reason: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#999',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#E8F5E9',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
  },
  viewButton: {
    backgroundColor: '#E3F2FD',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import {
  cleanupExpiredItems,
  getAnalyticsEvents,
  getAnalyticsSummary,
  type CleanupResult,
  type AnalyticsEvent,
  type AnalyticsSummary,
} from '@/api/admin';
import GlobalFooter from "@/app/components/GlobalFooter";

export default function AdminDashboard() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, eventsData] = await Promise.all([
        getAnalyticsSummary(),
        getAnalyticsEvents(),
      ]);

      setSummary(summaryData);
      setRecentEvents(eventsData.slice(0, 10)); // Show only 10 most recent
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCleanup = async () => {
    Alert.alert(
      'Cleanup Expired Items',
      'This will permanently delete all expired auction items and their images. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: async () => {
            try {
              setCleanupLoading(true);
              const result = await cleanupExpiredItems();
              setLastCleanup(result);

              Alert.alert(
                '✅ Cleanup Complete',
                `Deleted ${result.deleted_items} items\n` +
                  `Deleted ${result.deleted_files.length} files\n` +
                  `${result.failed_files.length > 0 ? `Failed: ${result.failed_files.length}` : ''}`
              );

              // Reload dashboard data
              await loadDashboardData();
            } catch (error) {
              console.error('Cleanup failed:', error);
              Alert.alert('Error', 'Failed to cleanup expired items');
            } finally {
              setCleanupLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'missing':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'main_image_deleted':
      case 'extra_image_deleted':
        return 'image-outline';
      case 'cleanup_milestone':
        return 'trophy-outline';
      case 'mascot_reacted':
        return 'happy-outline';
      case 'expired_item_deleted':
        return 'trash-outline';
      default:
        return 'analytics-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#B794F4"  />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Admin Dashboard</Text>
        </View>

      {/* Cleanup Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧹 Maintenance</Text>
        <TouchableOpacity
          style={[styles.cleanupButton, cleanupLoading && styles.cleanupButtonDisabled]}
          onPress={handleCleanup}
          disabled={cleanupLoading}
        >
          {cleanupLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.cleanupButtonText}>Cleanup Expired Items</Text>
            </>
          )}
        </TouchableOpacity>

        {lastCleanup && (
          <View style={styles.lastCleanupCard}>
            <Text style={styles.lastCleanupTitle}>Last Cleanup:</Text>
            <Text style={styles.lastCleanupText}>
              Deleted {lastCleanup.deleted_items} items, {lastCleanup.deleted_files.length} files
            </Text>
            {lastCleanup.failed_files.length > 0 && (
              <Text style={styles.lastCleanupError}>
                ⚠️ {lastCleanup.failed_files.length} files failed
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Analytics Summary */}
      {summary && (
        <>
          {/* Event Counts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Event Statistics</Text>
            <View style={styles.statsGrid}>
              {summary.event_counts.map(([eventType, count]) => (
                <View key={eventType} style={styles.statCard}>
                  <Text style={styles.statCount}>{count}</Text>
                  <Text style={styles.statLabel}>
                    {eventType ? eventType.replace(/_/g, ' ') : 'Unknown'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Status Counts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Status Breakdown</Text>
            <View style={styles.statusList}>
              {summary.status_counts.map(([status, count]) => (
                <View key={status} style={styles.statusItem}>
                  <View
                    style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]}
                  />
                  <Text style={styles.statusLabel}>{status}</Text>
                  <Text style={styles.statusCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Mascot Reactions */}
          {summary.mascot_reactions && summary.mascot_reactions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🐐 Recent Mascot Reactions</Text>
              {summary.mascot_reactions.map((reaction, index) => (
                <View key={index} style={styles.reactionCard}>
                  <Ionicons name="happy-outline" size={24} color="#6A0DAD" />
                  <View style={styles.reactionContent}>
                    <Text style={styles.reactionNotes}>{reaction.notes || 'N/A'}</Text>
                    <Text style={styles.reactionTime}>
                      {reaction.timestamp ? new Date(reaction.timestamp).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Recent Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Recent Events</Text>
        {recentEvents.map((event, index) => (
          <View key={index} style={styles.eventCard}>
            <Ionicons
              name={getEventIcon(event.event_type || 'unknown') as any}
              size={20}
              color={getStatusColor(event.status)}
            />
            <View style={styles.eventContent}>
              <Text style={styles.eventType}>
                {event.event_type ? event.event_type.replace(/_/g, ' ') : 'Unknown Event'}
              </Text>
              <Text style={styles.eventNotes}>{event.notes || 'N/A'}</Text>
              <Text style={styles.eventMeta}>
                {event.user_triggered_by || 'Unknown'} • {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
              </Text>
            </View>
            <View style={[styles.eventStatus, { backgroundColor: getStatusColor(event.status) }]}>
              <Text style={styles.eventStatusText}>{event.status || 'N/A'}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Quick Links</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/admin/moderation')}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#6A0DAD" />
          <Text style={styles.linkButtonText}>Content Moderation</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/seller/revenue')}>
          <Ionicons name="cash-outline" size={20} color="#6A0DAD" />
          <Text style={styles.linkButtonText}>Revenue Analytics</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      </Animated.ScrollView>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  cleanupButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  cleanupButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  cleanupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lastCleanupCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  lastCleanupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  lastCleanupText: {
    fontSize: 14,
    color: '#6b7280',
  },
  lastCleanupError: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    textTransform: 'capitalize',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reactionCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  reactionContent: {
    flex: 1,
  },
  reactionNotes: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  reactionTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  eventCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  eventNotes: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 11,
    color: '#9ca3af',
  },
  eventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
});

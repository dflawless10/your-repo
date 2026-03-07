import { API_BASE_URL } from '@/config';

/**
 * Layer 3: Admin Moderation Review Panel
 * View and manage flagged content
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";

const API_URL = API_BASE_URL;

interface FlaggedItem {
  item_id: number;
  name: string;
  description: string;
  moderation_status: string;
  moderation_score: number;
  moderation_notes: string;
  flagged_terms?: string[];
  created_at: string;
  user_id: number;
}

export default function ModerationPanel() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'rejected'>('flagged');

  useEffect(() => {
    loadFlaggedItems();
  }, [filter]);

  const loadFlaggedItems = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/admin/moderation?status=${filter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlaggedItems(data.items || []);
      } else {
        Alert.alert('Error', 'Failed to load flagged items');
      }
    } catch (error) {
      console.error('Error loading flagged items:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (itemId: number, action: 'approve' | 'reject') => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/admin/moderation/${itemId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', `Item ${action}d successfully`);
        loadFlaggedItems();
      } else {
        Alert.alert('Error', `Failed to ${action} item`);
      }
    } catch (error) {
      console.error(`Error ${action}ing item:`, error);
      Alert.alert('Error', 'Network error');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFlaggedItems();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: '#6B7280',
      approved: '#10B981',
      flagged: '#F59E0B',
      rejected: '#EF4444',
    };

    return (
      <View style={[styles.statusBadge, { backgroundColor: colors[status as keyof typeof colors] || '#6B7280' }]}>
        <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading moderation queue...</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFlaggedItems} />}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Content Moderation</Text>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'flagged' && styles.filterButtonActive]}
          onPress={() => setFilter('flagged')}
        >
          <Text style={[styles.filterButtonText, filter === 'flagged' && styles.filterButtonTextActive]}>
            Flagged
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text style={[styles.filterButtonText, filter === 'rejected' && styles.filterButtonTextActive]}>
            Rejected
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>
      </View>

        {flaggedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>✅ No items to review</Text>
            <Text style={styles.emptyStateSubtext}>All clear!</Text>
          </View>
        ) : (
          flaggedItems.map((item) => (
            <View key={item.item_id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                  {getStatusBadge(item.moderation_status)}
                  <View
                    style={[
                      styles.scoreCircle,
                      { backgroundColor: getScoreColor(item.moderation_score) },
                    ]}
                  >
                    <Text style={styles.scoreText}>{item.moderation_score}</Text>
                  </View>
                </View>
                <Text style={styles.itemId}>ID: {item.item_id}</Text>
              </View>

              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription} numberOfLines={3}>
                {item.description}
              </Text>

              {item.moderation_notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>⚠️ Violations:</Text>
                  <Text style={styles.notesText}>{item.moderation_notes}</Text>
                </View>
              )}

              <View style={styles.metaContainer}>
                <Text style={styles.metaText}>User ID: {item.user_id}</Text>
                <Text style={styles.metaText}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              {item.moderation_status === 'flagged' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleAction(item.item_id, 'approve')}
                  >
                    <Text style={styles.actionButtonText}>✓ Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleAction(item.item_id, 'reject')}
                  >
                    <Text style={styles.actionButtonText}>✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </Animated.ScrollView>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  scoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  itemId: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  notesContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#991B1B',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});

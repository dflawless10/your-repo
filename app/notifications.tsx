import React, { useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from './components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';


interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  is_saved: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = new Animated.Value(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'saved'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.replace('/sign-in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    // Prevent double-tap deletions
    if (deletingIds.has(notificationId)) {
      return;
    }

    try {
      // Mark as deleting
      setDeletingIds(prev => new Set(prev).add(notificationId));

      const token = await AsyncStorage.getItem('jwtToken');
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      // Remove from deleting set after a delay
      setTimeout(() => {
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
      }, 500);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/notifications/delete-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove all read notifications from local state
        setNotifications(prev => prev.filter(n => !n.is_read));
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const toggleSaveNotification = async (notificationId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, is_saved: data.is_saved } : n))
        );
      }
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    try {
      if (!notification) {
        Alert.alert(
          '🐐 Slow down my goat friend!',
          'This notification no longer exists.',
          [{ text: 'Return to Notifications', onPress: () => {} }]
        );
        return;
      }

      // Prevent tapping on notifications being deleted
      if (deletingIds.has(notification.id)) {
        return;
      }

      if (!notification.is_read) {
        markAsRead(notification.id);
      }

      // Navigate based on a notification type
      const data = notification.data || {};
      switch (notification.type) {
        case 'bid_received':
        case 'outbid':
        case 'auction_won':
        case 'auction_ending':
          if (data.item_id) {
            router.push(`/item/${data.item_id}` as any);
          }
          break;
        case 'offer_received':
          router.push('/seller/received-offers' as any);
          break;
        case 'sale_completed':
          router.push('/seller/orders' as any);
          break;
        case 'item_shipped':
          router.push('/orders' as any);
          break;
        case 'delivery_confirmed':
          router.push('/seller/orders' as any);
          break;
        case 'ship_reminder':
        case 'overdue_shipment':
          router.push('/seller/orders' as any);
          break;
        case 'order_cancelled':
          router.push('/orders' as any);
          break;
        case 'return_requested':
        case 'return_approved':
        case 'return_rejected':
          router.push('/orders' as any);
          break;
        case 'review_received':
          if (data.seller_id) {
            router.push(`/seller/${data.seller_id}` as any);
          }
          break;
        case 'relist_available':
          if (data.item_id) {
            router.push(`/item/${data.item_id}` as any);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      Alert.alert(
        '🐐 Slow down my goat friend!',
        'This notification no longer exists.',
        [{ text: 'Return to Notifications', onPress: () => {} }]
      );
    }
  };

  const handleDeleteNotification = (notificationId: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      bid_received: 'hammer',
      outbid: 'alert-circle',
      auction_won: 'trophy',
      auction_ending: 'time',
      offer_received: 'mail',
      sale_completed: 'checkmark-circle',
      item_shipped: 'airplane',
      delivery_confirmed: 'checkmark-done-circle',
      ship_reminder: 'time',
      overdue_shipment: 'warning',
      order_cancelled: 'close-circle',
      return_requested: 'return-up-back',
      return_approved: 'checkmark-circle',
      return_rejected: 'close-circle',
      review_received: 'star',
      relist_available: 'refresh-circle',
      system: 'notifications',
    };
    return iconMap[type] || 'notifications-outline';
  };

  const getNotificationColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      bid_received: '#4CAF50',
      outbid: '#FF6B35',
      auction_won: '#FFD700',
      auction_ending: '#FF9800',
      offer_received: '#2196F3',
      sale_completed: '#4CAF50',
      item_shipped: '#2196F3',
      delivery_confirmed: '#4CAF50',
      ship_reminder: '#FF9800',
      overdue_shipment: '#E53E3E',
      order_cancelled: '#E53E3E',
      return_requested: '#FF9800',
      return_approved: '#4CAF50',
      return_rejected: '#E53E3E',
      review_received: '#FFD700',
      relist_available: '#9C27B0',
      system: '#666',
    };
    return colorMap[type] || '#666';
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={styles.notificationWrapper}>
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' },
          !item.is_read && [styles.unreadCard, { backgroundColor: theme === 'dark' ? '#2C2C3E' : '#F5F3FF' }]
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type) + '20' },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={getNotificationColor(item.type)}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.message, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={[styles.timestamp, { color: theme === 'dark' ? '#666' : '#999' }]}>{formatTimestamp(item.created_at)}</Text>
        </View>

        <View style={styles.notificationActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleSaveNotification(item.id);
            }}
            style={styles.saveButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={item.is_saved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteNotification(item.id);
            }}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

      {/* Page Header with Back Button */}
      <Animated.View style={[styles.pageHeader, {
        backgroundColor: colors.background,
        borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5'
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Notifications</Text>
      </Animated.View>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Filter Toggle */}
        <View style={[styles.filterContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[
              styles.filterButton,
              filter === 'all' && { backgroundColor: theme === 'dark' ? '#3730A3' : '#6A0DAD' }
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'all' ? { color: '#FFF' } : { color: theme === 'dark' ? '#9CA3AF' : '#666' }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('saved')}
            style={[
              styles.filterButton,
              filter === 'saved' && { backgroundColor: theme === 'dark' ? '#3730A3' : '#6A0DAD' }
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'saved' ? { color: '#FFF' } : { color: theme === 'dark' ? '#9CA3AF' : '#666' }
            ]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header Stats */}
        {unreadCount > 0 ? (
          <View style={[styles.statsHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9FAFB' }]}>
            <View style={[styles.unreadBadge, { backgroundColor: theme === 'dark' ? '#3730A3' : '#6A0DAD' }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
            </View>
            <TouchableOpacity
              onPress={markAllAsRead}
              style={[styles.markAllButton, { backgroundColor: theme === 'dark' ? '#3730A3' : '#6A0DAD' }]}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFF" />
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length > 0 && filter === 'all' && (
          <View style={[styles.statsHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9FAFB' }]}>
            <Text style={[styles.allReadText, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]}>
              All caught up! 🎉
            </Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Delete All Notifications',
                  'Are you sure you want to delete all read notifications?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete All',
                      style: 'destructive',
                      onPress: deleteAllNotifications,
                    },
                  ]
                );
              }}
              style={[styles.deleteAllButton, { backgroundColor: '#FF6B35' }]}
            >
              <Ionicons name="trash-outline" size={16} color="#FFF" />
              <Text style={styles.deleteAllButtonText}>Delete All</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={filter === 'saved' ? notifications.filter(n => n.is_saved) : notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6A0DAD"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color={theme === 'dark' ? '#666' : '#CCC'} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme === 'dark' ? '#9CA3AF' : '#666' }]}>
                When you have new activity, you&#39;ll see it here
              </Text>
            </View>
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      </View>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
  position: 'absolute',
  top: HEADER_MAX_HEIGHT,
  left: 0,
  right: 0,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 0,
  zIndex: 10,
},
  backButton: {
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginTop: HEADER_MAX_HEIGHT + 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 0,
    borderBottomColor: '#E0E0E0',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  unreadBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  markAllButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  notificationWrapper: {
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6A0DAD',
    backgroundColor: '#F5F0FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6A0DAD',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  saveButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  allReadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deleteAllButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

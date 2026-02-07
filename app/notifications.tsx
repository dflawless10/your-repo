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
  Platform,
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

  const handleNotificationPress = (notification: Notification) => {
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
      case 'relist_available':
        if (data.item_id) {
          router.push(`/item/${data.item_id}` as any);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      bid_received: 'hammer',
      outbid: 'alert-circle',
      auction_won: 'trophy',
      auction_ending: 'time',
      offer_received: 'mail',
      sale_completed: 'checkmark-circle',
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

      <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#666' : '#CCC'} />
    </TouchableOpacity>
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
        {/* Header Stats */}
        {unreadCount > 0 && (
          <View style={[styles.statsHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F9FAFB' }]}>
            <View style={[styles.unreadBadge, { backgroundColor: theme === 'dark' ? '#3730A3' : '#6A0DAD' }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
            </View>
          </View>
        )}

        <FlatList
          data={notifications}
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
    borderBottomWidth: 1,
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
    marginTop: HEADER_MAX_HEIGHT + 50,
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
    borderBottomWidth: 1,
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
  listContainer: {
    padding: 16,
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

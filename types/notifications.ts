/**
 * Enhanced Notification Type System
 * Categorizes notifications by priority and type for better UX
 */

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationCategory = 'order' | 'bid' | 'message' | 'review' | 'system';

export interface EnhancedNotification {
  id: number;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  action_required?: boolean;
  deadline?: string;
}

export interface NotificationBadgeConfig {
  count: number;
  priority: NotificationPriority;
  color: string;
  showDot: boolean;
  pulse: boolean;
}

/**
 * Notification Type Configuration
 * Maps notification types to their visual properties and behaviors
 */
export const NOTIFICATION_CONFIGS: Record<string, {
  category: NotificationCategory;
  priority: NotificationPriority;
  icon: string;
  color: string;
  actionRequired: boolean;
}> = {
  // Critical Order Notifications
  order_overdue: {
    category: 'order',
    priority: 'critical',
    icon: 'warning',
    color: '#DC2626',
    actionRequired: true,
  },
  order_created: {
    category: 'order',
    priority: 'critical',
    icon: 'rocket',
    color: '#10B981',
    actionRequired: true,
  },
  premium_ship_deadline: {
    category: 'order',
    priority: 'critical',
    icon: 'flash',
    color: '#EA580C',
    actionRequired: true,
  },
  buyer_message: {
    category: 'message',
    priority: 'high',
    icon: 'chatbubble',
    color: '#8B5CF6',
    actionRequired: true,
  },

  // High Priority Notifications
  outbid: {
    category: 'bid',
    priority: 'high',
    icon: 'alert-circle',
    color: '#FF6B35',
    actionRequired: false,
  },
  auction_ending_soon: {
    category: 'bid',
    priority: 'high',
    icon: 'time',
    color: '#F59E0B',
    actionRequired: false,
  },
  offer_received: {
    category: 'bid',
    priority: 'high',
    icon: 'mail',
    color: '#3B82F6',
    actionRequired: true,
  },
  ship_reminder: {
    category: 'order',
    priority: 'high',
    icon: 'cube',
    color: '#EA580C',
    actionRequired: true,
  },

  // Normal Priority Notifications
  bid_received: {
    category: 'bid',
    priority: 'normal',
    icon: 'hammer',
    color: '#10B981',
    actionRequired: false,
  },
  auction_won: {
    category: 'bid',
    priority: 'normal',
    icon: 'trophy',
    color: '#FFD700',
    actionRequired: false,
  },
  sale_completed: {
    category: 'order',
    priority: 'normal',
    icon: 'checkmark-circle',
    color: '#10B981',
    actionRequired: false,
  },
  item_favorited: {
    category: 'system',
    priority: 'normal',
    icon: 'heart',
    color: '#EC4899',
    actionRequired: false,
  },
  price_drop: {
    category: 'bid',
    priority: 'normal',
    icon: 'trending-down',
    color: '#10B981',
    actionRequired: false,
  },
  review_received: {
    category: 'review',
    priority: 'normal',
    icon: 'star',
    color: '#F59E0B',
    actionRequired: false,
  },

  // Low Priority Notifications
  relist_available: {
    category: 'system',
    priority: 'low',
    icon: 'refresh-circle',
    color: '#9C27B0',
    actionRequired: false,
  },
  new_follower: {
    category: 'system',
    priority: 'low',
    icon: 'person-add',
    color: '#6B7280',
    actionRequired: false,
  },
  tips_tricks: {
    category: 'system',
    priority: 'low',
    icon: 'bulb',
    color: '#6B7280',
    actionRequired: false,
  },
  promotional: {
    category: 'system',
    priority: 'low',
    icon: 'gift',
    color: '#8B5CF6',
    actionRequired: false,
  },
};

/**
 * Map legacy notification types to priority/category
 * This handles notifications from backend that don't have priority/category fields yet
 */
export function enrichNotification(notification: any): EnhancedNotification {
  // If notification already has priority and category, return as-is
  if (notification.priority && notification.category) {
    return notification as EnhancedNotification;
  }

  // Otherwise, look up from NOTIFICATION_CONFIGS based on type
  const config = NOTIFICATION_CONFIGS[notification.type];
  if (config) {
    return {
      ...notification,
      category: config.category,
      priority: config.priority,
    };
  }

  // Default fallback for unknown types
  return {
    ...notification,
    category: 'system' as NotificationCategory,
    priority: 'normal' as NotificationPriority,
  };
}

/**
 * Get notification badge configuration based on notifications
 */
export function getNotificationBadgeConfig(
  notifications: any[]
): NotificationBadgeConfig {
  console.log('🐐 [Badge] getNotificationBadgeConfig called with', notifications.length, 'notifications');

  // Enrich notifications with priority/category if missing
  const enrichedNotifications = notifications.map(enrichNotification);
  console.log('🐐 [Badge] Enriched notifications:', JSON.stringify(enrichedNotifications, null, 2));

  const unreadNotifications = enrichedNotifications.filter(n => !n.is_read);
  console.log('🐐 [Badge] Unread notifications count:', unreadNotifications.length);

  const criticalCount = unreadNotifications.filter(n => n.priority === 'critical').length;
  const highCount = unreadNotifications.filter(n => n.priority === 'high').length;
  console.log('🐐 [Badge] Critical count:', criticalCount, 'High count:', highCount);

  // Determine overall priority
  let priority: NotificationPriority = 'low';
  let color = '#9CA3AF'; // Gray
  let pulse = false;

  if (criticalCount > 0) {
    priority = 'critical';
    color = '#DC2626'; // Red
    pulse = true;
  } else if (highCount > 0) {
    priority = 'high';
    color = '#F59E0B'; // Orange
    pulse = false;
  } else if (unreadNotifications.length > 0) {
    priority = 'normal';
    color = '#8B5CF6'; // Purple
    pulse = false;
  }

  const badgeConfig = {
    count: unreadNotifications.length,
    priority,
    color,
    showDot: unreadNotifications.length > 0,
    pulse,
  };

  console.log('🐐 [Badge] Final badge config:', JSON.stringify(badgeConfig, null, 2));

  return badgeConfig;
}

/**
 * Group notifications by category
 */
export function groupNotificationsByCategory(
  notifications: EnhancedNotification[]
): Record<NotificationCategory, EnhancedNotification[]> {
  const grouped: Record<NotificationCategory, EnhancedNotification[]> = {
    order: [],
    bid: [],
    message: [],
    review: [],
    system: [],
  };

  notifications.forEach(notification => {
    const category = notification.category || 'system';
    grouped[category].push(notification);
  });

  return grouped;
}

/**
 * Get category display info
 */
export const CATEGORY_INFO: Record<NotificationCategory, {
  label: string;
  icon: string;
  color: string;
}> = {
  order: {
    label: 'Orders',
    icon: 'cube',
    color: '#EA580C',
  },
  bid: {
    label: 'Bids & Auctions',
    icon: 'hammer',
    color: '#8B5CF6',
  },
  message: {
    label: 'Messages',
    icon: 'chatbubble',
    color: '#3B82F6',
  },
  review: {
    label: 'Reviews',
    icon: 'star',
    color: '#F59E0B',
  },
  system: {
    label: 'System',
    icon: 'notifications',
    color: '#6B7280',
  },
};

/**
 * Format notification time
 */
export function formatNotificationTime(created_at: string): string {
  const now = new Date();
  const createdTime = new Date(created_at);
  const diffMs = now.getTime() - createdTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return createdTime.toLocaleDateString();
}

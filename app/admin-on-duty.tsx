import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, {HEADER_MAX_HEIGHT} from './components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";

interface AdminStats {
  total_users: number;
  active_auctions: number;
  pending_reports: number;
  flagged_items: number;
  total_sales_today: number;
  new_listings_today: number;
}

export default function AdminOnDutyScreen() {
  const router = useRouter();
  const scrollY = new Animated.Value(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    active_auctions: 0,
    pending_reports: 0,
    flagged_items: 0,
    total_sales_today: 0,
    new_listings_today: 0,
  });

  console.log('🐐 AdminOnDutyScreen rendered');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.log('No token found, allowing access for development');
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check if the user is admin
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_admin) {
          setIsAdmin(true);
          loadAdminStats();
        } else {
          console.log('User is not admin, allowing access for development');
          setIsAdmin(true);
        }
      } else {
        console.log('Profile check failed, allowing access for development');
        setIsAdmin(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setLoading(false);
      // For development - allow access
      setIsAdmin(true);
      loadAdminStats();
    }
  };

  const loadAdminStats = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAdminStats();
  };

  const adminActions = [
    {
      title: 'Moderate Content',
      subtitle: 'Review flagged items and reports',
      icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
      color: '#F44336',
      badge: stats.pending_reports + stats.flagged_items,
      onPress: () => router.push('/admin/moderate-content' as any),
    },
    {
      title: 'User Management',
      subtitle: 'View and manage users',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      color: '#2196F3',
      badge: 0,
      onPress: () => router.push('/admin/user-management' as any),
    },
    {
      title: 'Auction Management',
      subtitle: 'Manage active auctions',
      icon: 'hammer' as keyof typeof Ionicons.glyphMap,
      color: '#FF9800',
      badge: 0,
      onPress: () => router.push('/admin/auction-management' as any),
    },
    {
      title: 'Reports & Analytics',
      subtitle: 'View platform analytics',
      icon: 'stats-chart' as keyof typeof Ionicons.glyphMap,
      color: '#4CAF50',
      badge: 0,
      onPress: () => router.push('/admin/reports-analytics' as any),
    },
    {
      title: 'System Maintenance',
      subtitle: 'Database cleanup and system tasks',
      icon: 'construct' as keyof typeof Ionicons.glyphMap,
      color: '#9C27B0',
      badge: 0,
      onPress: () => router.push('/account/cleanup' as any),
    },
    {
      title: 'System Settings',
      subtitle: 'Configure platform settings',
      icon: 'settings' as keyof typeof Ionicons.glyphMap,
      color: '#607D8B',
      badge: 0,
      onPress: () => router.push('/admin/system-settings' as any),
    },
  ];

  console.log('🐐 Rendering admin screen, isAdmin:', isAdmin, 'loading:', loading);



  return (
    <View style={styles.container}>
      <EnhancedHeader scrollY={scrollY} />

      {/* Title with Back Arrow */}
      <View style={styles.headerTitleContainer}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin On Duty</Text>
         <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
      </View>


      <Animated.ScrollView
        style={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
         contentContainerStyle={{
    paddingTop: 240,
    paddingBottom: 40,
  }}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6A0DAD"
          />
        }
      >
        {/* Admin Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="people" size={32} color="#2196F3" />
            <Text style={styles.statValue}>{stats.total_users}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="hammer" size={32} color="#FF9800" />
            <Text style={styles.statValue}>{stats.active_auctions}</Text>
            <Text style={styles.statLabel}>Active Auctions</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="flag" size={32} color="#F44336" />
            <Text style={styles.statValue}>{stats.pending_reports}</Text>
            <Text style={styles.statLabel}>Pending Reports</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="alert-circle" size={32} color="#9C27B0" />
            <Text style={styles.statValue}>{stats.flagged_items}</Text>
            <Text style={styles.statLabel}>Flagged Items</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="cash" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>${stats.total_sales_today}</Text>
            <Text style={styles.statLabel}>Sales Today</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF9C4' }]}>
            <Ionicons name="add-circle" size={32} color="#FBC02D" />
            <Text style={styles.statValue}>{stats.new_listings_today}</Text>
            <Text style={styles.statLabel}>New Listings</Text>
          </View>
        </View>

        {/* Admin Actions */}
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        {adminActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            {action.badge > 0 && (
              <View style={[styles.badge, { backgroundColor: action.color }]}>
                <Text style={styles.badgeText}>{action.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color="#F44336" />
          <Text style={styles.warningText}>
            Admin privileges grant full access to platform data and settings. Use responsibly.
          </Text>
        </View>

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
  titleWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 40,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
 backArrow: {
   marginRight: 16,
    padding: 4,
  },


  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 170 : 170,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});

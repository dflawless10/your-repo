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
  TextInput,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

interface User {
  user_id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  is_admin: boolean;
  is_seller: boolean;
  is_banned: boolean;
  created_at: string;
  total_items: number;
  total_sales: number;
  avatar_url?: string;
}

export default function UserManagementScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'seller' | 'banned'>('all');

  const filterUsers = React.useCallback(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        `${user.firstname} ${user.lastname}`.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'admin':
        filtered = filtered.filter(user => user.is_admin);
        break;
      case 'seller':
        filtered = filtered.filter(user => user.is_seller);
        break;
      case 'banned':
        filtered = filtered.filter(user => user.is_banned);
        break;
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, filterType]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

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

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleBanUser = async (userId: number, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'Unban' : 'Ban';
    Alert.alert(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: currentlyBanned ? 'default' : 'destructive',
          onPress: () => {
            (async () => {
              try {
                const token = await AsyncStorage.getItem('jwtToken');
                const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ ban: !currentlyBanned }),
                });

                if (response.ok) {
                  Alert.alert('Success', `User ${action.toLowerCase()}ned`);
                  await loadUsers();
                }
              } catch (error) {
                console.error('Failed to ban/unban user:', error);
                Alert.alert('Error', `Failed to ${action.toLowerCase()} user`);
              }
            })();
          },
        },
      ]
    );
  };

  const handleToggleAdmin = async (userId: number, currentlyAdmin: boolean) => {
    Alert.alert(
      currentlyAdmin ? 'Remove Admin' : 'Make Admin',
      `Are you sure you want to ${currentlyAdmin ? 'revoke admin rights from' : 'grant admin rights to'} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            (async () => {
              try {
                const token = await AsyncStorage.getItem('jwtToken');
                const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle-admin`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                  Alert.alert('Success', 'Admin status updated');
                  await loadUsers();
                }
              } catch (error) {
                console.error('Failed to toggle admin status:', error);
                Alert.alert('Error', 'Failed to update admin status');
              }
            })();
          },
        },
      ]
    );
  };

  const renderUser = (user: User) => (
    <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
      <View style={styles.userHeader}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }]}>
            <Ionicons name="person" size={24} color={isDark ? '#666' : '#999'} />
          </View>
        )}

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{user.username}</Text>
            {user.is_admin && (
              <View style={[styles.badge, { backgroundColor: '#F44336' }]}>
                <Text style={styles.badgeText}>ADMIN</Text>
              </View>
            )}
            {user.is_seller && (
              <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.badgeText}>SELLER</Text>
              </View>
            )}
            {user.is_banned && (
              <View style={[styles.badge, { backgroundColor: '#000' }]}>
                <Text style={styles.badgeText}>BANNED</Text>
              </View>
            )}
          </View>

          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
          <Text style={[styles.userName, { color: colors.textSecondary }]}>{`${user.firstname} ${user.lastname}`}</Text>

          <View style={styles.userStats}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="cube" size={12} color={isDark ? '#999' : '#666'} style={{ marginRight: 4 }} />
              <Text style={[styles.statText, { color: isDark ? '#999' : '#666' }]}>{`${user.total_items} items`}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="cash" size={12} color={isDark ? '#999' : '#666'} style={{ marginRight: 4 }} />
              <Text style={[styles.statText, { color: isDark ? '#999' : '#666' }]}>{`$${user.total_sales} sales`}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar" size={12} color={isDark ? '#999' : '#666'} style={{ marginRight: 4 }} />
              <Text style={[styles.statText, { color: isDark ? '#999' : '#666' }]}>{new Date(user.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, user.is_banned ? styles.unbanButton : styles.banButton]}
          onPress={() => handleBanUser(user.user_id, user.is_banned)}
        >
          <Ionicons name={user.is_banned ? "checkmark-circle" : "ban"} size={16} color={user.is_banned ? "#4CAF50" : "#F44336"} />
          <Text style={[styles.actionButtonText, { color: user.is_banned ? "#4CAF50" : "#F44336" }]}>
            {user.is_banned ? 'Unban' : 'Ban'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.adminButton]}
          onPress={() => handleToggleAdmin(user.user_id, user.is_admin)}
        >
          <Ionicons name="shield" size={16} color="#2196F3" />
          <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>
            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
          </Text>
        </TouchableOpacity>

        {user.is_seller && (
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => router.push(`/seller/${user.user_id}` as any)}
          >
            <Ionicons name="eye" size={16} color={isDark ? '#999' : '#666'} />
            <Text style={[styles.actionButtonText, { color: isDark ? '#999' : '#666' }]}>View Seller Profile</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );

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
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>User Management</Text>
        </Animated.View>

        {/* Search and Filter */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          <Ionicons name="search" size={20} color={isDark ? '#666' : '#999'} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search users..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'admin', 'seller', 'banned'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type as any)}
            >
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

        {/* Stats Banner */}
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBanner}
        >
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{users.length}</Text>
            <Text style={styles.statsLabel}>Total Users</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{users.filter(u => u.is_seller).length}</Text>
            <Text style={styles.statsLabel}>Sellers</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{users.filter(u => u.is_banned).length}</Text>
            <Text style={styles.statsLabel}>Banned</Text>
          </View>
        </LinearGradient>

        {/* Results */}
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {`${filteredUsers.length} ${filteredUsers.length === 1 ? 'user' : 'users'} found`}
        </Text>

        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => <React.Fragment key={user.user_id}>{renderUser(user)}</React.Fragment>)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={64} color={isDark ? '#444' : '#D1D5DB'} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Users Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Try adjusting your search or filter</Text>
          </View>
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
    color: '#1A202C',
  },
  searchContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6A0DAD',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 290,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  statsLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
    opacity: 0.9,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  banButton: {
    backgroundColor: '#FFEBEE',
  },
  unbanButton: {
    backgroundColor: '#E8F5E9',
  },
  adminButton: {
    backgroundColor: '#E3F2FD',
  },
  viewButton: {
    backgroundColor: '#F5F5F5',
  },
  actionButtonText: {
    fontSize: 12,
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

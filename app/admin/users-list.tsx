import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import GlobalFooter from '../components/GlobalFooter';
import { useTheme } from '@/app/theme/ThemeContext';
import PageHeader from '../components/PageHeader';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  avatar_url?: string;
  is_admin: boolean;
}

export default function UsersListScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = React.useRef(new Animated.Value(1)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Get filter from params ('all', 'today', 'week', 'month')
  const filter = (params.filter as string) || 'all';

  console.log('🐐 [Users List] Screen mounted with filter:', filter);

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
  }, []);

  useEffect(() => {
    console.log('🐐 [Users List] useEffect triggered with filter:', filter);
   void loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers([]); // Clear users before fetching

      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        router.replace('/sign-in');
        return;
      }

      const url = `${API_BASE_URL}/api/admin/users?filter=${filter}`;
      console.log('🐐 [Users List] Fetching:', url);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐐 [Users List] Received users:', data.users?.length || 0);
        // Filter out any invalid user objects
        const validUsers = (data.users || []).filter((user: any) => user?.id && user.username);
        console.log('🐐 [Users List] Valid users after filter:', validUsers.length);
        setUsers(validUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const count = users?.length ?? 0;
    if (filter === 'today') return `New Today (${count})`;
    if (filter === 'week') return `New This Week (${count})`;
    if (filter === 'month') return `New This Month (${count})`;
    return `All Users (${count})`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderUser = ({ item }: { item: User }) => {
    if (!item) return null;

    const username = item.username ? String(item.username) : 'Unknown';
    const usernameText = '@' + username;
    const joinText = item.created_at ? 'Joined ' + formatDate(item.created_at) : 'Join date unknown';
    const showAdminBadge = Boolean(item.is_admin);

    return (
      <TouchableOpacity
        style={[styles.userCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/seller/${item.id}` as any)}
      >
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={[styles.username, { color: isDark ? '#B794F4' : '#6A0DAD' }]}>{usernameText}</Text>
            {showAdminBadge ? (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.joinDate, { color: colors.textSecondary }]}>{joinText}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#999'} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <EnhancedHeader scrollY={scrollY} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#B794F4' : '#6A0DAD'} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <Animated.View style={[styles.pageHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }], backgroundColor: colors.background, borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5' }]}>
        <PageHeader title={getTitle()} opacity={headerOpacity} scale={headerScale} />

        <FlatList
          key={filter}
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => String(item?.id || Math.random())}
          contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, backgroundColor: colors.background }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
            </View>
          }
          onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        />
      </Animated.View>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    marginTop: HEADER_MAX_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: HEADER_MAX_HEIGHT,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 45,
    paddingBottom: 4,

  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A0DAD',
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  joinDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

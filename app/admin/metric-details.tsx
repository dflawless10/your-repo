import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';
import { useTheme } from '@/app/theme/ThemeContext';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

interface Item {
  id: number;
  title: string;
  current_price: number;
  image_url?: string;
  status?: string;
}

export default function MetricDetailsScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    loadDetails();
  }, [type]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/metric-details?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.users) setUsers(data.users);
        if (data.items) setItems(data.items);
      }
    } catch (error) {
      console.error('Error loading metric details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserTap = (userId: number) => {
    router.push(`/seller/${userId}`);
  };

  const handleItemTap = (itemId: number) => {
    router.push(`/item/${itemId}`);
  };

  const getTitle = () => {
    const titles: { [key: string]: string } = {
      total_users: 'All Users',
      new_today: 'New Users Today',
      new_this_week: 'New Users This Week',
      new_this_month: 'New Users This Month',
      total_items: 'All Items',
      sold_items: 'Sold Items',
      total_commission: 'Total Commission',
      commission_today: "Today's Commission",
      commission_this_week: "This Week's Commission",
      commission_this_month: "This Month's Commission",
      payment_processing_fees: 'Payment Processing Fees',
      premium_subscriptions: 'Premium Subscriptions',
      featured_listing_fees: 'Featured Listing Fees',
      total_profit: 'Total Profit',
    };
    return titles[type as string] || 'Details';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={isDark ? '#B794F4' : '#6A0DAD'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{getTitle()}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#B794F4' : '#6A0DAD'} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* User List */}
          {users.length > 0 && (
            <View>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {users.length} {users.length === 1 ? 'user' : 'users'}
              </Text>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userCard, { backgroundColor: colors.surface }]}
                  onPress={() => handleUserTap(user.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userContent}>
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#4A5568' : '#E2E8F0' }]}>
                        <Ionicons name="person" size={24} color={isDark ? '#A0AEC0' : '#718096'} />
                      </View>
                    )}
                    <View style={styles.userInfo}>
                      <Text style={[styles.username, { color: colors.textPrimary }]}>@{user.username}</Text>
                      <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
                      {user.created_at && (
                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Item List */}
          {items.length > 0 && (
            <View>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, { backgroundColor: colors.surface }]}
                  onPress={() => handleItemTap(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImagePlaceholder, { backgroundColor: isDark ? '#4A5568' : '#E2E8F0' }]}>
                        <Ionicons name="image" size={24} color={isDark ? '#A0AEC0' : '#718096'} />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={[styles.itemPrice, { color: isDark ? '#48BB78' : '#38A169' }]}>
                        ${item.current_price.toFixed(2)}
                      </Text>
                      {item.status && (
                        <Text style={[styles.itemStatus, { color: colors.textSecondary }]}>
                          Status: {item.status}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty State */}
          {users.length === 0 && items.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="information-circle-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data available</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 120,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingTop: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  userCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
  },
  itemCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

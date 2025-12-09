import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export default function MenuScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSeller, setIsSeller] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reload user info when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [])
  );

  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      const jwtToken = await AsyncStorage.getItem('jwtToken');

      // If token is missing or expired, show guest state
      if (!jwtToken || isTokenExpired(jwtToken)) {
        setIsAuthenticated(false);
        setUserEmail('Guest');
        setIsSeller(false);
        setIsLoading(false);
        return;
      }

      const email = await AsyncStorage.getItem('userEmail');
      const sellerStatus = await AsyncStorage.getItem('isSeller');
      setUserEmail(email || 'Unknown User');
      setIsSeller(sellerStatus === 'true');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading user info:', error);
      setIsAuthenticated(false);
      setUserEmail('Guest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'authToken',
                'jwtToken',
                'userEmail',
                'isSeller',
                'userId',
                'username',
                'pushToken'
              ]);
              setIsAuthenticated(false);
              setUserEmail('Guest');
              router.replace('/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const MenuItem = ({
    icon,
    label,
    route,
    color = '#444',
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route: string;
    color?: string;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => router.push(route as any)}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#444" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <Ionicons
            name={isAuthenticated ? "person-circle" : "person-circle-outline"}
            size={60}
            color={isAuthenticated ? "#FF6B35" : "#9ca3af"}
          />
          <Text style={styles.userEmail}>{userEmail}</Text>
          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/sign-in')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop</Text>
          <MenuItem icon="search" label="Discover Items" route="/discover" />
          <MenuItem icon="heart" label="Watchlist" route="/watchlist" />
          <MenuItem icon="gift" label="Gift Finder" route="/GiftFinder" />
          <MenuItem icon="cart" label="Shopping Cart" route="/cart" />
        </View>

        {/* Buying */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buying</Text>
          <MenuItem icon="receipt" label="My Orders" route="/orders" />
          <MenuItem icon="time" label="Active Bids" route="/bids" />
        </View>

        {/* Selling */}
        {isSeller && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selling</Text>
            <MenuItem icon="analytics" label="Seller Dashboard" route="/seller/dashboard" />
            <MenuItem icon="cube" label="My Orders" route="/seller/orders" color="#FF6B35" />
            <MenuItem icon="cash" label="Revenue" route="/seller/revenue" color="#FF6B35" />
            <MenuItem icon="add-circle" label="List New Item" route="/list-item" />
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem icon="person" label="Profile" route="/profile" />
          <MenuItem icon="settings" label="Settings" route="/settings" />
          {!isSeller && (
            <MenuItem icon="storefront" label="Become a Seller" route="/seller/register" />
          )}
        </View>

        {/* Logout - only show if authenticated */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#dc2626" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>BidGoat v1.0</Text>
          <Text style={styles.footerText}>Made with ❤️ for collectors</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
  },
  userSection: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  userEmail: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '600',
    marginTop: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginVertical: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  signInButton: {
    marginTop: 12,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

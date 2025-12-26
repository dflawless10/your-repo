import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import EnhancedHeader from '../components/EnhancedHeader';
import AnalyticsScreen from './analytics';
import { ListedItem } from '@/types/items';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

/**
 * Wrapper component for the Analytics screen that:
 * 1. Adds the EnhancedHeader
 * 2. Fetches seller's items and analytics data
 * 3. Passes data to the AnalyticsScreen component
 */
export default function AnalyticsWrapper() {
  const scrollY = new Animated.Value(0);
  const [items, setItems] = useState<ListedItem[]>([]);
  const [searchStats, setSearchStats] = useState({
    topSearches: [],
    zeroResultFilters: [],
  });
  const [categoryStats, setCategoryStats] = useState({
    bestCategory: 'None',
    weakestCategory: 'None',
  });
  const [timingStats, setTimingStats] = useState({
    sellsFastestOn: 'Unknown',
    lowTrafficHours: [],
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      // Fetch seller's items
      const itemsResponse = await fetch(`${API_BASE_URL}/api/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData.items || []);
      }

      // Fetch analytics stats (if backend endpoint exists)
      try {
        const statsResponse = await fetch(`${API_BASE_URL}/api/seller/analytics/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          if (stats.searchStats) setSearchStats(stats.searchStats);
          if (stats.categoryStats) setCategoryStats(stats.categoryStats);
          if (stats.timingStats) setTimingStats(stats.timingStats);
        }
      } catch (e) {
        console.log('Analytics stats endpoint not available yet');
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <EnhancedHeader scrollY={scrollY} />
      <View style={styles.content}>
        <AnalyticsScreen
          items={items}
          searchStats={searchStats}
          categoryStats={categoryStats}
          timingStats={timingStats}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 110 : 110,
  },
});

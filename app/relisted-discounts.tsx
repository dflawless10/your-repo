import { API_BASE_URL } from '@/config';

import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import RelistedDiscountsScreen from "app/components/RelistedDiscountsScreen";
import { ListedItem } from "@/types/items";
import { useTheme } from '@/app/theme/ThemeContext';
import { useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '@/hooks/reduxHooks';

export default function RelistedDiscountsPage() {
  const { theme, colors } = useTheme();
  const { search } = useLocalSearchParams<{ search?: string }>();
  const styles = createStyles(theme === 'dark', colors);
  const [items, setItems] = useState<ListedItem[]>([]);
  const cartItemsRedux = useAppSelector((state) => state.cart.items);
  const cartItemIds = useMemo(() => new Set(cartItemsRedux.map(i => String(i.id))), [cartItemsRedux]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shop/relisted-discounts`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        // Apply search filter if search param exists
        let filteredItems = data.items || [];
        if (search) {
          const searchLower = search.toLowerCase();
          const searchResults = filteredItems.filter((item: any) =>
            item.name?.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower) ||
            item.tags?.toLowerCase().includes(searchLower)
          );
          // If search results exist, use them; otherwise show all price dropped items
          if (searchResults.length > 0) {
            filteredItems = searchResults;
          }
        }

        setItems(filteredItems);
      } catch (err: any) {
        setError(err.message || "Failed to load relisted discounts");
      } finally {
        setLoading(false);
      }
    };

   void fetchItems();
  }, [search]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading Relisted Discounts…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return <RelistedDiscountsScreen items={items.filter(item => !cartItemIds.has(String((item as any).id ?? (item as any).item_id)))} />;
}

const createStyles = (isDark: boolean, colors: any) => StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 16,
    color: "#E53935",
    fontWeight: "bold",
  },
});

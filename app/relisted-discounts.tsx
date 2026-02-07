import { API_BASE_URL } from '@/config';

import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import RelistedDiscountsScreen from "app/components/RelistedDiscountsScreen";
import { ListedItem } from "@/types/items";
import { useTheme } from '@/app/theme/ThemeContext';

export default function RelistedDiscountsPage() {
  const { theme, colors } = useTheme();
  const styles = createStyles(theme === 'dark', colors);
  const [items, setItems] = useState<ListedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("http://10.0.0.170:5000/api/shop/relisted-discounts");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message || "Failed to load relisted discounts");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

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

  return <RelistedDiscountsScreen items={items} />;
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

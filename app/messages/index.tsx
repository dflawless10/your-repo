import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/hooks/AuthContext";
import { API_BASE_URL } from "@/config";
import { useTheme } from "@/app/theme/ThemeContext";

type Conversation = {
  id: number;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MessagesInboxScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const fetchConversations = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      setConversations(resData.conversations ?? []);
    } catch {
      setError(true);
    }
  }, [token]);

  useEffect(() => {
    void fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  useFocusEffect(
    useCallback(() => {
      void fetchConversations();
    }, [fetchConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.textTertiary }]}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Messages</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Could not load messages. Pull down to retry.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6A0DAD"
            />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You have no conversations yet.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/messages/${item.id}`)}
              style={[styles.row, { borderBottomColor: colors.textTertiary }]}
            >
              <View style={styles.rowMain}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>
                  {item.otherUserName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.preview, { color: colors.textSecondary }]}
                >
                  {item.lastMessage || "No messages yet"}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.time, { color: colors.textTertiary }]}>
                  {formatRelativeTime(item.lastMessageAt)}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  heading: { fontSize: 22, fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyText: { textAlign: "center", marginTop: 48, fontSize: 15 },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  rowMain: { flex: 1, marginRight: 12 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  name: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  preview: { fontSize: 14 },
  time: { fontSize: 12 },
  badge: {
    backgroundColor: "#6A0DAD",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});

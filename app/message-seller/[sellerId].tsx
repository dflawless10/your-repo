import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet,
  KeyboardAvoidingView, Platform, Animated,
  useWindowDimensions,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/AuthContext";
import { useTheme } from "@/app/theme/ThemeContext";
import { checkMessageForContactInfo, MAX_MESSAGE_LENGTH } from "@/lib/messageModeration";
import { API_BASE_URL } from "@/config";
import EnhancedHeader, { HEADER_MAX_HEIGHT } from "@/app/components/EnhancedHeader";
import GlobalFooter from "@/app/components/GlobalFooter";

export default function MessageSellerScreen() {
  const { sellerId, itemId, sellerName } = useLocalSearchParams<{
    sellerId: string;
    itemId?: string;
    sellerName?: string;
  }>();
  const router = useRouter();
  const { token } = useAuth();
  const { colors, theme } = useTheme();
  const { width } = useWindowDimensions();

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();

    if (!trimmed) {
      Alert.alert("Message Required", "Please enter a message before sending.");
      return;
    }

    const moderationError = checkMessageForContactInfo(trimmed);
    if (moderationError) {
      Alert.alert("Not Allowed", moderationError);
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: Number(sellerId),
          itemId: itemId ? Number(itemId) : null,
          message: trimmed,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        Alert.alert("Error", errData.error || "Unable to send message. Please try again.");
        return;
      }
      Alert.alert("Message Sent", "Your message has been sent to the seller.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Unable to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const overLimit = charCount > MAX_MESSAGE_LENGTH;
  const isLandscape = width > 600;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Animated.ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_MAX_HEIGHT + 10 },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title row with back arrow */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={26}
                color={theme === "dark" ? "#B794F4" : "#6A0DAD"}
              />
            </TouchableOpacity>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {sellerName ? `Message ${decodeURIComponent(sellerName)}` : "Message Seller"}
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, maxWidth: isLandscape ? 600 : undefined, alignSelf: isLandscape ? "center" : undefined, width: isLandscape ? "100%" : undefined }]}>
            {itemId && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                About item #{itemId}
              </Text>
            )}

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Your message
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message (no phone, email, or external contact info)…"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={MAX_MESSAGE_LENGTH + 50}
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  borderColor: overLimit ? "#EF4444" : colors.textTertiary,
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                },
              ]}
            />

            <Text
              style={[
                styles.charCount,
                { color: overLimit ? "#EF4444" : colors.textTertiary },
              ]}
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </Text>

            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || overLimit || !message.trim()}
              style={[
                styles.button,
                {
                  backgroundColor:
                    sending || overLimit || !message.trim() ? "#9CA3AF" : "#6A0DAD",
                },
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: "700", flex: 1 },
  formCard: {
    borderRadius: 12,
    padding: 16,
  },
  subtitle: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 140,
    marginBottom: 4,
    fontSize: 15,
  },
  charCount: { fontSize: 12, textAlign: "right", marginBottom: 16 },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

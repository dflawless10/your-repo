import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, ScrollView, Modal, Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/hooks/AuthContext";
import { API_BASE_URL } from "@/config";
import { useTheme } from "@/app/theme/ThemeContext";
import { checkMessageForContactInfo, MAX_MESSAGE_LENGTH } from "@/lib/messageModeration";

type Message = {
  id: number;
  body: string;
  sentAt: string;
  isMine: boolean;
  isRead: boolean;
  imageUrl?: string | null;
};

type ItemData = {
  id: number;
  name: string;
  price: number;
  photoUrl?: string | null;
};

type ConversationData = {
  id: number;
  otherUserName: string;
  responseTime?: string | null;
  item?: ItemData | null;
  messages: Message[];
};

const QUICK_REPLIES = [
  "Is this still available?",
  "What's your best price?",
  "Can you bundle?",
  "Can I see more photos?",
  "Is this authentic?",
  "How fast can you ship?",
];

function getSuggestions(lastMsg: string): string[] {
  const lower = lastMsg.toLowerCase();
  const out: string[] = [];
  if (/authentic|genuine|certificate|cert/.test(lower))
    out.push("Yes, I have the certificate of authenticity.");
  if (/still available|available/.test(lower))
    out.push("Yes, it's still available!");
  if (/price|lower|discount|deal|offer|negotiate/.test(lower))
    out.push("I can bundle items for a better price.");
  if (/ship|shipping|delivery/.test(lower))
    out.push("I can ship within 2-3 business days.");
  if (/photo|picture|pic|more photo/.test(lower))
    out.push("Sure! I can send more photos.");
  if (/return|refund|policy/.test(lower))
    out.push("I accept returns within 7 days of delivery.");
  return out.slice(0, 2);
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);

  const [data, setData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSending, setOfferSending] = useState(false);

  useEffect(() => {
    void fetchConversation();
  }, [conversationId]);

  async function fetchConversation() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      setData(resData.conversation);
    } catch {
      Alert.alert("Error", "Could not load this conversation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const trimmed = reply.trim();
    if (!trimmed) return;

    const moderationError = checkMessageForContactInfo(trimmed);
    if (moderationError) {
      Alert.alert("Not Allowed", moderationError);
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });
      const resData = await res.json();
      const newMsg: Message = resData.message;
      setData((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
      );
      setReply("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert("Error", "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow photo access to send images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("image", {
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: asset.fileName ?? "photo.jpg",
    } as any);

    try {
      setUploadingImage(true);
      const res = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const resData = await res.json();
      if (!res.ok) {
        Alert.alert("Error", resData.error || "Failed to send image.");
        return;
      }
      const newMsg: Message = resData.message;
      setData((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
      );
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert("Error", "Failed to send image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleMakeOffer() {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid offer amount.");
      return;
    }
    if (!data?.item) return;

    try {
      setOfferSending(true);
      const res = await fetch(`${API_BASE_URL}/api/offers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: data.item.id,
          offer_amount: amount,
          message: "",
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        Alert.alert("Offer Failed", resData.error || "Could not submit offer.");
        return;
      }
      setOfferModalVisible(false);
      setOfferAmount("");
      Alert.alert("Offer Sent", `Your offer of $${amount.toFixed(2)} has been submitted.`);
    } catch {
      Alert.alert("Error", "Failed to send offer. Please try again.");
    } finally {
      setOfferSending(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete Conversation",
      "This will remove the conversation from your inbox. The other person will not be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              router.back();
            } catch {
              Alert.alert("Error", "Could not delete conversation.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const lastReadMineId = useMemo(() => {
    if (!data) return -1;
    const msgs = data.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].isMine && msgs[i].isRead) return msgs[i].id;
    }
    return -1;
  }, [data?.messages]);

  const suggestions = useMemo(() => {
    if (!data?.messages.length) return [];
    const last = data.messages[data.messages.length - 1];
    if (last.isMine) return [];
    return getSuggestions(last.body);
  }, [data?.messages]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  const overLimit = reply.length > MAX_MESSAGE_LENGTH;
  const isSendingAny = sending || uploadingImage;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Title bar */}
      <View style={[styles.titleBar, { borderBottomColor: colors.textTertiary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.titleBack}>
          <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
        </TouchableOpacity>
        <View style={styles.titleCenter}>
          <Text style={[styles.titleText, { color: colors.textPrimary }]} numberOfLines={1}>
            {data?.otherUserName ?? "Conversation"}
          </Text>
          {data?.responseTime && (
            <View style={styles.responseTimeBadge}>
              <Ionicons name="time-outline" size={11} color="#6A0DAD" />
              <Text style={styles.responseTimeText}>Usually replies {data.responseTime}</Text>
            </View>
          )}
        </View>
        {data?.item && (
          <TouchableOpacity
            onPress={() => setOfferModalVisible(true)}
            style={styles.offerButton}
          >
            <Text style={styles.offerButtonText}>Offer</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDelete} disabled={deleting} style={styles.titleDelete}>
          {deleting
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <Ionicons name="trash-outline" size={22} color="#EF4444" />
          }
        </TouchableOpacity>
      </View>

      {/* Item card */}
      {data?.item && (
        <TouchableOpacity
          style={[styles.itemCard, { backgroundColor: colors.surface, borderBottomColor: colors.textTertiary }]}
          onPress={() => router.push(`/item/${data.item!.id}` as any)}
        >
          {data.item.photoUrl && (
            <Image
              source={{ uri: `${API_BASE_URL}${data.item.photoUrl}` }}
              style={styles.itemCardImage}
            />
          )}
          <View style={styles.itemCardInfo}>
            <Text style={[styles.itemCardName, { color: colors.textPrimary }]} numberOfLines={1}>
              {data.item.name}
            </Text>
            <Text style={styles.itemCardPrice}>
              ${typeof data.item.price === "number" ? data.item.price.toFixed(2) : data.item.price}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      )}

      <FlatList
        ref={listRef}
        data={data?.messages ?? []}
        keyExtractor={(m) => m.id.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No messages yet. Say hello!
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.isMine ? styles.bubbleMine : styles.bubbleTheirs,
              { backgroundColor: item.isMine ? "#6A0DAD" : colors.surface },
            ]}
          >
            {item.imageUrl ? (
              <Image
                source={{ uri: `${API_BASE_URL}${item.imageUrl}` }}
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.bubbleText, { color: item.isMine ? "#fff" : colors.textPrimary }]}>
                {item.body}
              </Text>
            )}
            <Text
              style={[
                styles.bubbleTime,
                { color: item.isMine ? "rgba(255,255,255,0.6)" : colors.textTertiary },
              ]}
            >
              {new Date(item.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            {item.isMine && item.id === lastReadMineId && (
              <Text style={styles.seenText}>Seen</Text>
            )}
          </View>
        )}
      />

      {/* AI-suggested replies */}
      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.chipsRow, { borderTopColor: colors.textTertiary }]}
          contentContainerStyle={styles.chipsContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.suggestLabel, { color: colors.textTertiary }]}>💡</Text>
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.suggestionChip, { borderColor: "#6A0DAD", backgroundColor: colors.surface }]}
              onPress={() => setReply(s)}
            >
              <Text style={[styles.chipText, { color: "#6A0DAD" }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Quick reply templates */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.chipsRow, { borderTopColor: colors.textTertiary }]}
        contentContainerStyle={styles.chipsContent}
        keyboardShouldPersistTaps="handled"
      >
        {QUICK_REPLIES.map((qr) => (
          <TouchableOpacity
            key={qr}
            style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.textTertiary }]}
            onPress={() => setReply(qr)}
          >
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>{qr}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input row */}
      <View style={[styles.inputRow, { borderTopColor: colors.textTertiary, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={isSendingAny}
          style={styles.cameraButton}
        >
          {uploadingImage
            ? <ActivityIndicator size="small" color="#6A0DAD" />
            : <Ionicons name="camera-outline" size={24} color={isSendingAny ? "#9CA3AF" : "#6A0DAD"} />
          }
        </TouchableOpacity>
        <TextInput
          value={reply}
          onChangeText={setReply}
          placeholder="Reply…"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={MAX_MESSAGE_LENGTH + 50}
          textAlignVertical="top"
          style={[
            styles.replyInput,
            {
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderColor: overLimit ? "#EF4444" : colors.textTertiary,
            },
          ]}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !reply.trim() || overLimit}
          style={[
            styles.sendButton,
            { backgroundColor: sending || !reply.trim() || overLimit ? "#9CA3AF" : "#6A0DAD" },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Make Offer Modal */}
      <Modal
        visible={offerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Make an Offer</Text>
            {data?.item && (
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {data.item.name}
              </Text>
            )}
            <TextInput
              value={offerAmount}
              onChangeText={setOfferAmount}
              placeholder="Your offer (e.g. 25.00)"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              style={[
                styles.offerInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderColor: colors.textTertiary,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.textTertiary }]}
                onPress={() => { setOfferModalVisible(false); setOfferAmount(""); }}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: offerSending || !offerAmount.trim() ? "#9CA3AF" : "#6A0DAD" },
                ]}
                onPress={handleMakeOffer}
                disabled={offerSending || !offerAmount.trim()}
              >
                {offerSending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSubmitText}>Send Offer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  titleBack: { padding: 4 },
  titleCenter: { flex: 1 },
  titleText: { fontSize: 17, fontWeight: "700" },
  responseTimeBadge: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  responseTimeText: { fontSize: 11, color: "#6A0DAD" },
  offerButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#6A0DAD",
  },
  offerButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  titleDelete: { padding: 4 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  itemCardImage: { width: 44, height: 44, borderRadius: 6 },
  itemCardInfo: { flex: 1 },
  itemCardName: { fontSize: 13, fontWeight: "600" },
  itemCardPrice: { fontSize: 12, color: "#6A0DAD", marginTop: 2 },
  messageList: { padding: 16, paddingBottom: 8 },
  emptyText: { textAlign: "center", marginTop: 32 },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  bubbleMine: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: "right" },
  bubbleImage: { width: 200, height: 200, borderRadius: 10 },
  seenText: { fontSize: 10, color: "rgba(255,255,255,0.6)", textAlign: "right", marginTop: 2 },
  chipsRow: { maxHeight: 44, borderTopWidth: StyleSheet.hairlineWidth },
  chipsContent: { paddingHorizontal: 10, paddingVertical: 6, gap: 6, alignItems: "center" },
  suggestLabel: { fontSize: 14, marginRight: 2 },
  suggestionChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  quickChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12 },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "flex-end",
    gap: 8,
  },
  cameraButton: { padding: 6, alignSelf: "flex-end" },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: { width: "100%", maxWidth: 360, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, marginBottom: 16 },
  offerInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600" },
  modalSubmitBtn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  modalSubmitText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

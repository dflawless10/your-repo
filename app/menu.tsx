import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useFocusEffect } from 'expo-router';
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import { playGoatSoundByName } from "@/assets/sounds/officialGoatSoundsSoundtrack";

const DISMISS_KEY = "dismiss:get-app-card:until";
const FIRST_SEEN_KEY = "goat:feedback:firstSeenAt";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default function FloatingGetAppCard() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const hasBaaedRef = useRef(false);

  // ✅ timer ref type that matches RN/browser/Node correctly
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blocked = useMemo(() => {
    const blocks = ["/sign-in", "/login", "/register", "/checkout", "/buy"];
    return blocks.some((p) => pathname?.startsWith(p));
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (blocked) {
        if (mounted) setVisible(false);
        return;
      }

      // Ensure we have a "first seen" timestamp
      const existing = await AsyncStorage.getItem(FIRST_SEEN_KEY);
      const firstSeenAt = existing ? Number(existing) : Date.now();

      if (!existing) {
        await AsyncStorage.setItem(FIRST_SEEN_KEY, String(firstSeenAt));
      }

      // Respect dismissal
      const until = await AsyncStorage.getItem(DISMISS_KEY);
      const untilMs = until ? Number(until) : 0;
      const dismissed = untilMs && Date.now() <= untilMs;

      if (dismissed) {
        if (mounted) setVisible(false);
        return;
      }

      // Wait until 5 minutes have elapsed since firstSeenAt
      const elapsed = Date.now() - firstSeenAt;
      const remaining = Math.max(0, FIVE_MINUTES_MS - elapsed);

      const showNow = () => {
        if (!mounted) return;

        setVisible(true);
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();

        // Goat sound, once per app session
        if (!hasBaaedRef.current) {
          hasBaaedRef.current = true;
          void playGoatSoundByName("Victory Baa");
        }
      };

      if (remaining === 0) {
        showNow();
      } else {
        refreshTimerRef.current = setTimeout(showNow, remaining);
      }
    })();

    return () => {
      mounted = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    };
  }, [blocked, fade]);

  const dismiss = async () => {
    await AsyncStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
  };


  if (!visible) return null;

  return (
    <>
      {/* <Animated.View style={{ opacity: fade, position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, }}>
        <View style={{ backgroundColor: "white", borderRadius: 8, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4 }}>Download the app!</Text>
            <Text style={{ color: "gray", fontSize: 14 }}>Get a better experience with our app!</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={shareBuildLink} style={{ marginRight: 8 }}>
              <Ionicons name="share-outline" size={24} color="#444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={dismiss} style={{ padding: 8, backgroundColor: "#FF6B35", borderRadius: 8 }}>
              <Text style={{ color: "white", fontWeight: "600" }}>Get app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View> */}
    </>
  );
}

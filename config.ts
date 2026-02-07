import { Platform } from "react-native";
import Constants from "expo-constants";

const getDefaultApiUrl = () => {
  // In production builds, use the production domain
  if (!__DEV__) {
    return "https://api.bidgoat.com";
  }

  // In development, use local network IP for physical devices
  if (Platform.OS === "android") return "http://10.0.2.2:5000"; // Android emulator
  if (Platform.OS === "ios" || Platform.OS === "android") return "http://10.0.0.170:5000"; // Physical device
  return "http://localhost:5000"; // Web or fallback
};

export const API_BASE_URL =
  Constants.expoConfig?.extra?.API_URL ?? getDefaultApiUrl();

export const API_URL = API_BASE_URL; // Alias for backwards compatibility

export const EXPO_DEV_SERVER =
  Constants.expoConfig?.extra?.EXPO_DEV_SERVER ?? "http://localhost:8081";

import { Platform } from "react-native";
import Constants from "expo-constants";

const getDefaultApiUrl = () => {
  // In production builds, use the production domain
  if (!__DEV__) {
    return "http://74.208.72.226";
  }

  // In development, use your dev machine's local IP
  // Change this to match your computer's IP on your local network
  if (Platform.OS === "android") return "http://10.0.0.171:5000"; // Android physical device - UPDATE THIS IP
  if (Platform.OS === "ios") return "http://10.0.0.171:5000"; // iOS physical device - UPDATE THIS IP
  return "http://localhost:5000"; // Web or fallback
};

export const API_BASE_URL =
  Constants.expoConfig?.extra?.API_URL ?? getDefaultApiUrl();

export const API_URL = API_BASE_URL; // Alias for backwards compatibility

export const EXPO_DEV_SERVER =
  Constants.expoConfig?.extra?.EXPO_DEV_SERVER ?? "http://localhost:8081";

import { Platform } from "react-native";
import Constants from "expo-constants";

const getDefaultApiUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:5000"; // Android emulator
  return "http://localhost:5000"; // iOS simulator, Web, or fallback
};


export const API_BASE_URL =
  Constants.expoConfig?.extra?.API_URL ?? getDefaultApiUrl();

export const EXPO_DEV_SERVER =
  Constants.expoConfig?.extra?.EXPO_DEV_SERVER ?? "http://localhost:8081";

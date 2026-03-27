import { Platform } from "react-native";
import Constants from "expo-constants";

const getDefaultApiUrl = () => {
  // Always use VPS backend
  return "https://bidgoat.com";
};

export const API_BASE_URL =
  Constants.expoConfig?.extra?.API_URL ?? getDefaultApiUrl();

export const API_URL = API_BASE_URL; // Alias for backwards compatibility

export const EXPO_DEV_SERVER =
  Constants.expoConfig?.extra?.EXPO_DEV_SERVER ?? "http://localhost:8081";
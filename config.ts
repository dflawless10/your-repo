import Constants from "expo-constants";

const getDefaultApiUrl = () => {
  // Always use VPS backend (HTTP — HTTPS not configured on server)
  return "http://74.208.72.226:5000";
};

export const API_BASE_URL =
  Constants.expoConfig?.extra?.API_URL ?? getDefaultApiUrl();

export const API_URL = API_BASE_URL; // Alias for backwards compatibility

export const EXPO_DEV_SERVER =
  Constants.expoConfig?.extra?.EXPO_DEV_SERVER ?? "http://localhost:8081";

export const STRIPE_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY ??
  'pk_test_51T1znoE1LSFdvhJ6h4rjtQjXh5Su1zo1KWxAA5n7OLlFUVf32zq0SZEwOWp2CV4MUBOiLGq1eyhOUUmF9hd04Fl400DLUZ5oJc';
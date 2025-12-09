import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/config';

/**
 * Centralized fetch wrapper that automatically handles:
 * - 401 errors (token expiration)
 * - JWT token injection
 * - Automatic logout and redirect on auth failure
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const jwtToken = await AsyncStorage.getItem('jwtToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Auto-inject JWT if available and not already present
  if (jwtToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration globally
  if (response.status === 401) {
    console.warn('🐐 API returned 401 — token expired, logging out');
    await AsyncStorage.multiRemove([
      'jwtToken',
      'authToken',
      'username',
      'userEmail',
      'isSeller',
      'userId',
      'pushToken',
    ]);
    router.replace('/sign-in');
  }

  return response;
}

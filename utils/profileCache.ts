import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, JewelryItem } from '@/types';
import {jwtDecode} from "jwt-decode";
import { API_URL } from '@/constants/api';


export const CACHE_KEYS = {
  PROFILE: 'userProfile',
  CACHE_TIME: 'profileCacheTime',
  TOKEN: 'jwtToken'
} as const;

export const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function updateProfileJewelryBox(items: JewelryItem[]): Promise<void> {
  try {
    const cachedProfile = await getCachedProfile();
    if (cachedProfile) {
      cachedProfile.jewelryBox = items;
      await cacheUserProfile(cachedProfile);
    }
  } catch (error) {
    console.error('Error updating jewelry box cache:', error);
  }
}


export async function cacheUserProfile(profile: User): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [CACHE_KEYS.PROFILE, JSON.stringify(profile)],
      [CACHE_KEYS.CACHE_TIME, Date.now().toString()]
    ]);
  } catch (error) {
    console.error('Error caching profile:', error);
  }
}

export async function isProfileStale(): Promise<boolean> {
  try {
    const cacheTime = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIME);
    if (!cacheTime) return true;

    const parsedTime = parseInt(cacheTime, 10);
    if (isNaN(parsedTime)) {
      console.warn('Corrupted cache timestamp:', cacheTime);
      await AsyncStorage.removeItem(CACHE_KEYS.CACHE_TIME);
      return true;
    }

    const timeSinceCache = Date.now() - parsedTime;
    if (timeSinceCache < 0) {
      console.warn('Clock discrepancy detected');
      return true;
    }

    return timeSinceCache > CACHE_DURATION;
  } catch (error) {
    console.error('Error checking profile staleness:', error);
    return true;
  }
}

export async function clearProfileCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([CACHE_KEYS.PROFILE, CACHE_KEYS.CACHE_TIME]);
  } catch (error) {
    console.error('Error clearing profile cache:', error);
  }
}

export async function getCachedProfile(): Promise<User | null> {
  try {
    const isStale = await isProfileStale();
    if (isStale) return null;

    const profile = await AsyncStorage.getItem(CACHE_KEYS.PROFILE);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error reading cached profile:', error);
    return null;
  }
}

export async function refreshUserProfile(): Promise<User | null> {
  try {
    const token = await AsyncStorage.getItem(CACHE_KEYS.TOKEN);
    if (!token) return null;

    const res = await fetch(`${API_URL}/api/user-profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Profile refresh failed');

    const profile = await res.json();
    if (profile && profile.id !== 0) {
      await cacheUserProfile(profile);
      return profile;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing profile:', error);
    return null;
  }
}

export async function loadUserProfile(): Promise<User | null> {
  try {
    const cached = await getCachedProfile();

    // Add this extra token integrity check
    const token = await AsyncStorage.getItem(CACHE_KEYS.TOKEN);
    if (!token) return null;

    const { exp }: any = jwtDecode(token); // Add jwt-decode package
    const isExpired = exp * 1000 < Date.now();

    if (cached && !isExpired) return cached;

    // Otherwise, refresh from backend
    return await refreshUserProfile();
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}


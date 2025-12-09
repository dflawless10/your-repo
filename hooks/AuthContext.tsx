import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/config';

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  login: (token: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function getTokenExpiry(token: string): number | null {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const isAuthenticated = !!token;
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh token before it expires
  const scheduleTokenRefresh = (currentToken: string) => {
    const expiry = getTokenExpiry(currentToken);
    if (!expiry) return;

    const now = Date.now();
    const timeUntilExpiry = expiry - now;

    // Refresh 5 minutes before expiry (or immediately if less than 5 min left)
    const refreshIn = Math.max(timeUntilExpiry - 5 * 60 * 1000, 1000);

    console.log(`🐐 Token refresh scheduled in ${Math.round(refreshIn / 1000)}s`);

    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(async () => {
      console.log('🐐 Auto-refreshing token...');
      try {
        const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            await AsyncStorage.setItem('jwtToken', data.token);
            setToken(data.token);
            console.log('🐐 Token refreshed successfully');
            scheduleTokenRefresh(data.token); // Schedule next refresh
          }
        } else {
          console.warn('🐐 Token refresh failed, logging out');
          await logout();
        }
      } catch (error) {
        console.error('🐐 Token refresh error:', error);
        await logout();
      }
    }, refreshIn);
  };

  const refreshAuth = async () => {
    const [storedToken, storedUsername] = await Promise.all([
      AsyncStorage.getItem('jwtToken'),
      AsyncStorage.getItem('username'),
    ]);

    if (storedToken) {
      const expiry = getTokenExpiry(storedToken);
      if (expiry && Date.now() < expiry) {
        setToken(storedToken);
        setUsername(storedUsername);
        scheduleTokenRefresh(storedToken);
      } else {
        // Token expired, clear it
        console.warn('🐐 Stored token expired, clearing auth');
        await logout();
      }
    }
  };

  const login = async (newToken: string, newUsername: string) => {
    await AsyncStorage.multiSet([
      ['jwtToken', newToken],
      ['username', newUsername],
    ]);
    setToken(newToken);
    setUsername(newUsername);
    scheduleTokenRefresh(newToken);
  };

  const logout = async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    await AsyncStorage.multiRemove(['jwtToken', 'username', 'authToken', 'userEmail', 'isSeller', 'userId', 'pushToken']);
    setToken(null);
    setUsername(null);
  };

  useEffect(() => {
    void refreshAuth();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    token,
    username,
    login,
    logout,
    refreshAuth,
  }), [token, username]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

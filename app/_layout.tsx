// app/_layout.tsx

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider } from '@/hooks/AuthContext';
import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import store from '@/utils/filestore';
import {
  registerForPushNotificationsAsync,
  sendPushTokenToBackend,
  setupNotificationListeners,
  removeNotificationListeners,
} from '../utils/pushNotifications';
import * as Notifications from 'expo-notifications';
import { ThemeProvider as AppThemeProvider, useTheme } from 'app/theme/ThemeContext';
import Toast from 'react-native-toast-message';

function ThemedNavigation({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <NavigationThemeProvider value={theme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

 const notificationListener = useRef<Notifications.Subscription | null>(null);
const responseListener = useRef<Notifications.Subscription | null>(null);




  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('🐐 Push token obtained:', token);
          await sendPushTokenToBackend(token);
        }
      } catch (error) {
        console.error('🐐 Push notification setup failed:', error);
      }
    };

    initializeNotifications();

    try {
      const listeners = setupNotificationListeners(
        (notification) => {
          console.log('🐐 Notification received in foreground:', notification);
        },
        (response) => {
          console.log('🐐 Notification tapped:', response);
          const data = response.notification.request.content.data;
          if (data?.itemId) {
            console.log('🐐 Navigate to item:', data.itemId);
          }
        }
      );

      notificationListener.current = listeners.notificationListener;
      responseListener.current = listeners.responseListener;
    } catch (error) {
      console.error('🐐 Failed to set up notification listeners:', error);
    }

    return () => {
      if (notificationListener.current && responseListener.current) {
        try {
          removeNotificationListeners({
            notificationListener: notificationListener.current,
            responseListener: responseListener.current,
          });
        } catch (error) {
          console.error('🐐 Failed to remove notification listeners:', error);
        }
      }
    };
  }, []);

  if (!loaded) return null;

  if (__DEV__) {
    const originalCreateElement = React.createElement;
    // @ts-ignore
    React.createElement = (...args: Parameters<typeof originalCreateElement>) => {
      const [type, props, ...children] = args;
      if (
        typeof type === 'string' &&
        type !== 'Text' &&
        children.some((child) => typeof child === 'string')
      ) {
        console.warn(`🐐 Raw string detected in <${type}>:`, children);
      }
      return originalCreateElement(type, props, ...children);
    };
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppThemeProvider>
          <ThemedNavigation>
            <AuthProvider>
              <>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="about" options={{ headerShown: false }} />
                  <Stack.Screen name="help" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-on-duty" options={{ headerShown: false }} />
                  <Stack.Screen name="account/settings" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="orders" options={{ headerShown: false }} />
                  <Stack.Screen name="buyer/sent-offers" options={{ headerShown: false }} />
                  <Stack.Screen name="purchases" options={{ headerShown: false }} />
                  <Stack.Screen name="relisted-discounts" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/dashboard" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/orders" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/revenue" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/analytics" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/[sellerId]" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/moderation" options={{ headerShown: false }} />
                  <Stack.Screen name="watch-appraisal" options={{ headerShown: false }} />
                  <Stack.Screen name="watch-listing" options={{ headerShown: false }} />
                  <Stack.Screen name="diamond-appraisal" options={{ headerShown: false }} />
                  <Stack.Screen name="diamond-listing" options={{ headerShown: false }} />
                  <Stack.Screen name="jewelry-box" options={{ headerShown: false }} />
                  <Stack.Screen name="MustSellScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="category/[name]" options={{ headerShown: false }} />
                  <Stack.Screen name="CreateAuctionScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="listing/create" options={{ headerShown: false }} />
                  <Stack.Screen name="bid-history/[itemId]" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
                <Toast />
              </>
            </AuthProvider>
          </ThemedNavigation>
        </AppThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

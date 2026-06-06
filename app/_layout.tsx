// app/_layout.tsx

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@/config';

import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider } from '@/hooks/AuthContext';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Updates from 'expo-updates';
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
import * as Linking from 'expo-linking';


function ThemedNavigation({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <NavigationThemeProvider value={theme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Check for OTA updates on every launch
  useEffect(() => {
    const checkForUpdate = async () => {
      if (__DEV__) return; // Skip in development
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Silently ignore update errors — don't crash the app
      }
    };
    checkForUpdate();
  }, []);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [initialURL, setInitialURL] = useState<string | null>(null);

  // Handle deep links for Stripe Connect onboarding
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('🐐 Deep link received:', event.url);
      const url = event.url;

      // Check if this is a Stripe onboarding completion link
      // Format: bidgoat://seller/dashboard?onboarding=complete
      if (url.includes('seller/dashboard') && url.includes('onboarding=complete')) {
        console.log('🐐 Stripe onboarding completed, navigating to seller dashboard');
        // The router will handle navigation automatically through expo-router
      }
    };

    // Get initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🐐 App opened with deep link:', url);
        setInitialURL(url);
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('🐐 Push token obtained:', token);
          await sendPushTokenToBackend(token);
        }
      } catch (error) {
        console.log('🐐 Push notifications not configured yet (this is okay for testing)');
        // Silenced - push notifications are optional for now
      }
    };

    initializeNotifications();

    try {
      const listeners = setupNotificationListeners(
        (notification) => {
          console.log('🐐 Notification received in foreground:', notification);
        },
        (response) => {
          const data = response.notification.request.content.data as any;
          if (!data) return;
          const action = data.action;
          if (action === 'view_orders' || action === 'view_order') {
            router.push('/orders' as any);
          } else if (data.itemId || data.item_id) {
            const id = data.itemId || data.item_id;
            router.push(`/item/${id}` as any);
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
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.dflawless.BidGoatMobile">
      <Provider store={store}>

          <AppThemeProvider>
            <ThemedNavigation>
              <AuthProvider>
                <>
                  <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                  <Stack.Screen name="register" options={{ headerShown: false }} />
                  <Stack.Screen name="landing" options={{ headerShown: false }} />
                  <Stack.Screen name="about" options={{ headerShown: false }} />
                  <Stack.Screen name="help" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-on-duty" options={{ headerShown: false }} />
                  <Stack.Screen name="import-reputation" options={{ headerShown: false }} />
                  <Stack.Screen name="account/settings" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="orders" options={{ headerShown: false }} />
                  <Stack.Screen name="login-history" options={{ headerShown: false }} />
                  <Stack.Screen name="buyer/sent-offers" options={{ headerShown: false }} />
                  <Stack.Screen name="purchases" options={{ headerShown: false }} />
                  <Stack.Screen name="dispute-details" options={{ headerShown: false }} />
                  <Stack.Screen name="my-disputes" options={{ headerShown: false }} />
                  <Stack.Screen name="relisted-discounts" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/dashboard" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/orders" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/revenue" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/analytics" options={{ headerShown: false }} />
                  <Stack.Screen name="seller/[sellerId]" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/moderation" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/users-list" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/items-list" options={{ headerShown: false }} />
                  <Stack.Screen name="watch-appraisal" options={{ headerShown: false }} />
                  <Stack.Screen name="watch-listing" options={{ headerShown: false }} />
                  <Stack.Screen name="diamond-appraisal" options={{ headerShown: false }} />
                  <Stack.Screen name="diamond-listing" options={{ headerShown: false }} />
                  <Stack.Screen name="jewelry-box" options={{ headerShown: false }} />
                  <Stack.Screen name="premium-benefits" options={{ headerShown: false }} />
                  <Stack.Screen name="MustSellScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="category/[name]" options={{ headerShown: false }} />
                  <Stack.Screen name="CreateAuctionScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="listing/create" options={{ headerShown: false }} />
                  <Stack.Screen name="bid-history/[itemId]" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                  <StatusBar style="auto" />
                  <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 99999, elevation: 999 }}>
                    <Toast />
                  </View>
                </>
              </AuthProvider>
            </ThemedNavigation>
          </AppThemeProvider>
      </Provider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/config'; // Make sure this is defined in your config

function isExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export async function initPushRegistrationFlow() {
  const token = await AsyncStorage.getItem('jwtToken');

  if (!token || isExpired(token)) {
    console.warn('🐐 Token expired — redirecting to login');
    router.replace('/sign-in');
    return;
  }

  const pushToken = await registerForPushNotificationsAsync();
  if (pushToken) {
    await sendPushTokenToBackend(pushToken);
  }
}

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get the Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('🐐 Push notification permission denied');
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('🐐 Push token:', token);
    } catch (error) {
      console.error('🐐 Error getting push token:', error);
    }
  } else {
    console.warn('🐐 Must use physical device for push notifications');
  }

  return token;
}

/**
 * Send the push token to your backend
 */
export async function sendPushTokenToBackend(token: string): Promise<void> {
  try {
    let jwtToken: string | null = null;
    let attempts = 0;

    while (!jwtToken && attempts < 3) {
      jwtToken = await AsyncStorage.getItem('jwtToken');
      if (!jwtToken) {
        console.warn(`🐐 No JWT token found (attempt ${attempts + 1}), retrying...`);
        await new Promise(res => setTimeout(res, 300));
        attempts++;
      }
    }

    if (!jwtToken || isExpired(jwtToken)) {
      console.warn('🐐 JWT missing or expired — skipping push token registration');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/register-push-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        push_token: token,
        device_type: Platform.OS,
      }),
    });

    if (response.ok) {
      console.log('🐐 Push token registered with backend');
      await AsyncStorage.setItem('pushToken', token);
    } else {
      console.error('🐐 Failed to register push token:', await response.text());
    }
  } catch (error) {
    console.error('🐐 Error sending push token to backend:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('🐐 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('🐐 Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return {
    notificationListener,
    responseListener,
  };
}

/**
 * Remove notification listeners
 */
export function removeNotificationListeners(listeners: {
  notificationListener: Notifications.Subscription;
  responseListener: Notifications.Subscription;
}) {
  listeners.notificationListener.remove();
  listeners.responseListener.remove();
}

/**
 * Send a local notification (for testing)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
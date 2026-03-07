import React from 'react';
import { Platform, Image, Animated, View, Text, Appearance } from 'react-native';
import { router, Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from '@/utils/filestore';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Colors } from '@/constants/Colors';
import EnhancedHeader from 'app/components/EnhancedHeader';
import { HapticTab } from 'components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import wishlistIcon from '../../assets/goat-stamp-coin.png';
import { WishlistProvider } from 'app/wishlistContext';
// ThemeProvider removed - already provided in root _layout.tsx
import 'react-native-reanimated';
import FloatingGetAppCard from "@/app/menu";

function CustomHeader({
  routeName,
  scrollY,
  username,
  isLoading,
}: Readonly<{
  routeName: string;
  scrollY: Animated.Value;
  username?: string;
  isLoading: boolean;
}>) {
  if (routeName === 'index') {
    if (isLoading) return null;
    return (
      <EnhancedHeader
        scrollY={scrollY}
        username={username}
        onSearch={(q) => console.log('search', q)}
        onSelect={(result) => {
          if (result.type === 'item') {
            router.push(`/item/${result.value}`);
          } else if (result.type === 'help') {
            router.push(`/help/${result.value}`);
          }
        }}
      />
    );
  }
  return undefined;
}

function CustomTabIcon({
  routeName,
  focused,
  color,
  size,
  wishlistItems,
  username,
}: Readonly<{
  routeName: string;
  focused: boolean;
  color: string;
  size: number;
  wishlistItems: any[];
  username?: string;
}>) {
  switch (routeName) {
    case 'index':
      return (
        <Ionicons
          name={focused ? 'home' : 'home-outline'}
          size={size}
          color={color}
        />
      );
    case 'explore':
      return (
        <Ionicons
          name={focused ? 'search' : 'search-outline'}
          size={size}
          color={color}
        />
      );
    case 'discover':
      return (
        <Ionicons
          name={focused ? 'compass' : 'compass-outline'}
          size={size}
          color={color}
        />
      );
    case 'wishlist':
      const hasReminder = wishlistItems.some(item => item.reminder_active);
      const hasPriceAlert = wishlistItems.some(item => item.price_alert_active);
      const showBadge = hasReminder || hasPriceAlert;

      return (
        <View style={{ position: 'relative' }}>
          <Image
            source={wishlistIcon}
            style={{
              width: size,
              height: size,
            }}
            resizeMode="contain"
          />
          {showBadge && (
            <View
              style={{
                position: 'absolute',
                top: -6,
                right: -10,
                width: 14,
                height: 14,
                borderRadius: 7,
                borderWidth: 2,
                borderColor: '#FFF',
                overflow: 'hidden',
              }}
            >
              {hasReminder && hasPriceAlert ? (
                // Split circle: left blue, right green
                <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
                  <View style={{ width: '50%', height: '100%', backgroundColor: '#4A90E2' }} />
                  <View style={{ width: '50%', height: '100%', backgroundColor: '#10B981' }} />
                </View>
              ) : hasReminder ? (
                // Blue only
                <View style={{ width: '100%', height: '100%', backgroundColor: '#4A90E2', borderRadius: 7 }} />
              ) : (
                // Green only
                <View style={{ width: '100%', height: '100%', backgroundColor: '#10B981', borderRadius: 7 }} />
              )}
            </View>
          )}
        </View>
      );
    default:
      return null;
  }
}

export default function AppLayout() {
  const colorScheme: 'light' = 'light';

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const username = useAppSelector((state) => state.user.profile?.username);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isLoading = username === undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WishlistProvider>
        <Tabs
          initialRouteName="index"
          screenOptions={({ route }) => ({
            headerShown: true,
            header: () =>
              CustomHeader({
                routeName: route.name,
                scrollY,
                username,
                isLoading,
              }),
            ...(Platform.OS !== 'web' && {
              tabBarButton: HapticTab,
              tabBarBackground: TabBarBackground,
            }),
            tabBarStyle: Platform.select({
              ios: { position: 'absolute' },
              default: {},
            }),
            tabBarActiveTintColor: Colors[colorScheme].tint,
            tabBarInactiveTintColor: 'gray',
            tabBarIcon: ({ focused, color, size }) =>
              CustomTabIcon({
                routeName: route.name,
                focused,
                color,
                size,
                wishlistItems,
                username,
              }),
          })}
        >
          {/* Visible Tabs */}
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
          <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
          <Tabs.Screen name="wishlist" options={{ title: 'Wishlist' }} />

          {/* Hidden Routes */}
          <Tabs.Screen name="jewelry-box" options={{ href: null, headerShown: false }} />
          <Tabs.Screen name="MyAuctionScreen" options={{ href: null }} />
          <Tabs.Screen name="MyBidsScreen" options={{ href: null }} />
          <Tabs.Screen name="JewelryBoxScreen" options={{ href: null, headerShown: false }} />
          <Tabs.Screen name="cart" options={{ href: null }} />
          <Tabs.Screen name="profile" options={{ href: null }} />
          <Tabs.Screen name="editProfile" options={{ href: null }} />
          <Tabs.Screen name="favorites" options={{ href: null, headerShown: false }} />
          <Tabs.Screen name="list-item" options={{ href: null, title: 'List an Item', tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="community-guidelines" options={{ href: null }} />
          <Tabs.Screen name="navigation/AuthNavigator" options={{ href: null }} />
          <Tabs.Screen name="navigation/index" options={{ href: null }} />
          <Tabs.Screen name="navigation/LegacyTabNavigator" options={{ href: null }} />
          <Tabs.Screen name="navigation/OnboardingNavigator" options={{ href: null }} />
          <Tabs.Screen name="navigation/TabNavigator" options={{ href: null }} />
          <Tabs.Screen name="item/[itemId]" options={{ href: null }} />
        </Tabs>

        {/* ⭐ Floating CTA Overlay — THIS is where it belongs */}
        <FloatingGetAppCard />
      </WishlistProvider>
    </GestureHandlerRootView>
  );
}

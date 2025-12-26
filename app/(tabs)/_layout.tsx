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
import { ThemeProvider } from 'app/theme/ThemeContext';
import 'react-native-reanimated';

// ✅ Force global light mode
Appearance.setColorScheme('light');

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
    case 'jewelry-box':
      return (
        <Ionicons
          name={focused ? 'diamond' : 'diamond-outline'}
          size={size}
          color={color}
        />
      );
    case 'MyAuctionScreen':
      return (
        <MaterialCommunityIcons
          name={focused ? 'gavel' : 'gavel'}
          size={size}
          color={color}
        />
      );
    case 'wishlist':
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
          {wishlistItems.length > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -8,
                right: -12,
                backgroundColor: '#FF6B35',
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 5,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#fff',
              }}
            >
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
              </Text>
            </View>
          )}
        </View>
      );
    default:
      return null;
  }
}

export default function AppLayout() {
  // ✅ Hardcode light mode
  const colorScheme: 'light' = 'light';

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const username = useAppSelector((state) => state.user.profile?.username);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isLoading = username === undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
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
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                  ios: { position: 'absolute' },
                  default: {},
                }),
                tabBarActiveTintColor: Colors[colorScheme].tint, // ✅ always light
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
              {/* Visible Tabs - Complete User Journey: Browse → Bid → Win → Collect */}
              <Tabs.Screen name="index" options={{ title: 'Home' }} />
              <Tabs.Screen name="jewelry-box" options={{ title: 'My Jewelry Box', headerShown: false }} />
              <Tabs.Screen name="MyAuctionScreen" options={{ title: 'My Auctions' }} />
              <Tabs.Screen name="wishlist" options={{ title: 'Wishlist' }} />

              {/* Hidden Routes - Accessible via Menu Modal */}
              <Tabs.Screen name="discover" options={{ href: null }} />
              <Tabs.Screen name="explore" options={{ href: null }} />
              <Tabs.Screen name="MyBidsScreen" options={{ href: null }} />
              <Tabs.Screen name="JewelryBoxScreen" options={{ href: null, headerShown: false }} />
              <Tabs.Screen name="cart" options={{ href: null }} />
              <Tabs.Screen name="profile" options={{ href: null }} />
              <Tabs.Screen name="editProfile" options={{ href: null }} />
              <Tabs.Screen name="favorites" options={{ href: null, headerShown: false }} />
              <Tabs.Screen name="list-item" options={{ href: null, title: 'List an Item' }} />
              <Tabs.Screen name="community-guidelines" options={{ href: null }} />
              <Tabs.Screen name="navigation/AuthNavigator" options={{ href: null }} />
              <Tabs.Screen name="navigation/index" options={{ href: null }} />
              <Tabs.Screen name="navigation/LegacyTabNavigator" options={{ href: null }} />
              <Tabs.Screen name="navigation/OnboardingNavigator" options={{ href: null }} />
              <Tabs.Screen name="navigation/TabNavigator" options={{ href: null }} />
              <Tabs.Screen name="item/[itemId]" options={{ href: null }} />
            </Tabs>
          </WishlistProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

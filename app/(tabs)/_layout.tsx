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
import wishlistIcon from 'app/components/assets/wishlist-coin.png';
import { WishlistProvider } from 'app/wishlistContext';
import { ThemeProvider } from 'app/theme/ThemeContext';

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
    case 'wishlist':
      return (
        <View>
          <Image
            source={wishlistIcon}
            style={{ width: size, height: size, resizeMode: 'contain' }}
          />
          {wishlistItems.length > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -10,
                backgroundColor: 'red',
                borderRadius: 8,
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: 'white', fontSize: 10 }}>
                {wishlistItems.length}
              </Text>
            </View>
          )}
        </View>
      );
    case 'index':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name={focused ? 'home' : 'home-outline'}
            size={size}
            color={color}
          />
        </View>
      );
    case 'explore':
      return <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />;
    case 'JewelryBoxScreen':
      return <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />;
    case 'MyAuctionScreen':
      return <MaterialCommunityIcons name="gavel" size={size} color={color} />;
    case 'discover':
      return <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />;
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
              {/* Visible Tabs */}
              <Tabs.Screen name="index" options={{ title: 'Home' }} />
              <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
              <Tabs.Screen name="wishlist" options={{ title: 'Wishlist' }} />
              <Tabs.Screen name="JewelryBoxScreen" options={{ title: 'Favorites', headerShown: false }} />
              <Tabs.Screen name="MyAuctionScreen" options={{ title: 'My Auctions' }} />
              <Tabs.Screen name="discover" options={{ title: 'Discover' }} />

              {/* Hidden Routes */}
               <Tabs.Screen name="MyBidsScreen" options={{ href: null }} />   {/* 👈 hides MyBidsScreen */}
              <Tabs.Screen name="cart" options={{ href: null }} />
              <Tabs.Screen name="profile" options={{ href: null }} />
              <Tabs.Screen name="editProfile" options={{ href: null }} />
              <Tabs.Screen name="favorites" options={{ href: null, headerShown: false }} />
              <Tabs.Screen name="list-item" options={{ href: null, title: 'List an Item' }} />
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

// app/tabs/navigation/LegacyTabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, TouchableOpacity, Image, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from '@/utils/filestore';
import { useAppSelector } from '@/hooks/reduxHooks';

import HomeScreen from '@/app/(tabs)';
import DiscoverScreen from '../discover';
import ExploreScreen from '@/app/(tabs)/explore';
import Wishlist from 'app/wishlist';
import FavoritesScreen from '../favorites';
import MyAuctionsScreen from '../MyAuctionScreen';
import ProfileScreen from '../profile';
import  EnhancedHeader  from 'app/components/EnhancedHeader';
import wishlistIcon from 'app/components/assets/wishlist-coin.png';

const Tab = createBottomTabNavigator();

function LegacyTabNavigator() {
  const wishlistItems = useAppSelector(state => state.wishlist.items);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('profile' as never)}
            style={{ paddingRight: 16 }}
          >
            <Ionicons name="person-circle" size={28} color="#6A0DAD" />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ccc',
          height: 65,
          paddingBottom: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case 'Wishlist':
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
            case 'Home':
              return (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={size}
                  color={color}
                />
              );
            case 'Discover':
              return (
                <Ionicons
                  name={focused ? 'compass' : 'compass-outline'}
                  size={size}
                  color={color}
                />
              );
            case 'Explore':
              return (
                <Ionicons
                  name={focused ? 'search' : 'search-outline'}
                  size={size}
                  color={color}
                />
              );
            case 'Favorites':
              return (
                <Ionicons
                  name={focused ? 'heart' : 'heart-outline'}
                  size={size}
                  color={color}
                />
              );
            case 'MyAuctions':
              return (
                <MaterialCommunityIcons
                  name="gavel"
                  size={size}
                  color={color}
                />
              );
            default:
              return (
                <View>
                  <Image
                    source={wishlistIcon}
                    style={{ width: size, height: size, resizeMode: 'contain' }}
                  />
                  <Text
                    style={{
                      position: 'absolute',
                      bottom: -10,
                      fontSize: 10,
                      color: '#6A0DAD',
                    }}
                  >
                    🐐
                  </Text>
                </View>
              );
          }
        },
        tabBarActiveTintColor: '#6A0DAD',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          header: () => (
            <EnhancedHeader
              scrollY={new Animated.Value(0)}
              username="username here"
              onSearch={(q) => console.log('search', q)}
            />
          ),
        }}
      />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Wishlist" component={Wishlist} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="MyAuctions" component={MyAuctionsScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <LegacyTabNavigator />
      </Provider>
    </GestureHandlerRootView>
  );
}

import React from 'react';
import {
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Constants
export const HEADER_MAX_HEIGHT = 120;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const ROUTES = {
  ABOUT: '/about',
  LOGIN: '/login',
  REGISTER: '/register',
  JEWELRY_BOX: '/jewelry-box',
  HELP: '/wishlist',
} as const;


interface NavigationLinkProps {
  route: keyof typeof ROUTES;
  label: string;
  onPress: (route: keyof typeof ROUTES) => void;
}

interface HeaderProps {
  scrollY: Animated.Value;
  username: string | null;
  onSearch?: (text: string) => void;
  logoSource?: ImageSourcePropType; // made optional; fallback below
}

const NavigationLink: React.FC<NavigationLinkProps> = ({ route, label, onPress }) => (
  <TouchableOpacity onPress={() => onPress(route)}>
    <Text style={styles.link}>{label}</Text>
  </TouchableOpacity>
);

const Logo: React.FC<{ source: ImageSourcePropType }> = ({ source }) => (
  <View style={styles.logoWrapper}>
    <Image
      source={source}
      style={styles.logo}
      resizeMode="contain"
      accessible
      accessibilityLabel="Bid Goat Logo"
    />
  </View>
);

export const EnhancedHeader: React.FC<HeaderProps> = ({
  scrollY,
  username,
  onSearch,
  logoSource
}) => {
  const insets = useSafeAreaInsets();
  const fallbackLogo = require('@/assets/goat.png');

  const animationConfig = {
    headerHeight: scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      extrapolate: 'clamp',
    }),
    opacity: scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    })
  };

  const navigateTo = (route: keyof typeof ROUTES) => {
  router.push(ROUTES[route]);
};


  const renderAuthLinks = () => {
    if (username) {
      return <Text style={styles.welcomeText}>Welcome, {username}</Text>;
    }

    return (
      <>
        <NavigationLink route="LOGIN" label="Sign In" onPress={navigateTo} />
        <NavigationLink route="REGISTER" label="Sign Up" onPress={navigateTo} />
      </>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: animationConfig.headerHeight,
          paddingTop: Platform.OS === 'web' ? 30 : insets.top,
          opacity: animationConfig.opacity,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.left}>
          <NavigationLink route="ABOUT" label="About" onPress={navigateTo} />
          {renderAuthLinks()}
        </View>

        <View style={styles.center}>
          <Logo source={logoSource ?? fallbackLogo} />
          <Text style={styles.badge}>🐐 Goat Certified</Text>
        </View>

        <View style={styles.right}>
          {username && (
            <NavigationLink route="JEWELRY_BOX" label="My Jewelry Box" onPress={navigateTo} />
          )}
          <NavigationLink route="HELP" label="Help" onPress={navigateTo} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: HEADER_MAX_HEIGHT,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#ffd700',
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  logo: {
    width: 80,
    height: 80,
    maxWidth: '100%',
  }
});
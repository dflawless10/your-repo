import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { Colors } from '@/constants/Colors';
import wishlistIcon from '@/assets/goat-stamp-coin.png';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useTheme } from '@/app/theme/ThemeContext';


type FooterButtonProps = {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
  textColor: string;
};

function FooterButton({ children, label, active, onPress, textColor }: Readonly<FooterButtonProps>) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      activeOpacity={0.7}
    >
      {children}
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}



export default function GlobalFooter() {
  const router = useRouter();
  const segments = useSegments();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const { theme, colors } = useTheme();

  // Determine an active route (for highlighting)
  const current = segments[segments.length - 1];
  const isActive = (name: string) => current === name;

  // Calculate colors based on current theme
  const isDark = theme === 'dark';
  const inactiveColor = isDark ? '#666' : '#999';
  const activeColor = isDark ? '#B794F4' : '#6A0DAD';
  const borderColor = isDark ? '#333' : '#E5E5E5';

  console.log('🐐 GlobalFooter render - theme:', theme, 'isDark:', isDark, 'activeColor:', activeColor, 'bgColor:', colors.background);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, borderTopColor: borderColor }]}
    >
      {/* Home */}
      <FooterButton
        label="Home"
        active={isActive('index')}
        onPress={() => router.push('/')}
        textColor={isActive('index') ? activeColor : inactiveColor}
      >
        <Ionicons
          name={isActive('index') ? 'home' : 'home-outline'}
          size={24}
          color={isActive('index') ? activeColor : inactiveColor}
        />
      </FooterButton>

      {/* Explore */}
      <FooterButton
        label="Explore"
        active={isActive('explore')}
        onPress={() => router.push('/explore')}
        textColor={isActive('explore') ? activeColor : inactiveColor}
      >
        <Ionicons
          name={isActive('explore') ? 'search' : 'search-outline'}
          size={24}
          color={isActive('explore') ? activeColor : inactiveColor}
        />
      </FooterButton>

      {/* Discover */}
      <FooterButton
        label="Discover"
        active={isActive('discover')}
        onPress={() => router.push('/discover')}
        textColor={isActive('discover') ? activeColor : inactiveColor}
      >
        <Ionicons
          name={isActive('discover') ? 'compass' : 'compass-outline'}
          size={24}
          color={isActive('discover') ? activeColor : inactiveColor}
        />
      </FooterButton>

      {/* Wishlist */}
      <FooterButton
        label="Wishlist"
        active={isActive('wishlist')}
        onPress={() => router.push('/wishlist')}
        textColor={isActive('wishlist') ? activeColor : inactiveColor}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={wishlistIcon}
            style={[
              { width: 24, height: 24 },
              { tintColor: isActive('wishlist') ? activeColor : inactiveColor }
            ]}
            resizeMode="contain"
          />
          {wishlistItems.length > 0 && (
            <View style={[styles.badge, { borderColor: colors.background }]}>
              <Text style={styles.badgeText}>
                {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
              </Text>
            </View>
          )}
        </View>
      </FooterButton>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
  activeLabel: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

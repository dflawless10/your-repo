import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { Colors } from '@/constants/Colors';
import wishlistIcon from '@/assets/goat-stamp-coin.png';
import { useAppSelector } from '@/hooks/reduxHooks';
type FooterButtonProps = {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
};

function FooterButton({ children, label, active, onPress }: Readonly<FooterButtonProps>) {
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

  // Determine an active route (for highlighting)
  const current = segments[segments.length - 1];
  const isActive = (name: string) => current === name;

  return (
    <View style={styles.container}>
      {/* Home */}
      <FooterButton
        label="Home"
        active={isActive('index')}
        onPress={() => router.push('/')}
      >
        <Ionicons
          name={isActive('index') ? 'home' : 'home-outline'}
          size={24}
          color={isActive('index') ? Colors.light.tint : '#999'}
        />
      </FooterButton>

      {/* Jewelry Box */}
      <FooterButton
        label="My Jewelry Box"
        active={isActive('jewelry-box')}
        onPress={() => router.push('/jewelry-box')}
      >
        <Ionicons
          name={isActive('jewelry-box') ? 'diamond' : 'diamond-outline'}
          size={24}
          color={isActive('jewelry-box') ? Colors.light.tint : '#999'}
        />
      </FooterButton>

      {/* Auctions */}
      <FooterButton
        label="My Auctions"
        active={isActive('MyAuctionScreen')}
        onPress={() => router.push('/MyAuctionScreen')}
      >
        <MaterialCommunityIcons
          name="gavel"
          size={24}
          color={isActive('MyAuctionScreen') ? Colors.light.tint : '#999'}
        />
      </FooterButton>

      {/* Wishlist */}
      <FooterButton
        label="Wishlist"
        active={isActive('../wishlist')}
        onPress={() => router.push('../wishlist')}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={wishlistIcon}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
          {wishlistItems.length > 0 && (
            <View style={styles.badge}>
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
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
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
    color: '#999',
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

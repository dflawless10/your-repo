import React from 'react';
import { Image, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  uri?: string;
  size?: number;
  onPress?: () => void;
  showPremiumBadge?: boolean;
  variant?: 'default' | 'gradient' | 'glow';
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 48,
  onPress,
  showPremiumBadge = false,
  variant = 'gradient',
}) => {
  const router = useRouter();
  const borderWidth = size > 60 ? 3 : 2;
  const innerSize = size - borderWidth * 2;

  const renderAvatar = () => {
    if (variant === 'gradient') {
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {/* Gradient Border */}
          <LinearGradient
            colors={['#FF6B35', '#6A0DAD', '#4169E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientBorder, { width: size, height: size, borderRadius: size / 2 }]}
          >
            {/* Inner White Ring */}
            <View style={[styles.innerRing, {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2
            }]}>
              <Image
                source={{ uri: uri ?? 'https://via.placeholder.com/80x80.png?text=🐐' }}
                style={[styles.avatar, {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2
                }]}
              />
            </View>
          </LinearGradient>

          {/* Premium Badge */}
          {showPremiumBadge && (
            <View style={[styles.premiumBadge, {
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: (size * 0.35) / 2,
              right: -2,
              bottom: -2,
            }]}>
              <Ionicons name="star" size={size * 0.2} color="#FFD700" />
            </View>
          )}
        </View>
      );
    }

    if (variant === 'glow') {
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.glowContainer, {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowRadius: size * 0.3,
          }]}>
            <Image
              source={{ uri: uri ?? 'https://via.placeholder.com/80x80.png?text=🐐' }}
              style={[styles.avatar, {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 3,
                borderColor: '#FFF',
              }]}
            />
          </View>

          {showPremiumBadge && (
            <View style={[styles.premiumBadge, {
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: (size * 0.35) / 2,
              right: -2,
              bottom: -2,
            }]}>
              <Ionicons name="star" size={size * 0.2} color="#FFD700" />
            </View>
          )}
        </View>
      );
    }

    // Default simple variant
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Image
          source={{ uri: uri ?? 'https://via.placeholder.com/80x80.png?text=🐐' }}
          style={[styles.avatar, {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: '#E0E0E0',
          }]}
        />

        {showPremiumBadge && (
          <View style={[styles.premiumBadge, {
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: (size * 0.35) / 2,
            right: -2,
            bottom: -2,
          }]}>
            <Ionicons name="star" size={size * 0.2} color="#FFD700" />
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => router.push('/profile'))}
      activeOpacity={0.8}
    >
      {renderAvatar()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  innerRing: {
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    resizeMode: 'cover',
  },
  glowContainer: {
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    elevation: 8,
  },
  premiumBadge: {
    position: 'absolute',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Avatar;


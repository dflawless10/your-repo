import React from 'react';
import { Image, TouchableOpacity, StyleSheet, View, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  uri?: string;
  size?: number;
  onPress?: () => void;
  showPremiumBadge?: boolean;
  variant?: 'default' | 'gradient' | 'glow';
  fallbackSource?: ImageSourcePropType;
  cacheKey?: string | number;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 48,
  onPress,
  showPremiumBadge = false,
  variant = 'gradient',
  fallbackSource,
  cacheKey,
}) => {
  const router = useRouter();
  const borderWidth = size > 60 ? 3 : 2;
  const innerSize = size - borderWidth * 2;

  const [failed, setFailed] = React.useState(false);

  const normalizedUri = typeof uri === 'string' ? uri.trim() : '';
  const canUseRemoteUri =
    !failed &&
    normalizedUri.length > 0 &&
    (normalizedUri.startsWith('https://') || normalizedUri.startsWith('http://'));

  const imageSource: ImageSourcePropType = canUseRemoteUri
    ? { uri: normalizedUri, cache: 'reload' }
    : (fallbackSource ?? require('../../assets/goat-icon.png'));

  React.useEffect(() => {
    setFailed(false);
  }, [normalizedUri, cacheKey]);

  const renderImage = (style: any) => (
    <Image
      source={imageSource}
      style={[styles.avatar, style]}
      onError={() => setFailed(true)}
    />
  );

  const renderAvatar = () => {
    if (variant === 'gradient') {
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <LinearGradient
            colors={['#FF6B35', '#6A0DAD', '#4169E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientBorder, { width: size, height: size, borderRadius: size / 2 }]}
          >
            <View
              style={[
                styles.innerRing,
                {
                  width: size - 4,
                  height: size - 4,
                  borderRadius: (size - 4) / 2,
                },
              ]}
            >
              {renderImage({
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              })}
            </View>
          </LinearGradient>

          {showPremiumBadge && (
            <View
              style={[
                styles.premiumBadge,
                {
                  width: size * 0.35,
                  height: size * 0.35,
                  borderRadius: (size * 0.35) / 2,
                  right: -2,
                  bottom: -2,
                },
              ]}
            >
              <Ionicons name="star" size={size * 0.2} color="#FFD700" />
            </View>
          )}
        </View>
      );
    }

    if (variant === 'glow') {
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View
            style={[
              styles.glowContainer,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                shadowRadius: size * 0.3,
              },
            ]}
          >
            {renderImage({
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 3,
              borderColor: '#FFF',
            })}
          </View>

          {showPremiumBadge && (
            <View
              style={[
                styles.premiumBadge,
                {
                  width: size * 0.35,
                  height: size * 0.35,
                  borderRadius: (size * 0.35) / 2,
                  right: -2,
                  bottom: -2,
                },
              ]}
            >
              <Ionicons name="star" size={size * 0.2} color="#FFD700" />
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {renderImage({
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: '#E0E0E0',
        })}

        {showPremiumBadge && (
          <View
            style={[
              styles.premiumBadge,
              {
                width: size * 0.35,
                height: size * 0.35,
                borderRadius: (size * 0.35) / 2,
                right: -2,
                bottom: -2,
              },
            ]}
          >
            <Ionicons name="star" size={size * 0.2} color="#FFD700" />
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={onPress ?? (() => router.push('/profile'))} activeOpacity={0.8}>
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
    backgroundColor: '#f3f4f6',
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


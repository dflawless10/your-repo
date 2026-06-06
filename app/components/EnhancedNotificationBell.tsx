import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationBadgeConfig } from '@/types/notifications';

interface EnhancedNotificationBellProps {
  badgeConfig: NotificationBadgeConfig;
  size?: number;
}

export default function EnhancedNotificationBell({
  badgeConfig,
  size = 24,
}: EnhancedNotificationBellProps) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (badgeConfig.pulse && badgeConfig.count > 0) {
      // Pulsing animation for critical notifications
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glowing effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [badgeConfig.pulse, badgeConfig.count]);

  const handlePress = () => {
    router.push('/notifications');
  };

  const getBellIcon = () => {
    if (badgeConfig.count === 0) {
      return 'notifications-outline';
    }
    if (badgeConfig.priority === 'critical') {
      return 'notifications'; // Solid bell for critical
    }
    return 'notifications-outline';
  };

  const bellColor = badgeConfig.count > 0 ? badgeConfig.color : '#6B7280';

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      {/* Glow effect for critical notifications */}
      {badgeConfig.pulse && badgeConfig.count > 0 && (
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowAnim,
              backgroundColor: badgeConfig.color,
            },
          ]}
        />
      )}

      {/* Bell Icon */}
      <Animated.View
        style={[
          styles.bellContainer,
          {
            transform: [{ scale: badgeConfig.pulse ? pulseAnim : 1 }],
          },
        ]}
      >
        <Ionicons name={getBellIcon()} size={size} color={bellColor} />

        {/* Priority Dot Indicator */}
        {badgeConfig.showDot && (
          <View
            style={[
              styles.priorityDot,
              {
                backgroundColor: badgeConfig.color,
                borderColor: '#FFF',
              },
            ]}
          />
        )}

        {/* Badge Count */}
        {badgeConfig.count > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeConfig.color,
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {badgeConfig.count > 99 ? '99+' : badgeConfig.count}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 10,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    opacity: 0.3,
  },
  bellContainer: {
    position: 'relative',
    overflow: 'visible',
  },
  priorityDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/app/theme/ThemeContext';
import { useResponsiveLayout } from '@/app/hooks/useResponsiveLayout';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  animated?: boolean;
  opacity?: Animated.Value;
  scale?: Animated.Value;
  rightComponent?: React.ReactNode;
}

export default function PageHeader({
  title,
  showBackButton = true,
  onBack,
  animated = true,
  opacity,
  scale,
  rightComponent,
}: PageHeaderProps) {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { headerPaddingTop, horizontalPadding } = useResponsiveLayout();
  const isDark = theme === 'dark';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const containerStyle = [
    styles.pageHeader,
    {
      backgroundColor: colors.surface,
      paddingTop: headerPaddingTop,
      paddingHorizontal: horizontalPadding,
      // NO borderBottomWidth - removes white line issue
    }
  ];

  const animatedStyle = animated && opacity && scale ? {
    opacity,
    transform: [{ scale }]
  } : {};

  const Container = animated ? Animated.View : View;

  return (
    <Container style={[containerStyle, animatedStyle]}>
      {showBackButton && (
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? '#B794F4' : '#6A0DAD'}
          />
        </TouchableOpacity>
      )}
      <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {rightComponent && (
        <View style={styles.rightComponent}>
          {rightComponent}
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    // Removed borderBottomWidth - no white line
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  rightComponent: {
    marginLeft: 12,
  },
});

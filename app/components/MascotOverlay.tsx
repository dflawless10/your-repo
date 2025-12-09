import React, {useEffect, useRef} from 'react';
import {Animated, Text, StyleSheet, ViewStyle, TouchableOpacity} from 'react-native';
import GoatConfetti from '../components/GoatConfetti';
import type {MascotMood} from '@/types/goatmoods';
import {TextStyle} from 'react-native';

export interface MascotOverlayProps {
  mood: MascotMood;
  message: string;
  animate?: boolean;
  position?: 'top' | 'bottom' | 'center';
  visible?: boolean;
  onDismiss?: () => void; // ✅ Add this
}


const MascotOverlay: React.FC<MascotOverlayProps> = ({
  mood,
  message,
  position = 'bottom',
  visible = true,
  animate,
  onDismiss, // ✅ THIS LINE IS CRUCIAL
}) => {

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      Animated.sequence([
        Animated.timing(fadeAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
        Animated.timing(fadeAnim, {toValue: 0.8, duration: 100, useNativeDriver: true}),
        Animated.timing(fadeAnim, {toValue: 1, duration: 100, useNativeDriver: true}),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 600 : 300,
        useNativeDriver: true,
      }).start();
    }
  }, [animate, visible]);


  const positionStyle: Partial<ViewStyle> = {
    ...(position === 'top' && {top: 24}),
    ...(position === 'bottom' && {bottom: 24}),
    ...(position === 'center' && {justifyContent: 'center' as ViewStyle['justifyContent']}),
  };

  const moodStyles: Record<string, TextStyle> = {
    Happy: {color: '#ff69b4'},
    Mystic: {color: '#6a0dad', fontStyle: 'italic'},
    Shimmer: {color: '#00ced1', fontWeight: 'bold'},
    // Add others as needed
  };

  const renderMascot = () => {
    if (!animate) return null;

    switch (mood) {
      case 'Celebrate':
        return <GoatConfetti/>;
      case 'Mystic':
        return <Text style={{fontSize: 24}}>🔮</Text>;
      case 'Sad':
       return (
  <Animated.View style={{ opacity: fadeAnim }}>
    <Text style={{ fontSize: 24 }}>😢</Text>
  </Animated.View>
);

      default:
        return null;
    }
  };

 // Inside MascotOverlay.tsx
return (
  <TouchableOpacity onPress={onDismiss} activeOpacity={1} style={StyleSheet.absoluteFill}>
    <Animated.View style={[styles.overlay, positionStyle, { opacity: fadeAnim }]}>
      {renderMascot()}
      <Text style={[styles.mascot, moodStyles[mood] || {}]}>
        {message}
      </Text>
    </Animated.View>
  </TouchableOpacity>
);

}


const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 24,
    right: 24,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    elevation: 4,
    alignItems: 'center',
    zIndex: 999,
  },
  mascot: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MascotOverlay;


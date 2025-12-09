import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring, runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import CarouselPreview from '../onboarding/CarouselPreview';
import { showToast } from '@/utils/toast';


const WelcomeDashboard: React.FC = () => {
  const translateX = useSharedValue(0);
  const [showCarousel, setShowCarousel] = useState(false);


  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      if (translateX.value < -50) {
        translateX.value = withSpring(-100); // Optional: animate off-screen
        runOnJS(setShowCarousel)(true);
        runOnJS(showToast)('success', 'Preview unlocked!');
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Text style={styles.title}>Welcome to BidGoat 🐐💎</Text>
          <Text style={styles.subtext}>Swipe left to reveal curated auctions</Text>
        </Animated.View>
      </GestureDetector>

      {showCarousel && <CarouselPreview category="Just Listed" />}
    </>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtext: { fontSize: 16, color: '#555' },
});

export default WelcomeDashboard;

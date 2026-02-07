import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import { Image } from 'expo-image';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import React from "react";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalFooter from "./components/GlobalFooter";
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { useTheme } from '@/app/theme/ThemeContext';


const { width, height } = Dimensions.get('window');
const fallbackImage = 'https://via.placeholder.com/300x200.png?text=No+Image+Available';

const ZoomableImage = ({
  uri,
  scrollEnabledSetter,
  onLoad,
}: {
  uri: string;
  scrollEnabledSetter: (enabled: boolean) => void;
  onLoad: () => void;
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(width / 2);
  const focalY = useSharedValue(height / 2);

  useEffect(() => {
    scale.value = 1;
  }, [uri]);

  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const targetScale = scale.value > 1 ? 1 : 2;
      scale.value = withTiming(targetScale, { duration: 200 });
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      const clamped = Math.max(1, Math.min(newScale, 3));
      scale.value = clamped;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
      if (clamped > 1) runOnJS(scrollEnabledSetter)(false);
    })
    .onEnd(() => {
      savedScale.value = 1;
      scale.value = withTiming(1, { duration: 200 });
      focalX.value = withTiming(width / 2);
      focalY.value = withTiming(height / 2);
      runOnJS(scrollEnabledSetter)(true);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - scale.value) * (focalX.value - width / 2) },
      { translateY: (1 - scale.value) * (focalY.value - height / 2) },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.imageWrapper}>
      <GestureDetector gesture={composedGesture}>
        <ReanimatedAnimated.View style={animatedStyle}>
          <Image
            source={{ uri: uri || fallbackImage }}
            style={styles.image}
            contentFit="contain"
            placeholder={require('../assets/goat-icon.png')}
            onLoad={onLoad}
          />
        </ReanimatedAnimated.View>
      </GestureDetector>
    </View>
  );
};

export default function FullImageScreen() {
  const { theme, colors } = useTheme();
  const { mediaArray, index, title } = useLocalSearchParams();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const headerScale = React.useRef(new Animated.Value(1)).current;

  let images: string[] = [];
  try {
    const rawMediaArray = Array.isArray(mediaArray) ? mediaArray[0] : mediaArray;
    images = JSON.parse(rawMediaArray || '[]');
  } catch (err) {
    console.warn('Failed to parse mediaArray:', err);
  }

  const itemTitle = typeof title === 'string' ? title : (Array.isArray(title) ? title[0] : 'Images');

  const start = Math.min(Math.max(Number(index) || 0, 0), images.length - 1);
  const [activeIndex, setActiveIndex] = useState(start);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fade in header title and arrow - wait for screen to fully render first
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000, // 2 seconds - slow and dramatic
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500); // 500ms delay - let screen render fully first
  }, []);


  const scrollToIndex = (i: number) => {
    flatListRef.current?.scrollToIndex({ index: i, animated: true });
    setActiveIndex(i);
    setScrollEnabled(true);
  };

  const renderItem = ({ item }: { item: string }) => (
    <ZoomableImage uri={item} scrollEnabledSetter={setScrollEnabled} onLoad={() => setLoaded(true)} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} />

      {/* Title with Back Arrow - Overlays on top */}
      <Animated.View
        style={[
          styles.headerTitleContainer,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {itemTitle}
        </Text>
      </Animated.View>

      <View style={styles.container}>
        <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        scrollEnabled={scrollEnabled}
        initialScrollIndex={start}
        renderItem={renderItem}
        keyExtractor={(_, i) => `image-${i}`}
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingTop: 84 }}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 300);
        }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(i);
          setScrollEnabled(true);
        }}
      />

      <View style={styles.dotRow}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === activeIndex ? '#6A0DAD' : '#D6D6D6' },
            ]}
          />
        ))}
        </View>
      </View>
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTitleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 160 : 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  imageWrapper: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width,
    height,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
});

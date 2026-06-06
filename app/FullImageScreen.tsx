import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalFooter from './components/GlobalFooter';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { useTheme } from '@/app/theme/ThemeContext';

const fallbackImage = 'https://via.placeholder.com/300x200.png?text=No+Image+Available';
const PAGE_HEADER_HEIGHT = 48;
const SWIPE_THRESHOLD = 0.25; // fraction of width to trigger page change
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.5 };

// ─── Single zoomable slot ─────────────────────────────────────────────────────

const ZoomableSlot = ({
  uri,
  width,
  height,
  slotOffset,
  onNavigate,
  canGoNext,
  canGoPrev,
}: {
  uri: string;
  width: number;
  height: number;
  slotOffset: number; // -width (prev), 0 (current), +width (next)
  onNavigate: (dir: 1 | -1) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const imgX = useSharedValue(0);
  const imgY = useSharedValue(0);
  const savedImgX = useSharedValue(0);
  const savedImgY = useSharedValue(0);

  // Page-level offset (drives the swipe transition)
  const pageX = useSharedValue(0);

  // Reset zoom/pan when URI changes (slot is reassigned to a new image)
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    imgX.value = 0;
    imgY.value = 0;
    savedImgX.value = 0;
    savedImgY.value = 0;
    pageX.value = 0;
  }, [uri]);

  const triggerPage = (dir: 1 | -1) => {
    // Reset zoom as page slides out
    scale.value = withTiming(1, { duration: 250 });
    savedScale.value = 1;
    imgX.value = withTiming(0, { duration: 250 });
    imgY.value = withTiming(0, { duration: 250 });
    savedImgX.value = 0;
    savedImgY.value = 0;

    // Slide page out then notify parent
    pageX.value = withTiming(
      -dir * width,
      { duration: 280, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          pageX.value = 0;
          runOnJS(onNavigate)(dir);
        }
      }
    );
  };

  // Double-tap: toggle zoom 1 ↔ 2.5
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((e) => {
      if (scale.value > 1) {
        scale.value = withTiming(1, { duration: 220 });
        savedScale.value = 1;
        imgX.value = withTiming(0, { duration: 220 });
        imgY.value = withTiming(0, { duration: 220 });
        savedImgX.value = 0;
        savedImgY.value = 0;
      } else {
        const targetScale = 2.5;
        const cx = width / 2;
        const cy = height / 2;
        const offsetX = (cx - e.x) * (targetScale - 1);
        const offsetY = (cy - e.y) * (targetScale - 1);
        const boundX = ((targetScale - 1) / 2) * width;
        const boundY = ((targetScale - 1) / 2) * height;
        const clampedX = Math.max(-boundX, Math.min(boundX, offsetX));
        const clampedY = Math.max(-boundY, Math.min(boundY, offsetY));
        scale.value = withTiming(targetScale, { duration: 220 });
        savedScale.value = targetScale;
        imgX.value = withTiming(clampedX, { duration: 220 });
        imgY.value = withTiming(clampedY, { duration: 220 });
        savedImgX.value = clampedX;
        savedImgY.value = clampedY;
      }
    });

  // Pinch
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.max(1, Math.min(savedScale.value * e.scale, 4));
      scale.value = next;
    })
    .onEnd(() => {
      if (scale.value < 1.05) {
        scale.value = withTiming(1, { duration: 200 });
        savedScale.value = 1;
        imgX.value = withTiming(0, { duration: 200 });
        imgY.value = withTiming(0, { duration: 200 });
        savedImgX.value = 0;
        savedImgY.value = 0;
      } else {
        savedScale.value = scale.value;
        // Clamp position within new bounds
        const bound = ((scale.value - 1) / 2) * width;
        const clampedX = Math.max(-bound, Math.min(bound, imgX.value));
        imgX.value = withTiming(clampedX, { duration: 150 });
        savedImgX.value = clampedX;
      }
    });

  // Pan: image pan when zoomed, page swipe when at boundary or not zoomed
  const pan = Gesture.Pan()
    .minDistance(4)
    .onUpdate((e) => {
      const zoomed = scale.value > 1.05;

      if (!zoomed) {
        // Pure page swipe
        pageX.value = e.translationX;
        return;
      }

      // Zoomed: move image, bleed excess into page offset
      const bound = ((scale.value - 1) / 2) * width;
      const rawX = savedImgX.value + e.translationX;
      const clampedX = Math.max(-bound, Math.min(bound, rawX));
      imgX.value = clampedX;
      imgY.value = savedImgY.value + e.translationY;

      // Bleed: excess translation beyond bounds drives the page
      const excess = rawX - clampedX;
      if ((excess < 0 && canGoNext) || (excess > 0 && canGoPrev)) {
        pageX.value = excess * 0.5; // damped feel
      }
    })
    .onEnd((e) => {
      const zoomed = scale.value > 1.05;

      if (!zoomed) {
        // Decide page change or snap back
        const velo = e.velocityX;
        const dist = e.translationX;
        const goNext = (dist < -width * SWIPE_THRESHOLD || velo < -600) && canGoNext;
        const goPrev = (dist > width * SWIPE_THRESHOLD || velo > 600) && canGoPrev;

        if (goNext) {
          runOnJS(triggerPage)(1);
        } else if (goPrev) {
          runOnJS(triggerPage)(-1);
        } else {
          pageX.value = withSpring(0, SPRING_CONFIG);
        }
        return;
      }

      // Zoomed: save image position, check if bleed should trigger page
      savedImgX.value = imgX.value;
      savedImgY.value = imgY.value;

      const bound = ((scale.value - 1) / 2) * width;
      const rawX = savedImgX.value + e.translationX;
      const excess = rawX - Math.max(-bound, Math.min(bound, rawX));
      const velo = e.velocityX;

      const goNext = (excess < -width * 0.15 || velo < -800) && canGoNext;
      const goPrev = (excess > width * 0.15 || velo > 800) && canGoPrev;

      if (goNext) {
        runOnJS(triggerPage)(1);
      } else if (goPrev) {
        runOnJS(triggerPage)(-1);
      } else {
        pageX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(pan, pinch),
    doubleTap
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pageX.value + imgX.value },
      { translateY: imgY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { left: slotOffset, right: -slotOffset, backgroundColor: '#000' },
      ]}
    >
      <GestureDetector gesture={composed}>
        <ReanimatedAnimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <Image
            source={{ uri: uri || fallbackImage }}
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            placeholder={require('../assets/goat-icon.png')}
          />
        </ReanimatedAnimated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function FullImageScreen() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  const { mediaArray, index, title } = useLocalSearchParams();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [images] = useState<string[]>(() => {
    try {
      const raw = Array.isArray(mediaArray) ? mediaArray[0] : mediaArray;
      return JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  });

  const itemTitle =
    typeof title === 'string' ? title : Array.isArray(title) ? title[0] : 'Images';

  const start = Math.min(Math.max(Number(index) || 0, 0), images.length - 1);
  const [activeIndex, setActiveIndex] = useState(start);

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerScale, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(headerScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Prefetch adjacent images whenever activeIndex changes
  useEffect(() => {
    const toPrefetch: string[] = [];
    if (images[activeIndex - 1]) toPrefetch.push(images[activeIndex - 1]);
    if (images[activeIndex + 1]) toPrefetch.push(images[activeIndex + 1]);
    toPrefetch.forEach((uri) => Image.prefetch(uri));
  }, [activeIndex, images]);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      setActiveIndex((prev) => Math.min(Math.max(prev + dir, 0), images.length - 1));
    },
    [images.length]
  );

  // Derive the 3 slot URIs from activeIndex
  const prevUri = images[activeIndex - 1] ?? '';
  const currUri = images[activeIndex] ?? '';
  const nextUri = images[activeIndex + 1] ?? '';

  const galleryMarginTop = isLandscape
    ? insets.top + PAGE_HEADER_HEIGHT
    : HEADER_MAX_HEIGHT + PAGE_HEADER_HEIGHT;

  const galleryHeight = height - galleryMarginTop;

  const pageHeaderTop = isLandscape ? insets.top : HEADER_MAX_HEIGHT - 10;
  const pageHeaderPaddingLeft = 16 + (isLandscape ? insets.left : 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {!isLandscape && (
        <View style={{ zIndex: 1, elevation: 1 }}>
          <EnhancedHeader scrollY={scrollY} />
        </View>
      )}

      {/* 3-slot gallery */}
      <View style={[styles.galleryContainer, { marginTop: galleryMarginTop, width }]}>
        {/* Prev slot */}
        {prevUri ? (
          <ZoomableSlot
            key={`prev-${activeIndex}`}
            uri={prevUri}
            width={width}
            height={galleryHeight}
            slotOffset={-width}
            onNavigate={navigate}
            canGoNext={activeIndex < images.length - 1}
            canGoPrev={activeIndex > 0}
          />
        ) : null}

        {/* Current slot */}
        <ZoomableSlot
          key={`curr-${activeIndex}`}
          uri={currUri}
          width={width}
          height={galleryHeight}
          slotOffset={0}
          onNavigate={navigate}
          canGoNext={activeIndex < images.length - 1}
          canGoPrev={activeIndex > 0}
        />

        {/* Next slot */}
        {nextUri ? (
          <ZoomableSlot
            key={`next-${activeIndex}`}
            uri={nextUri}
            width={width}
            height={galleryHeight}
            slotOffset={width}
            onNavigate={navigate}
            canGoNext={activeIndex < images.length - 1}
            canGoPrev={activeIndex > 0}
          />
        ) : null}

        {/* Dot indicators */}
        <View style={[styles.dotRow, { bottom: isLandscape ? 8 : 60 }]}>
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

      {!isLandscape && <GlobalFooter />}

      {/* Page header — absolutely pinned */}
      <Animated.View
        style={[
          styles.pageHeaderRow,
          {
            top: pageHeaderTop,
            paddingLeft: pageHeaderPaddingLeft,
            backgroundColor: '#000',
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#B794F4' : '#6A0DAD'} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: '#FFF' }]} numberOfLines={1}>
          {itemTitle}
        </Text>
        <Text style={[styles.counter, { color: '#999' }]}>
          {activeIndex + 1} / {images.length}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeaderRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 12,
    paddingBottom: 6,
    height: PAGE_HEADER_HEIGHT,
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
  counter: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  galleryContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
});

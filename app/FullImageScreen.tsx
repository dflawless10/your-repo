import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import { Image } from 'expo-image';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import React from "react";


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
        <Animated.View style={animatedStyle}>
          <Image
            source={{ uri: uri || fallbackImage }}
            style={styles.image}
            contentFit="contain"
            placeholder={require('./components/assets/placeholder.svg.png')}
            onLoad={onLoad}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default function FullImageScreen() {
  const { mediaArray, index } = useLocalSearchParams();
  const router = useRouter();

  let images: string[] = [];
  try {
    const rawMediaArray = Array.isArray(mediaArray) ? mediaArray[0] : mediaArray;
    images = JSON.parse(rawMediaArray || '[]');
  } catch (err) {
    console.warn('Failed to parse mediaArray:', err);
  }

  const start = Math.min(Math.max(Number(index) || 0, 0), images.length - 1);
  const [activeIndex, setActiveIndex] = useState(start);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [loaded, setLoaded] = useState(false);


  const scrollToIndex = (i: number) => {
    flatListRef.current?.scrollToIndex({ index: i, animated: true });
    setActiveIndex(i);
    setScrollEnabled(true);
  };

  const renderItem = ({ item }: { item: string }) => (
    <ZoomableImage uri={item} scrollEnabledSetter={setScrollEnabled} onLoad={() => setLoaded(true)} />
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

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

      <Text style={styles.indexText}>
        {activeIndex + 1} / {images.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  backText: {
    color: '#2d3748',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  indexText: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: '#2d3748',
    fontSize: 16,
    fontWeight: '600',
  },
});

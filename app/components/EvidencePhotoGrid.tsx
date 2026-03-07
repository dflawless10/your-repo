import React, { useRef, useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Animated } from "react-native";

interface EvidenceGridProps {
  photos: string[];
  onOpen: (index: number) => void;
}

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({ photos, onOpen }) => {
  // 🐐 Goat animation state
  const [goatIndex, setGoatIndex] = useState<number | null>(null);
  const goatAnim = useRef(new Animated.Value(0)).current;

  // 🐐 Bounce animation for tap
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 🐐 Peek-a-boo animation
  const triggerShowGoat = (index: number) => {
    setGoatIndex(index);
    goatAnim.setValue(0);

    Animated.sequence([
      Animated.timing(goatAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(goatAnim, {
        toValue: 0,
        duration: 180,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setGoatIndex(null);
    });
  };
console.log("PHOTOS:", photos);
console.log("FIRST PHOTO:", photos[0]);

  return (
    <View>
      {/* Debug image */}
      {photos.length > 0 && (
        <Image
          source={{ uri: photos[0] }}
          style={{
            width: 300,
            height: 300,
            resizeMode: "cover",
            marginBottom: 20,
          }}
          fadeDuration={0}
        />
      )}

      {/* Actual grid */}
      <View style={styles.grid}>
        {photos.map((uri, index) => (
          <Animated.View key={index} style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              onPress={() => {
                bounce();
                onOpen(index);
              }}
              onLongPress={() => triggerShowGoat(index)}
              activeOpacity={0.85}
              style={styles.item}
            >
              <Image source={{ uri }} style={styles.thumb} />
            </TouchableOpacity>

            {goatIndex === index && (
              <Animated.Image
                source={require("app/components/assets/goat-peek.png")}
                style={[
                  styles.goatPeek,
                  {
                    opacity: goatAnim,
                    transform: [
                      {
                        translateY: goatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                      {
                        rotate: goatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["-10deg", "10deg"],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  item: {
    margin: 6,
  },
  goatPeek: {
    position: "absolute",
    width: 60,
    height: 60,
    top: -10,
    right: -10,
    zIndex: 20,
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#eee",
    resizeMode: "cover",
  },
});

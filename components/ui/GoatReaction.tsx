// components/ui/GoatReaction.tsx
import React, { useRef, useEffect } from "react";
import { Animated, Image, Text, View } from "react-native";
import { playGoatSound } from "./GoatSound"; // Adjust path as needed
import styles from "./goatStyles"; // Your goat-specific styles

const GoatReaction = ({ trigger }: { trigger: boolean }) => {
  const goatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      playGoatSound();
      goatAnim.setValue(0);
      Animated.timing(goatAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [trigger]);

  const opacity = goatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const scale = goatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] });
  const translateY = goatAnim.interpolate({ inputRange: [0, 1], outputRange: [50, -10] });

  return (
    <View style={styles.container}>
      <Animated.View style={{
        opacity,
        transform: [{ scale }, { translateY }],
        position: 'absolute',
        top: 20,
        left: '40%',
      }}>
        <Image source={require("./goat.png")} style={styles.image} />
        <Text style={styles.caption}>Bahahaha! 🐐</Text>
      </Animated.View>
    </View>
  );
};

export default GoatReaction;


import { ThemeProvider } from './/theme/ThemeContext';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {AuthProvider} from "@/hooks/AuthContext";
import {Navigator} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {useFonts} from "expo-font"; // ✅ Just once
import React from 'react';
import 'react-native-paper';
import {NavigationContainer} from "@react-navigation/native";
import TabNavigator from "@/app/(tabs)/navigation";
import Slot = Navigator.Slot;


interface BaseColors {
  primary: string;
  background: string;
  // other default colors...
}

interface Theme {
  colors: BaseColors & {
    brandPrimary: string;
    goatSparkle: string;
  };
  theme: 'light' | 'dark';
}


export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
  <ThemeProvider>
    <AuthProvider>
      <StatusBar style="auto" />
      <Slot />
    </AuthProvider>
  </ThemeProvider>
</GestureHandlerRootView>

  );
}

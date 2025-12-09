import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeDashboard from '../../onboarding/WelcomeDashboard';
import React from 'react';


const NativeStack = createNativeStackNavigator();

const OnboardingNavigator = () => (
  <NativeStack.Navigator>
    <NativeStack.Screen name="Welcome" component={WelcomeDashboard} />
  </NativeStack.Navigator>
);

export default OnboardingNavigator;
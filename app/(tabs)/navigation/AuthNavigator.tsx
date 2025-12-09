import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../../login';     // ✅ matches C:\BidGoatOfficial\BidGoatMobile\app1\login.tsx
import RegisterScreen from '../../register'; // ✅ matches C:\BidGoatOfficial\BidGoatMobile\app1\register.tsx
import React from 'react';


const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getUserProfile, loginUser } from "@/api/auth";
import { useSession } from '@/ctx';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {useAuth} from "@/hooks/AuthContext"; // already imported

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const goatAnim = useRef(new Animated.Value(0)).current;
 const [showPassword, setShowPassword] = useState(false);


  const triggerGoatBounce = () => {
    Animated.sequence([
      Animated.timing(goatAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(goatAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const token = await loginUser(email.trim(), password.trim());

      if (token) {
        await AsyncStorage.setItem('email', email.trim());

        const userProfile = await getUserProfile(token);
        if (userProfile?.username) {
          // Use AuthContext login to schedule token refresh
          await authLogin(token, userProfile.username);

          // Save userId to AsyncStorage
          if (userProfile.id) {
            await AsyncStorage.setItem('userId', userProfile.id.toString());
            console.log('🐐 UserId saved:', userProfile.id);
          }

          // Save avatar_url to AsyncStorage if available
          if (userProfile.avatar_url) {
            await AsyncStorage.setItem('avatar_url', userProfile.avatar_url);
            console.log('🐐 Avatar saved:', userProfile.avatar_url);
          }

          console.log('🐐 Login successful, token refresh scheduled');
        }

        triggerGoatBounce(); // 🐐 Ritual bounce
        setTimeout(() => {
          router.replace('/(tabs)/JewelryBoxScreen');
        }, 600);
      } else {
        Alert.alert(
          'Login Failed',
          'Please check your email and password.',
          [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        'An error occurred during login. Please try again.',
        [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/register');
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('//sign-in');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.Image
          source={require('@/assets/goat-stamp.png')}
          style={[
            styles.goatStamp,
            {
              transform: [{
                scale: goatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                })
              }]
            }
          ]}
        />

        <Text style={styles.title}>Welcome to BidGoat 🐐</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    placeholder="Password"
    secureTextEntry={!showPassword}
    value={password}
    onChangeText={setPassword}
  />
  <Text onPress={() => setShowPassword(prev => !prev)} style={styles.toggle}>
    {showPassword ? '🙈 Hide' : '👁️ Show'}
  </Text>
</View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!email || !password || loading) && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={!email || !password || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  goatStamp: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  signUpButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#bfae82',
  backgroundColor: '#fffef8',
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginBottom: 16,
  borderRadius: 12,
},
passwordInput: {
  flex: 1,
  fontSize: 16,
  paddingVertical: 8,
},
toggle: {
  marginLeft: 12,
  color: '#007aff',
  fontWeight: '500',
}

});

export default LoginScreen;

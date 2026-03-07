import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getUserProfile, loginUser } from "@/api/auth";
import { useSession } from '@/ctx';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "@/hooks/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const scrollViewRef = useRef<ScrollView>(null);
  const goatAnim = useRef(new Animated.Value(0)).current;
  const stampRotate = useRef(new Animated.Value(0)).current;
  const stampScale = useRef(new Animated.Value(1)).current;

  // Subtle idle animation for the goat stamp
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(stampRotate, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(stampScale, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(stampRotate, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(stampScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

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
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

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

          // Save full profile to AsyncStorage (including is_admin)
          await AsyncStorage.setItem('profile', JSON.stringify(userProfile));
          console.log('🐐 Profile saved:', userProfile);

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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          router.replace('/(tabs)/');
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
    Alert.alert(
      'Reset Password',
      'Password reset functionality coming soon! Please contact support for assistance.',
      [{ text: 'OK' }]
    );
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Auto-scroll when email is entered (@ symbol typically means they're done typing)
    if (text.includes('@') && text.length > 5) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 200, animated: true });
      }, 300);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#4CAF50', '#6A0DAD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animated.Image
            source={require('@/assets/goat-stamp.png')}
            style={[
              styles.goatStamp,
              {
                transform: [
                  {
                    scale: Animated.multiply(
                      stampScale,
                      goatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      })
                    ),
                  },
                  {
                    rotate: stampRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-5deg', '5deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your intelligent auction journey
          </Text>
        </LinearGradient>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={handleEmailChange}
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(prev => !prev)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Sign In</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FFF', '#FFF']}
              style={styles.signUpGradient}
            >
              <Ionicons name="person-add" size={20} color="#8B5CF6" />
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Why BidGoat Link */}
          <View style={styles.whyBidGoatContainer}>
            <Text style={styles.whyBidGoatText}>New to BidGoat? </Text>
            <TouchableOpacity onPress={() => router.push('/landing')}>
              <Text style={styles.whyBidGoatLink}>Learn Why We're Different</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  goatStamp: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  formContainer: {
    padding: 24,
    paddingTop: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 14,
  },
  signUpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  signUpGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  signUpButtonText: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: '700',
  },
  whyBidGoatContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  whyBidGoatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  whyBidGoatLink: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '700',
  },
});

export default LoginScreen;

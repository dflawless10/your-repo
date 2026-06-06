import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { registerUser } from '@/api/auth';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get('window');

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const goatAnim = useRef(new Animated.Value(0)).current;
  const stampRotate = useRef(new Animated.Value(0)).current;
  const stampScale = useRef(new Animated.Value(1)).current;

  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleRegister = async () => {
    if (!email || !password || !username || !firstname || !lastname) {
      Alert.alert('Missing Information', 'All fields are required to create your account.');
      return;
    }

     triggerGoatBounce(); // 🐐 Ritual bounce
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

     // Username validation
    if (username.length < 3) {
      Alert.alert('Username Too Short', 'Username must be at least 3 characters long.');
      return;
    }
    if (username.length > 20) {
      Alert.alert('Username Too Long', 'Username must be 20 characters or less.');
      return;
    }

    // Password strength check
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      const result = await registerUser({
        email,
        password,
        username,
        firstname,
        lastname
      });

      if (result === 'OK') {
        Alert.alert(
          '✨ Welcome to BidGoat!',
          'Check your email for the verification code to complete your registration.',
          [
            {
              text: 'Continue',
              onPress: () => router.push({
                pathname: '/verify-code',
                params: { email: email.trim().toLowerCase(), username }
              })
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', 'Please check your information and try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
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
                   <Text style={styles.title}>Welcome Register!</Text>
          <Text style={styles.subtitle}>
            Register to begin your intelligent auction journey
          </Text>
        </LinearGradient>


        {/* Form Section */}
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              value={firstname}
              onChangeText={setFirstname}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              value={lastname}
              onChangeText={setLastname}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="at-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username (max 20 characters)"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              maxLength={20}
            />
          </View>
          {username.length >= 18 && (
            <Text style={styles.charCountWarning}>
              {20 - username.length} characters remaining
            </Text>
          )}

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
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

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureText}>AI-powered bidding strategies</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureText}>Real-time market intelligence</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureText}>Personalized recommendations</Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <Text style={styles.buttonText}>Creating Account...</Text>
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Create Account</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-in')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms Enforcement */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsHeader}>🐐 One Identity Policy</Text>
            <Text style={styles.termsText}>
              By creating an account, you agree to maintain only ONE identity on BidGoat.
              Multiple accounts are strictly prohibited and will result in immediate suspension.
            </Text>
            <Text style={styles.termsSubtext}>
              You also agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 70,
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
  featuresList: {
    marginVertical: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signInText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 15,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  termsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  termsHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  termsSubtext: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  charCountWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
    paddingRight: 4,
    fontWeight: '600',
  },
});

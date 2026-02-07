import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { completeUserProfile } from '@/api/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function CompleteProfile() {
  const { email: emailParam } = useLocalSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('USA');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolveEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      if (storedEmail) {
        setEmail(storedEmail.trim().toLowerCase());
      } else {
        Alert.alert('Missing Email', 'Please restart the registration flow.');
        router.replace('/');
      }
    };

    resolveEmail();
  }, []);

  const handleCompleteProfile = async () => {
    // Validate all fields
    if (
      !email ||
      !firstname ||
      !lastname ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !country ||
      !username
    ) {
      Alert.alert('Missing Information', 'All fields are required to complete your profile.');
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (10+ digits).');
      return;
    }

    // ZIP validation (basic)
    if (zip.length < 5) {
      Alert.alert('Invalid ZIP', 'Please enter a valid ZIP code.');
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting profile for:', email);

      const result = await completeUserProfile({
        email,
        firstname,
        lastname,
        username,
        phone,
        address,
        city,
        state,
        zip,
        country
      });

      if (result === 'OK') {
        Alert.alert(
          '🎉 Welcome to BidGoat!',
          'Your profile is complete. Start exploring intelligent auctions!',
          [
            {
              text: 'Get Started',
              onPress: () => router.replace('/(tabs)/profile')
            }
          ]
        );
      } else {
        Alert.alert('Failed', 'Could not complete profile. Please try again.');
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#8B5CF6', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.goatEmoji}>🎯</Text>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Just a few more details to get started
          </Text>
        </LinearGradient>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.progressTextComplete}>Email Verified</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressCircleActive}>
                <Text style={styles.progressNumber}>2</Text>
              </View>
              <Text style={styles.progressTextActive}>Complete Profile</Text>
            </View>
          </View>

          {/* Personal Information */}
          <Text style={styles.sectionTitle}>Personal Information</Text>

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
              placeholder="Username"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Shipping Address */}
          <Text style={styles.sectionTitle}>Shipping Address</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="home-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Street Address"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrapper, styles.inputHalf]}>
              <Ionicons name="business-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={[styles.inputWrapper, styles.inputHalf]}>
              <Ionicons name="map-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrapper, styles.inputHalf]}>
              <Ionicons name="mail-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ZIP Code"
                placeholderTextColor="#9CA3AF"
                value={zip}
                onChangeText={setZip}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={[styles.inputWrapper, styles.inputHalf]}>
              <Ionicons name="globe-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor="#9CA3AF"
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Your information is secure and only used for shipping and payment verification
            </Text>
          </View>

          {/* Complete Profile Button */}
          <TouchableOpacity
            style={[styles.completeButton, loading && styles.buttonDisabled]}
            onPress={handleCompleteProfile}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <Text style={styles.buttonText}>Completing Profile...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Complete Profile</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  goatEmoji: {
    fontSize: 64,
    marginBottom: 12,
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
  },
  formContainer: {
    padding: 24,
    paddingTop: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: 'center',
    gap: 8,
  },
  progressCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  progressTextComplete: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  progressTextActive: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginVertical: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  completeButton: {
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
});

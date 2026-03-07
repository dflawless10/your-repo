import React, { useEffect, useState, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/config';
import { validateContentQuick } from 'app/utils/contentModeration';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { useTheme } from 'app/theme/ThemeContext';

function EditProfileScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    avatar_url: null,
    created_at: '',
  });

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      // Just set the local preview - don't upload yet
      setAvatarUrl(uri);
    }
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    // Content Moderation
    const usernameModeration = validateContentQuick(username, 'Username');
    if (!usernameModeration.isValid) {
      Alert.alert('Content Policy Violation', usernameModeration.errorMessage);
      return;
    }

    try {
      setSaving(true);

      // Step 1: Upload avatar first if a new one was selected
      if (avatarUrl && avatarUrl.startsWith('file://')) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatarUrl,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);

        const avatarRes = await fetch(`${API_BASE_URL}/api/upload-avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!avatarRes.ok) {
          Alert.alert('Error', 'Failed to upload avatar');
          setSaving(false);
          return;
        }

        const avatarData = await avatarRes.json();
        // Update AsyncStorage with new avatar URL
        await AsyncStorage.setItem('avatar_url', avatarData.avatar_url);
      }

      // Step 2: Update profile text fields
      const updateData: any = {
        username,
        firstname,
        lastname,
        phone,
        address,
        city,
        state,
        zip,
      };

      if (password) {
        updateData.password = password;
      }

      const res = await fetch(`${API_BASE_URL}/api/update-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        Alert.alert('✅ Success', 'Your profile has been updated!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/user-profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setUsername(data.username || '');
        setEmail(data.email || '');
        setFirstname(data.firstname || '');
        setLastname(data.lastname || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setZip(data.zip || '');
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    };

    void fetchProfile();
  }, []);

  useEffect(() => {
    // Fade in header title and arrow
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  }, []);

  const isValidDate =
    !!profile.created_at && !isNaN(Date.parse(profile.created_at));

  const isDark = theme === 'dark';
  let arrowColor = isDark ? '#ECEDEE' : '#333';
  const titleColor = isDark ? '#ECEDEE' : '#1A202C';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />
      <Animated.ScrollView
        style={[styles.scrollContainer, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MAX_HEIGHT + 20 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.pageHeader, { backgroundColor: colors.surface, opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#B794F4"  />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: titleColor }]}>Edit Profile</Text>
        </Animated.View>

      {/* Avatar Section */}
      <View style={[styles.avatarSection, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.avatarLabel, { color: colors.textSecondary }]}>Tap to change photo</Text>
        {isValidDate && (
          <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
            Member since {format(new Date(profile.created_at), 'MMM yyyy')}
          </Text>
        )}
      </View>

      {/* Account Information */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Information</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
          <TextInput
            placeholder="Username"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={username}
            onChangeText={setUsername}
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={email}
            editable={false}
            style={[styles.input, styles.inputDisabled, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#666' : '#999', borderColor: isDark ? '#333' : '#ddd' }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>New Password (leave blank to keep current)</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Personal Information */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Personal Information</Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
            <TextInput
              placeholder="First Name"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={firstname}
              onChangeText={setFirstname}
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name</Text>
            <TextInput
              placeholder="Last Name"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={lastname}
              onChangeText={setLastname}
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Shipping Address */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address</Text>
          <TextInput
            placeholder="Street Address"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={address}
            onChangeText={setAddress}
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
          <TextInput
            placeholder="City"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={city}
            onChangeText={setCity}
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>State</Text>
            <TextInput
              placeholder="State"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={state}
              onChangeText={setState}
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>ZIP Code</Text>
            <TextInput
              placeholder="ZIP"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={zip}
              onChangeText={setZip}
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: isDark ? '#333' : '#ddd' }]}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 100 }} />

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6A0DAD',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6A0DAD',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6A0DAD',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  memberSince: {
    marginTop: 6,
    fontSize: 13,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#6A0DAD',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default EditProfileScreen;


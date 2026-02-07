import { API_BASE_URL } from '@/config';

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Button,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../theme/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
import { getUserProfile, logoutUser } from '@/api/auth';
import { User } from '@/types';
import { Link, router, useFocusEffect } from 'expo-router';
import { playGoatSoundByName } from '@/assets/sounds/officialGoatSoundsSoundtrack';
import { useCallback } from 'react';

type MascotMood =
  | 'Celebrate'
  | 'Mischievous'
  | 'Joyful'
  | 'Grumpy'
  | 'Sad'
  | 'Curious'
  | 'Sleepy'
  | 'Chaotic';

type AvatarResponse = {
  avatar_url?: string;
  username?: string;
  email?: string;
  error?: string;
};

export default function ProfileScreen() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const themedStyles = getThemedStyles(isDarkMode);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [mascotMood, setMascotMood] = useState<MascotMood>('Mischievous');
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const data = await getUserProfile(token);
      if (data) {
        setUser(data);
        setProfileImage(data.avatar_url ?? null);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // Re-fetch profile when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      void fetchProfile();
    }, [fetchProfile])
  );

  const uploadProfileImage = async (uri: string) => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    const formData = new FormData();
    formData.append('avatar', {
      uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const res = await fetch('http://10.0.0.170:5000/api/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        const data: AvatarResponse = await res.json();
        setProfileImage(data.avatar_url ?? null);
      } else {
        console.warn('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await uploadProfileImage(uri);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '🐐 Logout',
      'You are about to log out of BidGoat Mobile. Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Play goat sound (don't await - let it play in background)
              playGoatSoundByName('Victory Baa');

              // Show thank you message
              Alert.alert(
                '🐐 Thank You!',
                'Thank you for being a loyal BidGoat user! See you soon! 🎉',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      try {
                        await logoutUser();
                      } catch (error) {
                        console.error('Logout failed:', error);
                        Alert.alert('Error', 'Failed to logout. Please try again.');
                      }
                    },
                  },
                ],
                { cancelable: false }
              );
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader
        scrollY={scrollY}
        username={user?.username ?? ''}
        avatarUrl={profileImage}
      />
      <Animated.ScrollView
        style={themedStyles.container}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Text style={themedStyles.title}>
          {user ? `BidGoat Welcomes ${user.username}! 🐐` : 'Loading profile...'}
        </Text>

        <TouchableOpacity onPress={pickImage} style={themedStyles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={themedStyles.profileImage} />
          ) : (
            <Text style={themedStyles.imagePlaceholder}>
              📸 Tap to upload profile picture
            </Text>
          )}
        </TouchableOpacity>

        {user && (
          <>
            <Text style={themedStyles.section}>✨ Account Info</Text>
            <ProfileItem label="Username" value={user.username} isDarkMode={isDarkMode} />
            <ProfileItem label="Email" value={user.email} isDarkMode={isDarkMode} />
            <ProfileItem label="Name" value={`${user.firstname} ${user.lastname}`} isDarkMode={isDarkMode} />

            <Link href="/(tabs)/editProfile" style={themedStyles.linkContainer}>
              <Text style={themedStyles.link}>✏️ Edit Profile Info</Text>
            </Link>

            <Text style={themedStyles.section}>🔗 Quick Links</Text>
            <View style={themedStyles.preferenceRow}>
              <Text style={themedStyles.item}>Recent Logins</Text>
              <TouchableOpacity onPress={() => router.push('/login-history')}>
                <Text style={themedStyles.link}>View →</Text>
              </TouchableOpacity>
            </View>

            <Link href="/seller/dashboard" style={themedStyles.linkContainer}>
              <Text style={themedStyles.link}>Go to My Vault →</Text>
            </Link>

            <Text style={themedStyles.section}>🎨 Preferences</Text>
            <View style={themedStyles.preferenceRow}>
              <Text style={themedStyles.item}>
                {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                thumbColor={isDarkMode ? '#6A0DAD' : '#F3F4F6'}
                trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
            <ProfileItem label="Notifications" value="Enabled" isDarkMode={isDarkMode} />

            <Text style={themedStyles.section}>🐐 Mascot Mood</Text>
            <View style={themedStyles.pickerContainer}>
              <Picker
                selectedValue={mascotMood}
                style={[themedStyles.picker, { color: isDarkMode ? '#ECEDEE' : '#1A1A1A' }]}
                itemStyle={themedStyles.pickerItem}
                onValueChange={(value: MascotMood) => setMascotMood(value)}
                dropdownIconColor={isDarkMode ? '#ECEDEE' : '#1A1A1A'}
              >
                <Picker.Item label="🎉 Celebrate" value="Celebrate" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
                <Picker.Item label="😈 Mischievous" value="Mischievous" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
                <Picker.Item label="😊 Joyful" value="Joyful" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
                <Picker.Item label="😠 Grumpy" value="Grumpy" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
                <Picker.Item label="😢 Sad" value="Sad" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
                <Picker.Item label="🤔 Curious" value="Curious" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
                <Picker.Item label="😴 Sleepy" value="Sleepy" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
                <Picker.Item label="🤪 Chaotic" value="Chaotic" color={isDarkMode ? '#ECEDEE' : '#1A1A1A'} />
              </Picker>
            </View>

            <View style={themedStyles.logoutButtonContainer}>
              <Button
                title="Logout"
                onPress={handleLogout}
                color="#ff3b30"
              />
            </View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function ProfileItem({ label, value, isDarkMode }: Readonly<{ label: string; value: string; isDarkMode: boolean }>) {
  return (
    <Text style={{ fontSize: 16, marginBottom: 4, color: isDarkMode ? '#fff' : '#000' }}>
      • {label}: {value}
    </Text>
  );
}

function getThemedStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? '#000' : '#fff',
      padding: 20,
    },
    title: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 12,
      textAlign: 'center',
    },
    section: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 8,
      color: isDarkMode ? '#fff' : '#000',
    },
    item: {
      fontSize: 16,
      marginBottom: 4,
      color: isDarkMode ? '#fff' : '#000',
    },
    preferenceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 8,
    },
    pickerContainer: {
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#E0E0E0',
      borderRadius: 8,
      justifyContent: 'center',
      height: 56,
    },
    picker: {
      height: Platform.OS === 'ios' ? 180 : 56,
      width: '100%',
      fontSize: 16,
      color: isDarkMode ? '#ECEDEE' : '#1A1A1A',
    },
    pickerItem: {
      height: Platform.OS === 'ios' ? 180 : 56,
      fontSize: 16,
      color: isDarkMode ? '#ECEDEE' : '#1A1A1A',
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    imagePlaceholder: {
      fontSize: 16,
      color: isDarkMode ? '#aaa' : '#555',
      padding: 20,
      textAlign: 'center',
    },
    linkContainer: {
      marginVertical: 8,
    },
    link: {
      fontSize: 16,
      color: '#007AFF',
      textDecorationLine: 'none',
    },
    logoutButtonContainer: {
      marginTop: 24,
      marginBottom: 16,
      paddingHorizontal: 20,
    },
  });
}

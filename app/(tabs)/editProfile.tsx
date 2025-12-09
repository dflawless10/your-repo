import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Button,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/config';
import { validateContentQuick } from 'app/utils/contentModeration';

function EditProfileScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState({
    username: '',
    email: '',
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
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    // Content Moderation
    const usernameModeration = validateContentQuick(username, 'Username');
    if (!usernameModeration.isValid) {
      Alert.alert('Content Policy Violation', usernameModeration.errorMessage!);
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/user-profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        firstname: 'Michael',
        lastname: 'The Goat',
        avatar_url: avatarUrl,
      }),
    });

    if (res.ok) {
      Alert.alert('Profile Updated', 'Your changes have been saved!');
    } else {
      const msg = await res.text();
      Alert.alert('Error', msg);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

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
        setAvatarUrl(data.avatar_url || null);
      }
    };

    void fetchProfile();
  }, []);

  const isValidDate =
    !!profile.created_at && !isNaN(Date.parse(profile.created_at));

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarPreview} />
      ) : (
        <Text style={styles.helperText}>📸 No avatar selected yet.</Text>
      )}

      <Button title="Pick Profile Photo" onPress={handleImagePick} />
      <Button title="Save Changes" onPress={handleSubmit} />

      <Text style={styles.metaText}>
        🗓️ Member since:{' '}
        {isValidDate
          ? format(new Date(profile.created_at), 'PPP')
          : 'Unknown'}
      </Text>

      <Link href="/(tabs)/profile">
        <Text style={styles.link}>← Back to Profile</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
    width: '100%',
    fontSize: 16,
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 16,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginVertical: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default EditProfileScreen;


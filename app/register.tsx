import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { registerUser } from '@/api/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [loading, setLoading] = useState(false);
 const [showPassword, setShowPassword] = useState(false);


  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !username || !firstname || !lastname) {
      Alert.alert('🐐 Oracle Warning', 'All fields must be filled to join the herd.');
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
        Alert.alert('✨ Success!', 'Check your email for the sacred verification code.');
        router.push({
  pathname: '/verify-code',
  params: { email: email.trim().toLowerCase(), username }
});

      } else {
        Alert.alert('🛑 Registration Failed', 'Please check your info and try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      Alert.alert('⚠️ Error', 'Something went wrong during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/goat-stamp.png')}
        style={styles.stamp}
        resizeMode="contain"
      />
      <Text style={styles.title}>Create a BidGoat Account 🐐</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstname}
        onChangeText={setFirstname}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastname}
        onChangeText={setLastname}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
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
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.buttonText}>Join the Herd</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff8e1'
  },
  stamp: {
  width: 120,
  height: 120,
  alignSelf: 'center',
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#3e3e3e'
  },
  input: {
    borderWidth: 1,
    borderColor: '#bfae82',
    backgroundColor: '#fffef8',
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    fontSize: 16
  },
  button: {
    backgroundColor: '#4b3f72',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginBottom: 16,
  borderRadius: 8,
},
passwordInput: {
  flex: 1,
  fontSize: 16,
},
toggle: {
  marginLeft: 12,
  color: '#007aff',
  fontWeight: '500',
}

});

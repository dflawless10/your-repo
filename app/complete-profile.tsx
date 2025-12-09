import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { completeUserProfile } from '@/api/auth';

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
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

 useEffect(() => {
  const resolveEmail = async () => {
    const storedEmail = await AsyncStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail.trim().toLowerCase());
    } else {
      Alert.alert('⚠️ Missing Email', 'Please restart the registration flow.');
      router.replace('/');
    }
  };

  resolveEmail();
}, []);



  const handleCompleteProfile = async () => {
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
      Alert.alert('🐐 Oracle Warning', 'All fields must be filled to complete your profile.');
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
        Alert.alert('🎉 Profile Complete!', 'Welcome to the barnyard.');
        router.push('/api/myauctionscreen');
      } else {
        Alert.alert('🛑 Failed', 'Could not complete profile.');
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      Alert.alert('⚠️ Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile 🐐</Text>

      <TextInput style={styles.input} placeholder="First Name" value={firstname} onChangeText={setFirstname} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastname} onChangeText={setLastname} />
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState} />
      <TextInput style={styles.input} placeholder="ZIP Code" value={zip} onChangeText={setZip} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCompleteProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Finish Registration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff8e1',
    flexGrow: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#bfae82',
    backgroundColor: '#fffef8',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    fontSize: 16
  },
  button: {
    backgroundColor: '#4b3f72',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

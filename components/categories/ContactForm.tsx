import React, { useState } from 'react';
import {
  View, TextInput, Button, StyleSheet, Alert,
} from 'react-native';

const API_URL = 'http://10.0.0.170:5000';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert('Incomplete', 'Please fill out all fields.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Message Sent', 'We’ll be in touch soon!');
        setName(''); setEmail(''); setMessage('');
      } else {
        Alert.alert('Error', data.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Contact error:', err);
      Alert.alert('Network Error', 'Unable to reach support.');
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="How can we help?"
        value={message}
        onChangeText={setMessage}
        multiline
        style={[styles.input, { height: 100 }]}
      />
      <Button title="Send Message" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});

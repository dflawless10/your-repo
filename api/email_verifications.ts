import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config';

export async function registerUser(userData: {
  email: string;
  password: string;
  username: string;
  firstname: string;
  lastname: string;
}) {
  try {
    console.log("📦 Registering user with payload:", userData);

    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Registration failed:', errorText);
      return 'FAIL';
    }

    // 🐐 Persist email for later use (e.g. profile completion)
    await AsyncStorage.setItem('email', userData.email.trim().toLowerCase());



    return 'OK';
  } catch (err) {
    console.error('API registration error:', err);
    return 'FAIL';
  }
}

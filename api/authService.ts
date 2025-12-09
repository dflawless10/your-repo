// api/authService.ts
import { LoginRecord } from '@/types/Auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeApiRequest } from '@/api/auth'; // or wherever it's defined


const API_URL='http://10.0.0.170:5000'


export const getLoginHistory = async (): Promise<LoginRecord[]> => {
  const token = await AsyncStorage.getItem("jwtToken");
  const result = await makeApiRequest("/api/login-history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!result || !result.response.ok)
    throw new Error("Failed to fetch login history");

  return result.data.history ?? [];
};



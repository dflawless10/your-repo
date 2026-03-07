import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Platform } from "react-native";
import { API_BASE_URL } from "@/config";
import { Listing } from "@/components/categories/SearchScreen";
import { User, LoginRecord, RegisterPayload } from "@/types/Auth";
import { AuctionItem } from "@/types/items";

export async function completeUserProfile(payload: {
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}) {

  try {
    const storedEmail = await AsyncStorage.getItem("email");
    const email = storedEmail?.trim().toLowerCase();

    if (!email) {
      console.error("❌ Missing verified email in AsyncStorage");
      return "FAIL";
    }

    const fullPayload = { ...payload, email };
    console.log("📦 Sending profile payload:", fullPayload);

    const res = await fetch(`${API_BASE_URL}/api/complete_profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Profile completion failed:", errorText);
      return "FAIL";
    }

    const data = await res.json();

    // Save JWT token and username returned from backend
    if (data.token) {
      await AsyncStorage.setItem("jwtToken", data.token);
      await AsyncStorage.setItem("username", data.username);
      console.log("✅ Token saved after profile completion");
    }

    return "OK";
  } catch (err) {
    console.error("Error completing profile:", err);
    return "ERROR";
  }
}



export const makeApiRequest = async (
  endpoint: string,
  options: RequestInit
): Promise<{ response: Response; data: any } | null> => {
  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`🐐 API Request to: ${fullUrl}`);
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      console.warn("🐐 Token expired (401) — clearing auth and redirecting to sign-in");
      await AsyncStorage.multiRemove(['jwtToken', 'authToken', 'username', 'userEmail', 'isSeller', 'userId', 'pushToken']);
      router.replace("/sign-in");
      return null;
    }

    return { response, data };
  } catch (error) {
    console.error(`API request failed (${endpoint}):`, error);
    throw error;
  }
};

export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error("Server connection check failed:", error);
    return false;
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<string | null> => {
  try {
    const result = await makeApiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!result) return null;

    const { data } = result;

    if (data.token) {
      await Promise.all([
        AsyncStorage.setItem("jwtToken", data.token),
        AsyncStorage.setItem("username", data.username),

      ]);
    }

    return data.token ?? null;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};

export const verifyUser = async (
  email: string,
  code: string
): Promise<boolean> => {
  try {
    const result = await makeApiRequest("/api/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, verification_code: code }),
    });

    if (!result) return false;

    const { response, data } = result;

    if (response.ok && data.message === "Email verified") {
      console.log("✅ Email verified:", email);
      await AsyncStorage.setItem("email", email.trim().toLowerCase());
      return true;
    }

    console.warn("❌ Verification failed:", data.message);
    return false;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
};


export const refreshToken = async (): Promise<string | null> => {
  try {
    const currentToken = await AsyncStorage.getItem("jwtToken");
    if (!currentToken) return null;

    const result = await makeApiRequest("/api/refresh-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!result) return null;
    const { response, data } = result;

    if (response.ok && data.token) {
      await AsyncStorage.setItem("jwtToken", data.token);
      return data.token;
    }

    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
};

export const getUserProfile = async (
  token: string
): Promise<User | null> => {
  try {
    const result = await makeApiRequest("/api/user-profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!result) return null;

    const { response, data } = result;

    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) return getUserProfile(newToken);

      await AsyncStorage.removeItem("jwtToken");
      router.replace("/login");
      return null;
    }

    return response.ok ? data : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<string | null> => {
  try {
    const result = await makeApiRequest("/api/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result) return null;

    const { response, data } = result;

    if (response.ok) {
      await AsyncStorage.setItem("username", payload.username);
      await AsyncStorage.setItem("email", payload.email.trim().toLowerCase());
      return data.message?.includes("Verification code") ? "OK" : null;
    }

    return null;
  } catch (error) {
    console.error("Register error:", error);
    return null;
  }
};


export const logoutUser = async (): Promise<void> => {
  try {
    // Clear all user-related data from AsyncStorage
    await AsyncStorage.multiRemove([
      "jwtToken",
      "username",
      "email",
      "profile",
      "profileCache",
      "avatar_url",
      "pushToken",
      "favoritedItems",
      "jewelry_box_visited",
      "cart",
      "wishlist",
    ]);

    console.log('🐐 Logout: All user data cleared from AsyncStorage');

    // Navigate to sign-in screen
    router.replace("/sign-in");

    console.log('🐐 Logout: Navigated to sign-in screen');
  } catch (error) {
    console.error("❌ Logout error:", error);
    throw error;
  }
};

export interface UpdateProfilePayload {
  username?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  password?: string;
}

export const updateUserProfile = async (
  payload: UpdateProfilePayload
): Promise<User | null> => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const result = await makeApiRequest("/api/update-profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!result) return null;

    const { response, data } = result;

    if (response.ok && data.user) {
      // Update cached username if it changed
      if (payload.username) {
        await AsyncStorage.setItem("username", payload.username);
      }

      return data.user;
    }

    return null;
  } catch (error) {
    console.error("Update profile error:", error);
    return null;
  }
};

export const getLoginHistory = async (): Promise<LoginRecord[]> => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const result = await makeApiRequest("/api/login-history", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!result || !result.response.ok)
      throw new Error("Failed to fetch login history");

    return result.data.history ?? [];
  } catch (error) {
    console.error("Login history fetch error:", error);
    return [];
  }
};

export const searchListings = async (
  query: string
): Promise<Listing[]> => {
  try {
    const result = await makeApiRequest(
      `/api/search?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
      }
    );

    if (!result || !result.response.ok) return [];

    return result.data.listings ?? [];
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
};

fetch(`${API_BASE_URL}/ping`)
  .then((res) => res.json())
  .then((data) => console.log("🐐 Ping response:", data))
  .catch((err) => console.error("🐐 Ping failed:", err));

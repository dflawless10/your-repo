import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlobalFooter from "@/app/components/GlobalFooter";

type EditableItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  tags: string;
  photo_url: string;
  reserve_price?: number | null;
};


const API_URL = 'http://10.0.0.170:5000';

export default function EditItemScreen() {
  const { itemId } = useLocalSearchParams();
  const router = useRouter();

  const [item, setItem] = useState<EditableItem | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItem = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/item/${itemId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setItem(data);
        } else {
          Alert.alert('Error', 'Could not load item for editing');
          router.back();
        }
      } catch (error) {
        console.error('Error loading item:', error);
        Alert.alert('Error', 'Could not load item');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    loadItem();
  }, [itemId]);

  if (loading || !item) return <ActivityIndicator style={{ marginTop: 20 }} />;

  const handleUpdate = async () => {
    // Validate reserve price if it exists
    if (item.reserve_price && item.reserve_price < item.price) {
      Alert.alert(
        'Invalid Reserve Price',
        `Reserve price ($${item.reserve_price.toFixed(2)}) must be greater than or equal to the starting price ($${item.price.toFixed(2)}).`
      );
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');

   const payload = {
  name: item.name,
  description: item.description,
  price: parseFloat(String(item.price)),
  category_id: parseInt(String(item.category)),
  tags: item.tags,
  photo_url: item.photo_url,
  reserve_price: item.reserve_price ? parseFloat(String(item.reserve_price)) : null,
  status: "review",   // ⭐ THIS IS THE FIX
};



    try {
      const res = await fetch(`${API_URL}/item/${itemId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Alert.alert('Updated!', 'Item details saved.');
        router.back(); // or navigate to seller dashboard
      } else {
        const msg = await res.text();
        Alert.alert('Error', msg);
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Could not update item.');
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🛠️ Edit Item</Text>
      <TextInput placeholder="Name" value={item.name} onChangeText={(t) => setItem({ ...item, name: t })} style={styles.input} />
      <TextInput placeholder="Description" value={item.description} onChangeText={(t) => setItem({ ...item, description: t })} style={styles.input} />
      <TextInput placeholder="Price" value={item.price.toString()} onChangeText={(t) => {
  const num = parseFloat(t);
  if (!isNaN(num)) {
    setItem({ ...item, price: num });
  }
}}
 keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Category ID" value={item.category.toString()} onChangeText={(t) => {
  const num = parseInt(t);
  if (!isNaN(num)) {
    setItem({ ...item, category: num });
  }
}}
 keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Tags" value={item.tags} onChangeText={(t) => setItem({ ...item, tags: t })} style={styles.input} />

      <Text style={styles.label}>Reserve Price (optional)</Text>
      <TextInput
        placeholder="Reserve Price (must be ≥ starting price)"
        value={item.reserve_price?.toString() || ''}
        onChangeText={(t) => {
          const num = parseFloat(t);
          if (t === '' || t === null) {
            setItem({ ...item, reserve_price: null });
          } else if (!isNaN(num)) {
            setItem({ ...item, reserve_price: num });
          }
        }}
        keyboardType="numeric"
        style={styles.input}
      />
      {item.reserve_price && item.reserve_price < item.price && (
        <Text style={styles.errorText}>
          ⚠️ Reserve must be ≥ ${item.price.toFixed(2)}
        </Text>
      )}

      <TextInput placeholder="Photo URL" value={item.photo_url} onChangeText={(t) => setItem({ ...item, photo_url: t })} style={styles.input} />

      <Button title="Save Changes" onPress={handleUpdate} />
       <GlobalFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: -8,
    marginBottom: 12,
    fontWeight: '600',
  },
});

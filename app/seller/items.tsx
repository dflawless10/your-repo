import { API_BASE_URL } from '@/config';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
   Button, TextInput
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Link, useRouter} from 'expo-router';
import {Picker} from "@react-native-picker/picker";
import * as ImagePicker from 'expo-image-picker';



type SellerItem = {
  id: number;
  name: string;
  price: number;
  photo_url: string;
  bid_count: number;
};

interface Auction {
  id: number;
  title: string;
  description?: string;
  auction_id: number; // 👈 Add this line
  current_bid: number;
  auction_ends_at: string;
}


const API_URL = API_BASE_URL;

export default function SellerDashboardScreen() {
  const [items, setItems] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>(''); // or number, if you're validating
  const [tags, setTags] = useState<string>('');


const [auctions, setAuctions] = useState<Auction[]>([]);

  const router = useRouter();
  const [category, setCategory] = useState<number | null>(null);
const [categories, setCategories] = useState<
  { id: number; name: string; emoji: string }[]
>([]);

const handleImagePick = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
 // ✅ modern enum
  allowsEditing: true,
  aspect: [4, 4],
  quality: 1,
});

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // 👈 assumes you're using useState for imageUri
    }
  } catch (error) {
    console.error("Image pick error:", error);
  }
};

const handleSubmit = async () => {
  const token = await AsyncStorage.getItem('jwtToken');
  if (!token) {
    Alert.alert('Error', 'Not authenticated');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('tags', tags);
  if (category) formData.append('category_id', category.toString());

  if (imageUri) {
    formData.append('photo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any); // 👈 may need `as any` depending on your TS config
  }

  try {
    const res = await fetch(`${API_URL}/api/item`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type manually for FormData
      },
      body: formData,
    });

    if (res.ok) {
      Alert.alert('Success', 'Item listed successfully!');
      setName('');
      setDescription('');
      setPrice('');
      setTags('');
      setImageUri(null);
      setCategory(null);
    } else {
      const message = await res.text();
      Alert.alert('Error', message);
    }
  } catch (error) {
    console.error('Listing error:', error);
    Alert.alert('Error', 'Could not list item');
  }
};

  useEffect(() => {
  const fetchAuctions = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    const res = await fetch(`${API_URL}/api/myauctionscreen`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAuctions(data);
  };
  fetchAuctions();
}, []);



  useEffect(() => {
    const fetchSellerItems = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      try {
        const res = await fetch(`${API_URL}/seller/items`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('Error loading items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerItems();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  const handleDelete = async (itemId: number) => {
  const token = await AsyncStorage.getItem('jwtToken');

  try {
    const res = await fetch(`${API_URL}/item/${itemId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      Alert.alert('Deleted!', 'Item removed from your vault.');
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } else {
      const message = await res.text();
      Alert.alert('Error', message);
    }
  } catch (error) {
    console.error('Delete error:', error);
    Alert.alert('Error', 'Could not delete item.');
  }
};
const renderHeader = () => (
  <View>
    <Text style={styles.label}>Select Category</Text>
    <Text style={{ fontSize: 18, color: 'red', fontWeight: 'bold', marginVertical: 12 }}>

</Text>

    <Picker
      selectedValue={category}
      onValueChange={(value) => setCategory(value)}
      style={styles.picker}
    >
      {categories.map((cat) => (
        <Picker.Item
          key={cat.id}
          label={`${cat.emoji} ${cat.name}`}
          value={cat.id}
        />
      ))}
    </Picker>


    <Button title="Upload Photo" onPress={handleImagePick} />
    {imageUri && <Image source={{ uri: imageUri }} style={styles.thumbnailPreview} />}

    <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
    <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
    <TextInput placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
    <TextInput placeholder="Tags (comma-separated)" value={tags} onChangeText={setTags} style={styles.input} />

    <Button title="List Item" onPress={handleSubmit} />

    <Text style={{ marginTop: 20, fontSize: 18, fontWeight: '600' }}>✨ Explore Auctions</Text>

    {auctions.map((auction) => (
      <View key={auction.auction_id} style={styles.card}>
        <Text>{auction.title}</Text>
        <Text>${auction.current_bid}</Text>
        <Link href={{ pathname: "/auction/[auctionId]", params: { auctionId: auction.id.toString() } }}>
  <Text style={styles.link}>View Auction</Text>
</Link>


      </View>
    ))}

    <View style={{ marginTop: 20 }}>
      <Text style={{ fontWeight: '600', fontSize: 18 }}>🧳 Seller Dashboard</Text>
      <Link href="/seller/dashboard" style={{ marginTop: 6 }}>
        <Text style={{ color: '#3182ce' }}>Go to My Vault →</Text>
      </Link>
    </View>
  </View>
);


  return (
  <FlatList
    data={auctions} // ← or any placeholder array like `['preview']`
    keyExtractor={(item, index) => index.toString()}
    ListHeaderComponent={renderHeader}
    renderItem={() => null} // No actual rows; we're using header only
    contentContainerStyle={styles.container}
  />
);

}


const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  label: {
  fontSize: 16,
  fontWeight: '500',
  marginBottom: 4,
},
picker: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  marginBottom: 12,
},
thumbnailPreview: {
  width: 100,
  height: 100,
  borderRadius: 8,
  marginVertical: 12,
  alignSelf: 'center',
},
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  padding: 10,
  marginBottom: 12,
  fontSize: 16,
},
link: {
  fontSize: 16,
  color: '#007AFF', // iOS-style blue
  textDecorationLine: 'underline',
  marginVertical: 4,
},

    actionRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
actionText: {
  fontSize: 14,
  fontWeight: '500',
  paddingVertical: 4,
  paddingHorizontal: 8,
  backgroundColor: '#edf2f7',
  borderRadius: 6,
},

  image: { width: 100, height: 100 },
  details: { padding: 10, flex: 1 },
  name: { fontSize: 18, fontWeight: '600', marginBottom: 4 },

});

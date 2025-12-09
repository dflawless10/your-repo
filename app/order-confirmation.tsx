import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import ReceiptView from "@/components/ReceiptView";
import { useCartBackend } from 'hooks/usecartBackend';


// types/items.ts
export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  photo_url: string;   // required for UI
  startingPrice?: number;
}


function OrderConfirmationScreen() {
  const router = useRouter();
  const { cartItems } = useCartBackend(); // ✅ global cart state
  const address = '123 Pearl Street, Burr Ridge, IL'; // Mock or pass via param later
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const deliveryDate = format(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), 'PPP');


  return (
<View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>✅ Order Confirmed</Text>
      <Text style={styles.subtitle}>Thank you for shopping with BidGoat 🐐💍</Text>

      <View style={styles.details}>
        <Text>📦 Estimated Delivery: <Text style={styles.date}>{deliveryDate}</Text></Text>
        <Text>Shipping To: {address}</Text>
        <Text>Total: ${total.toFixed(2)}</Text>
      </View>
        <ReceiptView
  items={cartItems}
  address={address}
  total={total}
  deliveryDate={deliveryDate}
/>

      <Button title="Return Home" onPress={() => router.replace('/')} />
    </ScrollView>
<View style={{ padding: 24 }}>
    <Button title="Return Home" onPress={() => router.replace('/')} />
  </View>
</View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 60, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center',marginTop: 60, marginBottom: 16 },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 24 },
  details: {marginTop:60, marginBottom: 32 },
  text: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  date: { fontWeight: '600' },
});

 export default OrderConfirmationScreen;
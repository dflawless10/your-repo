// components/ReceiptView.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { parseISO, format } from 'date-fns';

// types/items.ts
export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  photo_url: string;   // ✅ required for UI
  startingPrice?: number;
  listed_at?: string;
  listedAt?: string;
  registration_time?: string;
}
function safeFormat(dateString: string | undefined, formatStr: string): string {
  if (!dateString) return 'Unknown';
  try {
    const iso = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const parsed = parseISO(iso);
    return format(parsed, formatStr);
  } catch {
    return 'Invalid Date';
  }
}

export default function ReceiptView({
  items, address,
  deliveryDate,
}: Readonly<{
  items: CartItem[];
  total: number;
  address: string;
  deliveryDate: string;
}>) {

  console.log('🧪 Receipt items:', items);

const computedTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);


  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🧾 Receipt Summary</Text>
      <Text style={styles.section}>📦 Shipping to:</Text>
      <Text style={styles.detail}>{address}</Text>


      <Text style={styles.section}>🎁 Items:</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
          <View style={{ marginLeft: 10 }}>
            <Text>{item.name}</Text>
            <Text>${item.price.toFixed(2)}</Text>
            <Text>🕒 Listed: {safeFormat(item.listed_at || item.listedAt || item.registration_time, 'PPP')}</Text>
<Text>
  {item.quantity} × ${item.price.toFixed(2)}
</Text>

          </View>
        </View>
      ))}

      <Text style={styles.section}>🕒 Estimated Delivery:</Text>
      <Text style={styles.detail}>{deliveryDate}</Text>

      <Text style={styles.section}>💰 Total:</Text>
     <Text style={styles.total}>${computedTotal.toFixed(2)}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9', borderRadius: 10 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  detail: { fontSize: 14, marginBottom: 6 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 8 },
  itemRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center',
  },
  thumbnail: { width: 60, height: 60, borderRadius: 6 },
});

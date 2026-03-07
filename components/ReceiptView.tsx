// components/ReceiptView.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { parseISO, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/theme/ThemeContext';

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
  seller?: {
    username: string;
    memberSince: string;
    rating: number;
    reviewCount: number;
    shippingPolicy: string;
    returnPolicyDays: number;
  };
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
  items,
  total,
  address,
  deliveryDate,
  buyerName,
}: Readonly<{
  items: CartItem[];
  total: number;
  address: string;
  deliveryDate: string;
  buyerName?: string;
}>) {
  const { theme, colors } = useTheme();

  console.log('🧪 Receipt items:', items);
  console.log('🧪 Receipt total prop:', total);

  // Get seller info from first item (all items should have same seller in BidGoat)
  const seller = items[0]?.seller;

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#f9f9f9' }]}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>🧾 Receipt Summary</Text>

      {/* Shipping Address with Buyer Name */}
      <Text style={[styles.section, { color: colors.textPrimary }]}>📦 Shipping to:</Text>
      {buyerName && <Text style={[styles.detail, { color: colors.textPrimary, fontWeight: '600' }]}>Attn: {buyerName}</Text>}
      <Text style={[styles.detail, { color: colors.textSecondary }]}>{address}</Text>


      <Text style={[styles.section, { color: colors.textPrimary }]}>🎁 Items:</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {item.quantity} × ${item.price.toFixed(2)}
            </Text>
          </View>
        </View>
      ))}

      {/* Seller Trust Signals */}
      {seller && (
        <>
          <View style={{ height: 1, backgroundColor: theme === 'dark' ? '#333' : '#E5E5E5', marginVertical: 12 }} />
          <Text style={[styles.section, { color: colors.textPrimary }]}>👤 Seller Information:</Text>

          <View style={{ gap: 6, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{seller.username}</Text>
            </View>

            {seller.memberSince && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Member since {new Date(seller.memberSince).getFullYear()}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {seller.rating > 0 ? (
                <>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                    {seller.rating.toFixed(1)} ({seller.reviewCount} reviews)
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="star-outline" size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
                    New Seller (No reviews yet)
                  </Text>
                </>
              )}
            </View>

            {seller.shippingPolicy && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {seller.shippingPolicy}
                </Text>
              </View>
            )}

            {seller.returnPolicyDays > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="return-down-back-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {seller.returnPolicyDays}-day returns
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      <View style={{ height: 1, backgroundColor: theme === 'dark' ? '#333' : '#E5E5E5', marginVertical: 12 }} />

      <Text style={[styles.section, { color: colors.textPrimary }]}>🕒 Estimated Delivery:</Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>{deliveryDate}</Text>

      <Text style={[styles.section, { color: colors.textPrimary }]}>💰 Total:</Text>
      <Text style={[styles.total, { color: colors.textPrimary }]}>${total.toFixed(2)}</Text>

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

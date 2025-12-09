import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import { useAppSelector } from '@/hooks/reduxHooks';

export default function ReduxProbe() {
  try {
    const wishlist = useAppSelector(state => state.wishlist.items);
    console.log('✅ Redux context found. Wishlist length:', wishlist.length);
    return <Text>Redux OK: {wishlist.length} items</Text>;
  } catch (error) {
    console.error('❌ Redux context missing:', error);
    return <Text>Redux ERROR</Text>;
  }
}



interface Props {
  username: string;
}

const JewelryBoxGreeting: React.FC<Props> = ({ username }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back, {username} 💍</Text>
      <Button
        title="📦 Open Jewelry Box"
        onPress={() => router.replace('/(tabs)/JewelryBoxScreen')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
});





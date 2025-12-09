import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getLoginHistory } from '@/api/authService';
import { LoginRecord } from '@/types/Auth';

const LoginHistoryScreen = () => {
  const [logins, setLogins] = useState<LoginRecord[]>([]);

  useEffect(() => {
  (async () => {
    try {
      const history = await getLoginHistory();
      console.log("🐐 Login history:", history); // ✅ Add this
      setLogins(history);
    } catch (error) {
      console.warn("Failed to load login history:", error);
      setLogins([]);
    }
  })();
}, []);



  const renderItem = ({ item }: { item: LoginRecord }) => (
    <View style={styles.card}>
      <Text style={styles.ip}>📍 {item.ip_address}</Text>
      <Text style={styles.time}>🕒 {new Date(item.login_time).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Logins</Text>
      <Text style={styles.tally}>
        🧮 Total Sessions: {logins.length}
      </Text>

      <FlatList
        data={logins}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  tally: { fontSize: 16, color: '#444', marginBottom: 16 },
  list: { paddingBottom: 32 },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  ip: { fontSize: 16, fontWeight: '500' },
  time: { fontSize: 14, color: '#666', marginTop: 4 },
});

export default LoginHistoryScreen;

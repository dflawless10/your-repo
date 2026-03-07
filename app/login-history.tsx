import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Animated } from 'react-native';
import { getLoginHistory } from '@/api/authService';
import { LoginRecord } from '@/types/Auth';
import { useTheme } from '@/app/theme/ThemeContext';
import EnhancedHeader from '@/app/components/EnhancedHeader';
import GlobalFooter from '@/app/components/GlobalFooter';

const LoginHistoryScreen = () => {
  const [logins, setLogins] = useState<LoginRecord[]>([]);
  const { colors } = useTheme();
  const scrollY = new Animated.Value(0);

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
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.textTertiary }]}>
      <Text style={[styles.ip, { color: colors.textPrimary }]}>📍 {item.ip_address}</Text>
      <Text style={[styles.time, { color: colors.textSecondary }]}>🕒 {new Date(item.login_time).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EnhancedHeader scrollY={scrollY} />

      <Animated.View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Recent Logins</Text>
          <Text style={[styles.tally, { color: colors.textSecondary }]}>
            🧮 Total Sessions: {logins.length}
          </Text>
        </View>

        <FlatList
          data={logins}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      </Animated.View>

      <GlobalFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 80 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30},
  tally: { fontSize: 16, marginBottom: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  ip: { fontSize: 16, fontWeight: '500' },
  time: { fontSize: 14, marginTop: 4 },
});

export default LoginHistoryScreen;

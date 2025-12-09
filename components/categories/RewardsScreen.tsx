import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { API_BASE_URL } from '@/config';






type RewardProfile = {
  username: string;
  bleat_credits: number;
  tier: 'Common Goat' | 'Golden Hoof' | 'Mystic Bleater' | 'Legendary Herd Scholar';
  recent_remarks: string[];
  avatar_url?: string;
};

export default function RewardsScreen() {
  const [profile, setProfile] = useState<RewardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rewards`);
        const data = await res.json();
        setProfile(data.profile);
      } catch (err) {
        console.error('Rewards fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const renderRemark = ({ item }: { item: string }) => (
    <View style={styles.remarkCard}>
      <Text style={styles.remarkText}>💬 {item}</Text>
    </View>
  );

  return (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>🏦 BidGoat Rewards Bank</Text>
    {loading ? (
      <ActivityIndicator size="large" color="#d14" />
    ) : profile ? (
      <>
        <View style={styles.header}>
          {profile.avatar_url && (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          )}
          <Image
            source={require('@/assets/goat-stamp-coin.png')}
            style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 16 }}
          />
          <View>
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.tier}>🎖 {profile.tier}</Text>
            <Text style={styles.credits}>Bleat Credits: {profile.bleat_credits}</Text>
          </View>
        </View>

        <Text style={styles.section}>Recent Positive Remarks</Text>
        {profile.recent_remarks.map((remark, index) => (
          <View key={index} style={styles.remarkCard}>
            <Text style={styles.remarkText}>💬 {remark}</Text>
          </View>
        ))}

        <Text style={styles.section}>✨ How It Works</Text>
        <Text style={styles.text}>
          Every time you receive a positive review, complete a barnyard ritual, or help another seller, you earn Bleat Credits. These credits unlock new tiers, mascot overlays, and auction perks.
        </Text>
      </>
    ) : (
      <Text style={styles.empty}>No rewards yet. Start bleating with kindness!</Text>
    )}
  </ScrollView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  username: { fontSize: 18, fontWeight: '600' },
  tier: { fontSize: 16, color: '#ff9900', marginTop: 4 },
  credits: { fontSize: 14, color: '#444', marginTop: 2 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  text: { fontSize: 15, color: '#555', lineHeight: 22 },
  remarkCard: {
    backgroundColor: '#f3f3f3',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  remarkText: { fontSize: 14, color: '#333' },
  remarkList: { paddingBottom: 40 },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 40, color: '#888' },
});


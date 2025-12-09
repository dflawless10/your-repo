// components/ListHeader.tsx
import React from 'react';
import { Text, StyleSheet  } from 'react-native';
import Animated from 'react-native-reanimated';
import { FadeIn } from 'react-native-reanimated';


interface ListHeaderProps {
  title: string;
  subtitle: string;
}

const ListHeader: React.FC<ListHeaderProps> = ({ title, subtitle }) => (
  <Animated.View entering={FadeIn} style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
  </Animated.View>
);


export default ListHeader;
const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
});
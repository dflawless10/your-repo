import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

// Use Expo's LinearGradient with SkeletonPlaceholder
export default function ReviewSkeleton({ count = 3 }) {
  return (
    <SkeletonPlaceholder
      borderRadius={8}
      backgroundColor="#f1f1f6"
      highlightColor="#e9e9ef"
      {...({ LinearGradientComponent: LinearGradient } as any)}
    >
      {Array.from({ length: count }).map((_, idx) => {
        return (
          <View key={idx} style={styles.block}>
            <View style={styles.header}>
              <View style={styles.avatar} />
              <View style={styles.nameBlock}>
                <View style={styles.lineShort} />
                <View style={styles.lineTiny} />
              </View>
            </View>
            <View style={[styles.line, { width: '100%' }]} />
            <View style={[styles.line, { width: '92%' }]} />
            <View style={[styles.line, { width: '80%' }]} />
          </View>
        );
      })}
    </SkeletonPlaceholder>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 16,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  nameBlock: {
    marginLeft: 12,
  },
  lineShort: {
    width: 100,
    height: 12,
    marginBottom: 6,
  },
  lineTiny: {
    width: 60,
    height: 10,
  },
  line: {
    height: 10,
    marginBottom: 6,
  },
});

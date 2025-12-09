// components/common/MemoizedSlide.tsx

import React from "react";
import { useRouter } from "expo-router";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type SlideProps = {
  label: string;
  id: string; // ✅ renamed from "key" to "id"
};

const MemoizedSlide: React.FC<SlideProps> = React.memo(({ label, id }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.slide}
      onPress={() =>
        router.push({
          pathname: '/explore/[category]',
          params: { category: id },
        })
      }
    >
      <Text style={styles.slideText}>{label}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  slide: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  slideText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default MemoizedSlide;


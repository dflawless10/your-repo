import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function ImageReview({ images }: Readonly<{ images: string[] }>) {
  return (
    <View style={styles.container}>
  {images.slice(0, 3).map((uri) => (
    <TouchableOpacity key={uri} onPress={() => {/* expand logic */}}>
      <Image source={{ uri }} style={styles.image} />
    </TouchableOpacity>
  ))}
</View>

  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, marginTop: 8 },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
});

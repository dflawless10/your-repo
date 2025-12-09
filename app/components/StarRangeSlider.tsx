import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function StarRangeSlider({ min, max, onChange }: Readonly<{
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>⭐ Rating Range</Text>
      <Text style={styles.rangeText}>{min} – {max}</Text>
      <Slider
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={min}
        onValueChange={(val) => onChange(val, max)}
        style={styles.slider}
      />
      <Slider
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={max}
        onValueChange={(val) => onChange(min, val)}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontWeight: '600', marginBottom: 6, color: '#4a5568' },
  rangeText: { fontSize: 14, marginBottom: 6, color: '#2d3748' },
  slider: { width: '100%', height: 40 },
});

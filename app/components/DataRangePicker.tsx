import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

type Props = {
  label: string;
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
};

export default function DateRangePicker({ label, start, end, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Start (YYYY-MM-DD)"
          value={start}
          onChangeText={(text) => onChange(text, end)}
        />
        <Text style={styles.to}>→</Text>
        <TextInput
          style={styles.input}
          placeholder="End (YYYY-MM-DD)"
          value={end}
          onChangeText={(text) => onChange(start, text)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontWeight: '600', marginBottom: 6, color: '#4a5568' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  to: {
    marginHorizontal: 4,
    fontSize: 16,
    color: '#718096',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export default function Dropdown({ label, options, selected, onSelect }: Readonly<Props>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.option,
              selected === option && styles.selectedOption,
            ]}
          >
            <Text style={selected === option ? styles.selectedText : styles.optionText}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontWeight: '600', marginBottom: 6, color: '#4a5568' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  selectedOption: {
    backgroundColor: '#6A0DAD',
  },
  optionText: {
    color: '#2d3748',
    fontSize: 13,
  },
  selectedText: {
    color: '#fff',
    fontSize: 13,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export default function CheckboxGroup({ label, options, selected, onChange }: Readonly<Props>) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            onPress={() => toggle(value)}
            style={[
              styles.box,
              selected.includes(value) && styles.selectedBox,
            ]}
          >
            <Text style={selected.includes(value) ? styles.selectedText : styles.text}>
              {label}
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  box: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  selectedBox: {
    backgroundColor: '#6A0DAD',
  },
  text: {
    color: '#2d3748',
    fontSize: 13,
  },
  selectedText: {
    color: '#fff',
    fontSize: 13,
  },
});

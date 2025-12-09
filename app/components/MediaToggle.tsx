import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  selected: string[];
  onChange: (types: string[]) => void;
};

const MEDIA_TYPES = ['text', 'image', 'video', 'voice'];

export default function MediaToggle({ selected, onChange }: Readonly<Props>) {
  const toggleType = (type: string) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Media Types</Text>
      <View style={styles.row}>
        {MEDIA_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => toggleType(type)}
            style={[
              styles.button,
              selected.includes(type) && styles.selected,
            ]}
          >
            <Text style={selected.includes(type) ? styles.selectedText : styles.text}>
              {type.toUpperCase()}
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
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  selected: {
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

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  selected: string[];
  onChange: (tags: string[]) => void;
};

const TAGS = ['Fast shipping', 'Great quality', 'Responsive seller', 'Poor packaging', 'Accurate description'];

export default function TagSelector({ selected, onChange }: Readonly<Props>) {
  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sentiment Tags</Text>
      <View style={styles.tagRow}>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => toggleTag(tag)}
            style={[
              styles.tag,
              selected.includes(tag) && styles.selectedTag,
            ]}
          >
            <Text style={selected.includes(tag) ? styles.selectedText : styles.tagText}>
              {tag}
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  selectedTag: {
    backgroundColor: '#6A0DAD',
  },
  tagText: {
    color: '#2d3748',
    fontSize: 13,
  },
  selectedText: {
    color: '#fff',
    fontSize: 13,
  },
});

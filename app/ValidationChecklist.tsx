import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DocumentPickerAsset } from 'expo-document-picker';

type Props = {
  asset: DocumentPickerAsset;
};

export default function ValidationChecklist({ asset }: Readonly<Props>) {
  const { name, mimeType, size } = asset;

  const isImage = mimeType?.startsWith('image/');
  const isVideo = mimeType?.startsWith('video/');
  const isAudio = mimeType?.startsWith('audio/');

  const isKebabCase = !!name && /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z]+)?$/.test(name);
  const isSizeValid =
    typeof size === 'number' &&
    ((isImage && size <= 5 * 1024 * 1024) ||
      (isVideo && size <= 10 * 1024 * 1024) ||
      (isAudio && size <= 1024 * 1024));

  const checklist = {
    'File Info': [
      { label: 'File type is supported', passed: isImage || isVideo || isAudio },
      { label: 'File size is within limit', passed: isSizeValid },
    ],
    'Naming': [
      { label: 'Filename uses kebab-case', passed: isKebabCase },
    ],
    'Brand Compliance': [
      { label: 'Mascot overlay is transparent', passed: false }, // placeholder
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validation Checklist 🧪</Text>
      {Object.entries(checklist).map(([category, checks]) => (
        <View key={category} style={styles.section}>
          <Text style={styles.category}>{category}</Text>
          {checks.map((check) => (
            <Text key={check.label} style={[styles.item, { color: check.passed ? 'green' : 'red' }]}>
              {check.passed ? '✅' : '❌'} {check.label}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  section: {
    marginTop: 12,
  },
  category: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  item: {
    fontSize: 16,
    marginVertical: 2,
  },
});

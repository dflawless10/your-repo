import React, { useState } from 'react';
import {  Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

type Props = {
  onAssetSelected: (asset: DocumentPicker.DocumentPickerAsset) => void;
};

export default function AssetDropZone({ onAssetSelected }: Readonly<Props>) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'video/*', 'audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets?.length) {
      const file = result.assets[0];
      setPreviewUri(file.uri ?? '');
      setFileName(file.name ?? 'Unnamed');
      onAssetSelected(file);
    }
  };

  return (
    <TouchableOpacity style={styles.dropZone} onPress={pickFile}>
      <Text style={styles.label}>
        {fileName ? `Selected: ${fileName}` : 'Tap to upload image, video, or sound'}
      </Text>
      {previewUri && previewUri.endsWith('.png') && (
        <Image source={{ uri: previewUri }} style={styles.preview} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dropZone: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fefefe',
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  preview: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginTop: 12,
  },
});


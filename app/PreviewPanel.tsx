import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import {ResizeMode, Video} from 'expo-av';
import { DocumentPickerAsset } from 'expo-document-picker';

type Props = {
  asset: DocumentPickerAsset;
};

export default function PreviewPanel({ asset }: Readonly<Props>) {
  const { uri, mimeType, name } = asset;

  const isImage = mimeType?.startsWith('image/');
  const isVideo = mimeType?.startsWith('video/');
  const isAudio = mimeType?.startsWith('audio/');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preview: {name ?? 'Unnamed file'}</Text>

      {isImage && (
        <Image source={{ uri }} style={styles.image} />
      )}

      {isVideo && (
        <Video
  source={{ uri }}
  style={styles.video}
  useNativeControls
  resizeMode={ResizeMode.CONTAIN}
  isLooping
/>
      )}

      {isAudio && (
        <Text style={styles.audioLabel}>Audio file selected. Tap to play in validator.</Text>
      )}

      {!isImage && !isVideo && !isAudio && (
        <Text style={styles.unsupported}>Unsupported file type: {mimeType}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  audioLabel: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  unsupported: {
    fontSize: 14,
    color: 'red',
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AssetDropZone from './AssetDropZone';
import PreviewPanel from './PreviewPanel';
import ValidationChecklist from './ValidationChecklist';
import SparkleFeedback from './SparkleFeedback';
import ListingPreviewModal from './ListingPreviewModal'; // Make sure this exists!
import { useValidationStatus } from '@/hooks/useValidationStatus';
import { DocumentPickerAsset } from 'expo-document-picker';
import { playGoatSoundByName } from '@/assets/sounds/officialGoatSoundsSoundtrack';

export default function UploadValidatorScreen() {
  const [selectedFile, setSelectedFile] = useState<DocumentPickerAsset | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { passed } = useValidationStatus(selectedFile);

  const handleSubmit = () => {
    if (selectedFile) {
      setShowPreview(true);
    }
  };

  const confirmListing = () => {
    if (selectedFile) {
      playGoatSoundByName('goat-bells.wav');
      console.log('🎉 Confetti triggered!');
      console.log('Submitting to marketplace:', selectedFile.name);
      alert(`Your item "${selectedFile.name}" has been listed! 🐐✨`);
      setShowPreview(false);
    }
  };

  return (
    <View style={styles.container}>
      <AssetDropZone onAssetSelected={setSelectedFile} />

      {selectedFile && (
        <>
          <PreviewPanel asset={selectedFile} />
          <ValidationChecklist asset={selectedFile} />
          <SparkleFeedback visible={passed} />

          {passed && (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit to Marketplace</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {showPreview && selectedFile && (
        <ListingPreviewModal
          asset={selectedFile}
          onConfirm={confirmListing}
          onCancel={() => setShowPreview(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#4630EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

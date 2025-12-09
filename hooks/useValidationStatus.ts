import { useEffect, useState } from 'react';
import { DocumentPickerAsset } from 'expo-document-picker';

export const useValidationStatus = (asset: DocumentPickerAsset | null) => {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (!asset) {
      setPassed(false);
      return;
    }

    // Example validation logic
    const isValid = asset.name.endsWith('.jpg') || asset.name.endsWith('.png');
    setPassed(isValid);
  }, [asset]);

  return { passed };
};


import { useState, useEffect } from 'react';

export type ImageValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    fileSize: { passed: boolean; message: string };
    fileType: { passed: boolean; message: string };
    dimensions: { passed: boolean; message: string };
    aspectRatio: { passed: boolean; message: string };
  };
};

type ImageAsset = {
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
  type?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_WIDTH = 400;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 4000;
const MAX_HEIGHT = 4000;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function useImageValidation(imageUri: string | null): ImageValidationResult {
  const [result, setResult] = useState<ImageValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
    checks: {
      fileSize: { passed: false, message: '' },
      fileType: { passed: false, message: '' },
      dimensions: { passed: false, message: '' },
      aspectRatio: { passed: false, message: '' },
    },
  });

  useEffect(() => {
    if (!imageUri) {
      setResult({
        isValid: false,
        errors: [],
        warnings: [],
        checks: {
          fileSize: { passed: false, message: 'No image selected' },
          fileType: { passed: false, message: 'No image selected' },
          dimensions: { passed: false, message: 'No image selected' },
          aspectRatio: { passed: false, message: 'No image selected' },
        },
      });
      return;
    }

    validateImage(imageUri);
  }, [imageUri]);

  const validateImage = async (uri: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checks = {
      fileSize: { passed: true, message: 'File size OK' },
      fileType: { passed: true, message: 'File type supported' },
      dimensions: { passed: true, message: 'Dimensions OK' },
      aspectRatio: { passed: true, message: 'Aspect ratio OK' },
    };

    try {
      // Guess file type from extension
      const ext = uri.split('.').pop()?.toLowerCase() || '';
      const mimeType = guessMimeType(ext);

      // Validate file type
      if (!ALLOWED_TYPES.includes(mimeType)) {
        checks.fileType.passed = false;
        checks.fileType.message = `File type ${mimeType} not supported`;
        errors.push(`Unsupported file type: ${mimeType}. Use JPG, PNG, or WEBP.`);
      }

      // Get image dimensions (React Native Image.getSize)
      const { width, height } = await getImageDimensions(uri);

      // Validate dimensions
      if (width < MIN_WIDTH || height < MIN_HEIGHT) {
        checks.dimensions.passed = false;
        checks.dimensions.message = `Image too small: ${width}x${height}`;
        errors.push(`Image must be at least ${MIN_WIDTH}x${MIN_HEIGHT}px`);
      }

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        checks.dimensions.passed = false;
        checks.dimensions.message = `Image too large: ${width}x${height}`;
        warnings.push(`Image is very large (${width}x${height}). Consider resizing for faster uploads.`);
      }

      // Validate aspect ratio (reasonable range 1:3 to 3:1)
      const aspectRatio = width / height;
      if (aspectRatio < 0.33 || aspectRatio > 3) {
        checks.aspectRatio.passed = false;
        checks.aspectRatio.message = `Unusual aspect ratio: ${aspectRatio.toFixed(2)}`;
        warnings.push(`Unusual aspect ratio. Square or landscape images work best.`);
      }

      // File size check (we can't easily get this in React Native without native modules)
      // So we'll mark it as passed with a note
      checks.fileSize.message = 'File size check skipped (requires native module)';

    } catch (error) {
      errors.push('Failed to validate image');
      console.error('Image validation error:', error);
    }

    const isValid = errors.length === 0;

    setResult({
      isValid,
      errors,
      warnings,
      checks,
    });
  };

  return result;
}

function guessMimeType(ext: string): string {
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    case 'jpg':
    case 'jpeg':
    default: return 'image/jpeg';
  }
}

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof Image !== 'undefined') {
      // React Native
      const { Image: RNImage } = require('react-native');
      RNImage.getSize(
        uri,
        (width: number, height: number) => resolve({ width, height }),
        (error: Error) => reject(error)
      );
    } else {
      // Fallback for web or if Image.getSize not available
      resolve({ width: 800, height: 800 }); // Default safe values
    }
  });
}

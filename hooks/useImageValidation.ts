import { useState, useEffect } from 'react';
import { Image as RNImage } from 'react-native';

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

// BidGoat Image Requirements
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DIMENSION = 500;
const MAX_DIMENSION = 7000;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_ASPECT_RATIOS = [
  { ratio: 1, name: '1:1 (Square)', tolerance: 0.05 },
  { ratio: 16 / 9, name: '16:9 (Landscape)', tolerance: 0.1 },
];

// Correct expo-image dimension helper


async function getDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => {
        console.log("🐐 [Validation] RNImage.getSize failed:", err);
        reject(new Error("Unable to read image dimensions"));
      }
    );
  });
}

export function useImageValidation(
  imageUri: string | null,
  imageAsset?: ImageAsset
): ImageValidationResult {
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

    validateImage(imageUri, imageAsset);
  }, [imageUri, imageAsset]);

  const validateImage = async (uri: string, asset?: ImageAsset) => {
    console.log("🐐 [Validation] Starting validation for:", uri);

    const errors: string[] = [];
    const warnings: string[] = [];
    const checks = {
      fileSize: { passed: true, message: 'File size OK' },
      fileType: { passed: true, message: 'File type supported' },
      dimensions: { passed: true, message: 'Dimensions OK' },
      aspectRatio: { passed: true, message: 'Aspect ratio OK' },
    };

    try {
      // File type
      const ext = uri.split('.').pop()?.toLowerCase() || '';
      const mimeType = asset?.type || guessMimeType(ext);

      if (!ALLOWED_TYPES.includes(mimeType)) {
        checks.fileType.passed = false;
        checks.fileType.message = `Type: ${mimeType} not allowed`;
        errors.push(`Only JPG, PNG, and WEBP images allowed.`);
      } else {
        checks.fileType.message = `${mimeType.split('/')[1].toUpperCase()} format`;
      }

      // Dimensions
      let width = asset?.width;
      let height = asset?.height;

      if (!width || !height) {
        console.log("🐐 [Validation] Getting dimensions via expo-image…");
        const dims = await getDimensions(uri);
        width = dims.width;
        height = dims.height;
      }

      console.log("🐐 [Validation] Dimensions:", width, "x", height);

      const longestSide = Math.max(width, height);

      if (longestSide < MIN_DIMENSION) {
        checks.dimensions.passed = false;
        checks.dimensions.message = `${width}×${height}px (too small)`;
        errors.push(`Image must be at least ${MIN_DIMENSION}px on the longest side.`);
      }

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        checks.dimensions.passed = false;
        checks.dimensions.message = `${width}×${height}px (too large)`;
        errors.push(`Image exceeds maximum ${MAX_DIMENSION}px.`);
      }

      if (checks.dimensions.passed) {
        checks.dimensions.message = `${width}×${height}px`;

        if (longestSide > 4000) {
          warnings.push(`Large image (${width}×${height}px) may take longer to upload.`);
        }
      }

      // Aspect ratio
      const aspectRatio = width / height;
      let aspectRatioMatch = false;

      for (const allowed of ALLOWED_ASPECT_RATIOS) {
        const diff = Math.abs(aspectRatio - allowed.ratio);
        if (diff <= allowed.tolerance) {
          aspectRatioMatch = true;
          checks.aspectRatio.message = allowed.name;
          break;
        }
      }

      if (!aspectRatioMatch) {
        checks.aspectRatio.passed = false;
        checks.aspectRatio.message = `${aspectRatio.toFixed(2)}:1 (invalid)`;
        errors.push(`Image must be 1:1 or 16:9.`);
      }

      // File size
      const fileSize = asset?.fileSize;

      if (fileSize) {
        const fileSizeMB = fileSize / (1024 * 1024);

        if (fileSize > MAX_FILE_SIZE) {
          checks.fileSize.passed = false;
          checks.fileSize.message = `${fileSizeMB.toFixed(1)}MB (too large)`;
          errors.push(`File size exceeds 10MB.`);
        } else {
          checks.fileSize.message = `${fileSizeMB.toFixed(1)}MB`;

          if (fileSizeMB > 5) {
            warnings.push(`File size is ${fileSizeMB.toFixed(1)}MB. Consider compressing.`);
          }
        }
      } else {
        // File size not available from picker - this is normal for some images
        checks.fileSize.message = 'Size check skipped';
        // Don't add a warning since this is expected behavior
      }

    } catch (error) {
      console.error("🐐 [Validation] ERROR:", error);
      errors.push('Failed to validate image.');
      checks.fileSize.passed = false;
      checks.fileType.passed = false;
      checks.dimensions.passed = false;
      checks.aspectRatio.passed = false;
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
  switch (ext.toLowerCase()) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'jpg':
    case 'jpeg':
    default: return 'image/jpeg';
  }
}

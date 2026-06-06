/**
 * R2 Direct Upload Utility
 * Handles uploading images directly to Cloudflare R2 with retry logic
 */

import { API_BASE_URL } from '@/config';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image directly to R2 storage
 * @param imageUri - Local file URI from ImagePicker
 * @param maxRetries - Number of retry attempts (default 3)
 */
export async function uploadToR2(
  imageUri: string,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[R2 Upload] Attempt ${attempt}/${maxRetries} for ${imageUri}`);

      // Step 1: Request upload token from backend
      const tokenResponse = await fetch(`${API_BASE_URL}/api/upload/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extension: 'jpg',
          content_type: 'image/jpeg'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      // Check if using R2 or fallback
      if (tokenData.storage === 'local' || tokenData.fallback) {
        console.log('[R2 Upload] Using local fallback upload');
        return await uploadToLocal(imageUri);
      }

      // Step 2: Upload directly to R2 using pre-signed PUT URL
      // Convert file URI to blob
      const fileBlob = await fetch(imageUri).then(r => r.blob());

      const uploadResponse = await fetch(tokenData.upload_url, {
        method: 'PUT',
        body: fileBlob,
        headers: {
          'Content-Type': tokenData.content_type || 'image/jpeg'
        }
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`R2 upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      console.log(`[R2 Upload] Success: ${tokenData.public_url}`);

      // Step 3: Notify backend of completion (optional, for analytics)
      fetch(`${API_BASE_URL}/api/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: tokenData.key,
          public_url: tokenData.public_url
        })
      }).catch(err => console.warn('[R2 Upload] Complete webhook failed:', err));

      return {
        success: true,
        url: tokenData.public_url
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[R2 Upload] Attempt ${attempt} failed:`, lastError);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        console.log(`[R2 Upload] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError || 'Upload failed after multiple attempts'
  };
}

/**
 * Fallback: Upload to local storage (existing endpoint)
 */
async function uploadToLocal(imageUri: string): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg'
    } as any);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check for 413 error (Request Entity Too Large)
      if (response.status === 413) {
        throw new Error('Image too large. Please try a smaller image or reduce quality.');
      }

      // Check if response is HTML (nginx error page)
      if (errorText.includes('<html>') || errorText.includes('<!DOCTYPE')) {
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    const fullUrl = `${API_BASE_URL}${data.media_url}`;

    console.log('[Local Upload] Success:', fullUrl);

    return {
      success: true,
      url: fullUrl
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

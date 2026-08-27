/**
 * Robust image compressor with fallbacks for mobile browsers, iOS HEIC/HEIF,
 * large camera photos, and slow devices.
 */

export interface CompressionOptions {
  maxSizeBytes?: number;
  initialMaxWidth?: number;
  initialQuality?: number;
  timeoutMs?: number;
}

export const compressImageToDataUrl = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxSizeBytes = 500 * 1024, // 500 KB target
    initialMaxWidth = 1200,
    initialQuality = 0.8,
    timeoutMs = 8000,
  } = options;

  return new Promise((resolve) => {
    // Failsafe timeout to prevent hanging promises on slow mobile devices
    const timeoutTimer = setTimeout(() => {
      console.warn('Image compression timed out, attempting direct raw FileReader fallback');
      readRawFileAsDataUrl(file).then(resolve);
    }, timeoutMs);

    const cleanupAndResolve = (result: string) => {
      clearTimeout(timeoutTimer);
      resolve(result);
    };

    if (!file || !file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
      readRawFileAsDataUrl(file).then(cleanupAndResolve);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        readRawFileAsDataUrl(file).then(cleanupAndResolve);
        return;
      }

      // If file is already smaller than maxSizeBytes and is a standard image, return it directly
      if (file.size <= maxSizeBytes && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        cleanupAndResolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          let maxWidth = initialMaxWidth;
          let quality = initialQuality;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = Math.max(width, 100);
          canvas.height = Math.max(height, 100);

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            cleanupAndResolve(rawDataUrl);
            return;
          }

          // Fill white background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Iteratively downscale if size exceeds maxSizeBytes
          let attempts = 0;
          while (dataUrl.length * 0.75 > maxSizeBytes && attempts < 6) {
            attempts++;
            quality = Math.max(0.3, quality - 0.15);
            if (quality <= 0.45) {
              maxWidth = Math.round(maxWidth * 0.75);
              width = Math.round(width * 0.75);
              height = Math.round(height * 0.75);
              canvas.width = Math.max(width, 100);
              canvas.height = Math.max(height, 100);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              quality = 0.6;
            }
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          cleanupAndResolve(dataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression error, using raw file:', canvasErr);
          cleanupAndResolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        console.warn('Image decoding failed (may be HEIC or unsupported format), falling back to raw data');
        cleanupAndResolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      console.error('FileReader error on image upload');
      cleanupAndResolve('');
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Fallback to read raw file directly as Base64 data URL
 */
export const readRawFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
};

/**
 * Robust image compressor with fallbacks for mobile browsers, iOS HEIC/HEIF,
 * large camera photos, and slow devices.
 * Produces crisp, lightweight images safely within Firestore & Supabase limits.
 */

export interface CompressionOptions {
  maxSizeBytes?: number;
  initialMaxWidth?: number;
  initialMaxHeight?: number;
  initialQuality?: number;
  timeoutMs?: number;
}

export const compressImageToDataUrl = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxSizeBytes = 180 * 1024, // 180 KB target (well within Firestore 1MB doc limit)
    initialMaxWidth = 1000,
    initialMaxHeight = 1400,
    initialQuality = 0.76,
    timeoutMs = 5000,
  } = options;

  return new Promise((resolve) => {
    let resolved = false;

    const cleanupAndResolve = (result: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutTimer);
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (_) {}
      }
      resolve(result);
    };

    // Failsafe timeout to prevent hanging promises on slow mobile devices
    const timeoutTimer = setTimeout(() => {
      console.warn('Image compression timed out, using fallback');
      readRawFileAsDataUrl(file).then((raw) => {
        if (raw && raw.length > 500 * 1024) {
          // If raw is too large, downscale it
          downscaleBase64(raw, maxSizeBytes).then(cleanupAndResolve);
        } else {
          cleanupAndResolve(raw);
        }
      });
    }, timeoutMs);

    if (!file) {
      cleanupAndResolve('');
      return;
    }

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (_) {
      objectUrl = '';
    }

    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;
        let maxWidth = initialMaxWidth;
        let maxHeight = initialMaxHeight;
        let quality = initialQuality;

        // Scale proportionally to fit within maxWidth and maxHeight
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = Math.max(width, 100);
        canvas.height = Math.max(height, 100);

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          readRawFileAsDataUrl(file).then(cleanupAndResolve);
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Iteratively downscale if size exceeds maxSizeBytes
        let attempts = 0;
        while (dataUrl && dataUrl.length * 0.75 > maxSizeBytes && attempts < 4) {
          attempts++;
          quality = Math.max(0.4, quality - 0.12);
          maxWidth = Math.round(maxWidth * 0.85);
          maxHeight = Math.round(maxHeight * 0.85);
          width = Math.round(width * 0.85);
          height = Math.round(height * 0.85);
          canvas.width = Math.max(width, 100);
          canvas.height = Math.max(height, 100);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl && dataUrl.length > 50) {
          cleanupAndResolve(dataUrl);
        } else {
          readRawFileAsDataUrl(file).then(cleanupAndResolve);
        }
      } catch (canvasErr) {
        console.warn('Canvas compression error, using raw fallback:', canvasErr);
        readRawFileAsDataUrl(file).then(cleanupAndResolve);
      }
    };

    img.onerror = () => {
      console.warn('Image ObjectURL decoding failed, trying FileReader');
      readRawFileAsDataUrl(file).then((raw) => {
        if (raw && raw.length > 400 * 1024) {
          downscaleBase64(raw, maxSizeBytes).then(cleanupAndResolve);
        } else {
          cleanupAndResolve(raw);
        }
      });
    };

    if (objectUrl) {
      img.src = objectUrl;
    } else {
      readRawFileAsDataUrl(file).then((raw) => {
        if (raw) {
          img.src = raw;
        } else {
          cleanupAndResolve('');
        }
      });
    }
  });
};

/**
 * Fallback to read raw file directly as Base64 data URL
 */
export const readRawFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (!file) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
};

/**
 * Downscales an existing Base64 data URL image to safe size
 */
export const downscaleBase64 = (
  base64DataUrl: string,
  maxSizeBytes: number = 200 * 1024
): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64DataUrl || !base64DataUrl.startsWith('data:image')) {
      resolve(base64DataUrl);
      return;
    }
    // If already small, return as is
    if (base64DataUrl.length * 0.75 <= maxSizeBytes) {
      resolve(base64DataUrl);
      return;
    }

    const img = new Image();
    const timer = setTimeout(() => resolve(base64DataUrl), 3000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let w = img.naturalWidth || img.width || 800;
        let h = img.naturalHeight || img.height || 600;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = Math.max(w, 100);
        canvas.height = Math.max(h, 100);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(base64DataUrl);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressed && compressed.length > 50 ? compressed : base64DataUrl);
      } catch {
        resolve(base64DataUrl);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(base64DataUrl);
    };

    img.src = base64DataUrl;
  });
};

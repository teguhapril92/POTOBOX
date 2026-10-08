/**
 * Optimizes image dataUrl to ensure it safely fits within Firebase Firestore's 1MB document limit.
 * Full original quality is preserved for direct local download, while cloud storage receives
 * a crisp, high-resolution JPEG (~200KB-500KB) that renders instantly on mobile devices.
 */
export async function optimizePhotoForCloud(
  dataUrl: string,
  maxByteSize: number = 750000
): Promise<string> {
  // If already small enough (under 750KB), return as-is
  if (dataUrl.length <= maxByteSize && dataUrl.startsWith('data:image/jpeg')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    // Safety timeout in case img onload hangs
    const timeout = setTimeout(() => {
      resolve(dataUrl);
    }, 4000);

    const img = new Image();
    // Only set crossOrigin if it is an external URL, not a base64 dataUrl
    if (!dataUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        // If dimensions are exceedingly large, scale down proportionally
        const maxDimension = 1800;
        let targetW = naturalW;
        let targetH = naturalH;

        if (naturalW > maxDimension || naturalH > maxDimension) {
          if (naturalW >= naturalH) {
            targetW = maxDimension;
            targetH = Math.round((naturalH * maxDimension) / naturalW);
          } else {
            targetH = maxDimension;
            targetW = Math.round((naturalW * maxDimension) / naturalH);
          }
        }

        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // White background in case of transparent background for JPEG conversion
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Export as crisp JPEG with 0.88 quality
        let compressed = canvas.toDataURL('image/jpeg', 0.88);

        // If still exceeds size limit, lower quality slightly
        if (compressed.length > maxByteSize) {
          compressed = canvas.toDataURL('image/jpeg', 0.78);
        }

        if (compressed.length > maxByteSize) {
          // Extra scaling pass for extreme canvas sizes
          const halfCanvas = document.createElement('canvas');
          halfCanvas.width = Math.round(targetW * 0.75);
          halfCanvas.height = Math.round(targetH * 0.75);
          const halfCtx = halfCanvas.getContext('2d');
          if (halfCtx) {
            halfCtx.fillStyle = '#FFFFFF';
            halfCtx.fillRect(0, 0, halfCanvas.width, halfCanvas.height);
            halfCtx.drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);
            compressed = halfCanvas.toDataURL('image/jpeg', 0.75);
          }
        }

        resolve(compressed);
      } catch (err) {
        console.warn('Image optimization fallback:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

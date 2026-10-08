import { CollageType, FrameTemplate, PhotoFilter } from '../types';
import { COLLAGE_DEFINITIONS } from './collages';

interface ComposeOptions {
  collageType: CollageType;
  capturedPhotos: string[]; // array of dataUrls
  template: FrameTemplate;
  filter: PhotoFilter;
  customFrameImg?: HTMLImageElement | null;
}

// Loads an image from data URL asynchronously
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Get CSS filter string for canvas
export function getCanvasFilterString(filter: PhotoFilter): string {
  switch (filter) {
    case 'bw':
      return 'grayscale(100%) contrast(115%) brightness(105%)';
    case 'warm':
      return 'sepia(30%) saturate(130%) contrast(105%) brightness(103%)';
    case 'cool':
      return 'saturate(110%) hue-rotate(185deg) contrast(105%)';
    case 'vintage':
      return 'sepia(50%) contrast(110%) brightness(95%) saturate(85%)';
    case 'normal':
    default:
      return 'none';
  }
}

export async function composePhotoboothImage({
  collageType,
  capturedPhotos,
  template,
  filter,
  customFrameImg,
}: ComposeOptions): Promise<string> {
  const config = COLLAGE_DEFINITIONS[collageType];
  const canvas = document.createElement('canvas');
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D canvas context');
  }

  // 1. Draw canvas solid background
  const isDarkTheme = template.id !== 'korean_pastel';
  ctx.fillStyle = isDarkTheme ? '#0B0F19' : '#FFF5F7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Load all captured images
  const loadedPhotos: HTMLImageElement[] = [];
  for (let i = 0; i < config.slots.length; i++) {
    const photoSrc = capturedPhotos[i] || capturedPhotos[0];
    if (photoSrc) {
      try {
        const img = await loadImage(photoSrc);
        loadedPhotos.push(img);
      } catch (err) {
        console.error(`Failed to load photo at index ${i}:`, err);
      }
    }
  }

  // 3. Draw each photo into its respective slot with proper aspect cover & rounded clipping
  config.slots.forEach((slot, idx) => {
    const img = loadedPhotos[idx];
    if (!img) return;

    ctx.save();

    // Clip to rounded rectangle
    const r = slot.radius || 12;
    ctx.beginPath();
    ctx.roundRect(slot.x, slot.y, slot.width, slot.height, r);
    ctx.clip();

    // Apply color filter
    ctx.filter = getCanvasFilterString(filter);

    // 100% distortion-free center-crop (object-fit: cover, prevents oblong/lonjong distortion)
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const imgRatio = imgW / imgH;
    const slotRatio = slot.width / slot.height;

    let sx = 0;
    let sy = 0;
    let sw = imgW;
    let sh = imgH;

    if (imgRatio > slotRatio) {
      // Source image is wider than slot: crop horizontally from center
      sw = imgH * slotRatio;
      sh = imgH;
      sx = (imgW - sw) / 2;
      sy = 0;
    } else {
      // Source image is taller than slot: crop vertically from center
      sw = imgW;
      sh = imgW / slotRatio;
      sx = 0;
      sy = (imgH - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, slot.x, slot.y, slot.width, slot.height);

    ctx.restore();
  });

  // Reset filter for frame overlays
  ctx.filter = 'none';

  // 4. Apply Overlay
  if (template.isCustom && customFrameImg) {
    // Render custom transparent PNG directly onto canvas
    ctx.drawImage(customFrameImg, 0, 0, canvas.width, canvas.height);
  } else if (template.renderOverlay) {
    // Render built-in SVG/vector template
    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    template.renderOverlay(ctx, canvas.width, canvas.height, collageType, { dateStr });
  }

  // 5. Return high-quality PNG
  return canvas.toDataURL('image/png', 0.95);
}

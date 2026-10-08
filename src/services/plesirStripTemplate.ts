import { CollageType } from '../types';

// In-memory cache for user's pure PLESIR.png
let cachedPlesirImg: HTMLImageElement | null = null;
let isPlesirImgLoading = false;

export function setPlesirImageSource(src: string) {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.onload = () => {
    cachedPlesirImg = img;
  };
  img.src = src;
}

export function loadPlesirImage() {
  if (typeof window === 'undefined' || cachedPlesirImg || isPlesirImgLoading) return;

  // 1. Check local storage first
  try {
    const saved = localStorage.getItem('plesir_custom_template_dataUrl');
    if (saved) {
      setPlesirImageSource(saved);
      return;
    }
  } catch {
    // Ignore storage errors
  }

  isPlesirImgLoading = true;
  const img = new Image();
  img.onload = () => {
    cachedPlesirImg = img;
    isPlesirImgLoading = false;
  };
  img.onerror = () => {
    const fallbackImg = new Image();
    fallbackImg.onload = () => {
      cachedPlesirImg = fallbackImg;
      isPlesirImgLoading = false;
    };
    fallbackImg.onerror = () => {
      isPlesirImgLoading = false;
    };
    fallbackImg.src = '/PLESIR.png';
  };
  img.src = '/templates/plesir.png';
}

// Kick off attempt in browser
if (typeof window !== 'undefined') {
  loadPlesirImage();
}

/**
 * Pelesir Keliling Dunia (Project IPAS Kelas 6)
 * Murni merender file gambar asli PLESIR.png tanpa pengubahan apa pun.
 */
export function renderPlesirStripOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _collage: CollageType
) {
  // Jika gambar PLESIR.png sudah dimuat, render gambar mentah 100% tanpa ubahan
  if (cachedPlesirImg && cachedPlesirImg.complete && cachedPlesirImg.naturalWidth > 0) {
    ctx.drawImage(cachedPlesirImg, 0, 0, width, height);
    return;
  }

  // Jika belum dimuat atau belum diunggah, coba muat ulang
  loadPlesirImage();
}

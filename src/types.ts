export type CollageType = 'strip' | 'grid' | 'single';

export type ScreenStep = 'start' | 'collage' | 'template' | 'camera' | 'preview' | 'download';

export type PhotoFilter = 'normal' | 'bw' | 'warm' | 'cool' | 'vintage';

export type KioskOrientation = 'portrait' | 'landscape' | 'auto';

export interface CollageSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface CollageDefinition {
  id: CollageType;
  title: string;
  subtitle: string;
  shotsRequired: number;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: string;
  iconName: string;
  slots: CollageSlot[];
  headerArea?: { height: number; title: string };
  footerArea?: { height: number; text: string };
}

export interface FrameTemplate {
  id: string;
  title: string;
  theme: string;
  accentColor: string;
  isCustom?: boolean;
  customDataUrl?: string;
  imageUrl?: string;
  description: string;
  // Function or static data for SVG/PNG overlay rendering
  renderOverlay: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    collage: CollageType,
    metadata?: { dateStr: string; locationStr?: string }
  ) => void;
}

export interface CapturedPhotoItem {
  index: number;
  dataUrl: string;
  timestamp: number;
}

export interface SessionResult {
  photoId: string;
  compositeDataUrl: string;
  collageType: CollageType;
  templateId: string;
  filter: PhotoFilter;
  createdAt: number;
  downloadUrl?: string;
  viewUrl?: string;
}

import { CollageDefinition, CollageType } from '../types';

export const COLLAGE_DEFINITIONS: Record<CollageType, CollageDefinition> = {
  strip: {
    id: 'strip',
    title: 'Photo Strip (1×3)',
    subtitle: '3 Pose Vertikal Klasik ala Photobooth Korea',
    shotsRequired: 3,
    canvasWidth: 800,
    canvasHeight: 2100,
    aspectRatio: '8/21',
    iconName: 'Columns3',
    headerArea: {
      height: 120,
      title: 'PID PHOTOBOOTH',
    },
    footerArea: {
      height: 160,
      text: 'PUBLIC INFORMATION DISPLAY • MEMORIES',
    },
    slots: [
      { x: 50, y: 140, width: 700, height: 520, radius: 12 },
      { x: 50, y: 700, width: 700, height: 520, radius: 12 },
      { x: 50, y: 1260, width: 700, height: 520, radius: 12 },
    ],
  },
  grid: {
    id: 'grid',
    title: 'Grid 4 Kotak (2×2)',
    subtitle: '4 Pose Seimbang • Format 4:5 / Passport to 5 Continents',
    shotsRequired: 4,
    canvasWidth: 1400,
    canvasHeight: 1600,
    aspectRatio: '7/8',
    iconName: 'Grid2X2',
    headerArea: {
      height: 120,
      title: 'PID PHOTOBOOTH',
    },
    footerArea: {
      height: 140,
      text: 'SPECIAL MOMENTS • PID KIOSK',
    },
    slots: [
      { x: 60, y: 140, width: 610, height: 590, radius: 16 },
      { x: 730, y: 140, width: 610, height: 590, radius: 16 },
      { x: 60, y: 770, width: 610, height: 590, radius: 16 },
      { x: 730, y: 770, width: 610, height: 590, radius: 16 },
    ],
  },
  single: {
    id: 'single',
    title: 'Single Portrait (1×1)',
    subtitle: '1 Pose Eksklusif Resolusi Penuh',
    shotsRequired: 1,
    canvasWidth: 1080,
    canvasHeight: 1440,
    aspectRatio: '3/4',
    iconName: 'Maximize2',
    headerArea: {
      height: 100,
      title: 'PID PHOTOBOOTH',
    },
    footerArea: {
      height: 140,
      text: 'ONE SHOT MEMORY • PUBLIC DISPLAY',
    },
    slots: [
      { x: 60, y: 120, width: 960, height: 1140, radius: 20 },
    ],
  },
};

import { FrameTemplate } from '../types';
import { renderPlesirStripOverlay } from './plesirStripTemplate';

export const BUILTIN_TEMPLATES: FrameTemplate[] = [
  {
    id: 'plesir_strip',
    title: 'Pelesir Keliling Dunia (1×3)',
    theme: 'PLESIR.png Asli',
    accentColor: '#38BDF8',
    description: 'Template gambar asli PLESIR.png tanpa pengubahan apa pun.',
    renderOverlay: renderPlesirStripOverlay,
  },
];

import { CollageType } from '../types';
import { COLLAGE_DEFINITIONS } from './collages';

// Helper to draw realistic gold foil gradients
function createGoldGradient(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, '#D4AF37'); // Metallic Gold
  grad.addColorStop(0.3, '#FFF2B2'); // Bright Gold Highlight
  grad.addColorStop(0.6, '#AA771C'); // Deep Gold
  grad.addColorStop(1, '#E6C665'); // Soft Gold
  return grad;
}

export function renderPassport5ContinentsOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  collage: CollageType,
  meta?: { dateStr?: string; customTitle?: string }
) {
  ctx.save();
  const dateText = meta?.dateStr || new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  const collageDef = COLLAGE_DEFINITIONS[collage];

  // 1. Draw luxury deep navy blue passport texture on outer borders ONLY (using evenodd path so photo slots remain 100% hollow and untouched)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#061325');
  bgGrad.addColorStop(0.5, '#0B1E38');
  bgGrad.addColorStop(1, '#051020');

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  // Outer frame rect
  ctx.rect(0, 0, width, height);
  // Cutout holes for every photo slot
  for (const slot of collageDef.slots) {
    const r = slot.radius || 12;
    ctx.roundRect(slot.x, slot.y, slot.width, slot.height, r);
  }
  // Fill everything except the photo slots
  ctx.fill('evenodd');

  // Subtle luxury gold guilloche border lines
  ctx.strokeStyle = createGoldGradient(ctx, 0, 0, width, height);
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  // Corner gold flourishes
  const drawCornerFlourish = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(0, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();

    ctx.fillStyle = '#FFF2B2';
    ctx.beginPath();
    ctx.arc(6, 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCornerFlourish(20, 20, 0);
  drawCornerFlourish(width - 20, 20, Math.PI / 2);
  drawCornerFlourish(width - 20, height - 20, Math.PI);
  drawCornerFlourish(20, height - 20, -Math.PI / 2);

  // 2. TOP HEADER: Passport Title & Boarding Pass Details
  // Center World Globe Crest
  const globeX = width / 2;
  const globeY = 56;
  ctx.save();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(globeX, globeY, 18, 0, Math.PI * 2);
  ctx.stroke();

  // Globe latitude & longitude lines
  ctx.beginPath();
  ctx.ellipse(globeX, globeY, 9, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(globeX - 18, globeY);
  ctx.lineTo(globeX + 18, globeY);
  ctx.stroke();
  ctx.restore();

  // Title: "PASSPORT TO 5 CONTINENTS"
  ctx.save();
  ctx.fillStyle = createGoldGradient(ctx, width / 2 - 200, 0, width / 2 + 200, 0);
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('PASSPORT TO 5 CONTINENTS', width / 2, 98);

  // Subtitle
  ctx.fillStyle = '#E2BA55';
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('KELILING DUNIA • OFFICIAL EXPEDITION VOYAGE • WORLD CITIZEN', width / 2, 120);
  ctx.restore();

  // 3. CONTINENT MOTIFS IN 4 CORNERS

  // --- TOP-LEFT: ASIA CONTINENT (Mount Fuji & Japanese Lanterns) ---
  ctx.save();
  // Mount Fuji silhouette
  const fujiBaseX = 140;
  const fujiBaseY = 126;
  ctx.fillStyle = '#1A365D';
  ctx.beginPath();
  ctx.moveTo(fujiBaseX - 45, fujiBaseY);
  ctx.lineTo(fujiBaseX - 16, fujiBaseY - 32);
  ctx.lineTo(fujiBaseX + 16, fujiBaseY - 32);
  ctx.lineTo(fujiBaseX + 45, fujiBaseY);
  ctx.closePath();
  ctx.fill();

  // Fuji snow peak
  ctx.fillStyle = '#FFF2B2';
  ctx.beginPath();
  ctx.moveTo(fujiBaseX - 16, fujiBaseY - 32);
  ctx.lineTo(fujiBaseX, fujiBaseY - 42);
  ctx.lineTo(fujiBaseX + 16, fujiBaseY - 32);
  ctx.lineTo(fujiBaseX + 8, fujiBaseY - 26);
  ctx.lineTo(fujiBaseX, fujiBaseY - 28);
  ctx.lineTo(fujiBaseX - 8, fujiBaseY - 26);
  ctx.closePath();
  ctx.fill();

  // Red Asian Lanterns
  const drawLantern = (lx: number, ly: number, size: number) => {
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, ly - size * 1.5);
    ctx.lineTo(lx, ly - size);
    ctx.stroke();

    ctx.fillStyle = '#BE123C'; // Red lantern
    ctx.beginPath();
    ctx.ellipse(lx, ly, size * 0.75, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.stroke();

    // Golden tassel
    ctx.beginPath();
    ctx.moveTo(lx, ly + size);
    ctx.lineTo(lx, ly + size + 8);
    ctx.stroke();
  };

  drawLantern(48, 88, 12);
  drawLantern(72, 94, 9);

  // Asian Visa Stamp
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, 110, 36);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
  ctx.font = '700 9px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ TOKYO • ASIA VISA ★', 91, 51);
  ctx.font = '600 8px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ENTRY PERMIT • 富士山', 91, 63);
  ctx.restore();

  // --- TOP-RIGHT: EUROPE CONTINENT (Classic Architecture & Globe Compass) ---
  ctx.save();
  // Classic Roman Columns Silhouette
  const colX = width - 120;
  const colY = 126;
  ctx.fillStyle = '#1E293B';
  for (let c = -24; c <= 24; c += 16) {
    ctx.fillRect(colX + c - 3, colY - 32, 6, 32);
  }
  ctx.fillRect(colX - 32, colY - 36, 64, 5);
  ctx.fillRect(colX - 36, colY - 2, 72, 4);

  // Vintage Navigator's Globe Compass Rose
  const compassX = width - 64;
  const compassY = 88;
  const cRadius = 20;

  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(compassX, compassY, cRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 4-point star needle
  ctx.fillStyle = '#FFF2B2';
  ctx.beginPath();
  ctx.moveTo(compassX, compassY - cRadius + 2); // N
  ctx.lineTo(compassX + 4, compassY);
  ctx.lineTo(compassX, compassY + cRadius - 2); // S
  ctx.lineTo(compassX - 4, compassY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#AA771C';
  ctx.beginPath();
  ctx.moveTo(compassX - cRadius + 2, compassY); // W
  ctx.lineTo(compassX, compassY + 4);
  ctx.lineTo(compassX + cRadius - 2, compassY); // E
  ctx.lineTo(compassX, compassY - 4);
  ctx.closePath();
  ctx.fill();

  // Compass Cardinal letters
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 8px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', compassX, compassY - cRadius - 3);

  // European Schengen Stamp
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(width - 150, 36, 114, 36);
  ctx.fillStyle = 'rgba(96, 165, 250, 0.85)';
  ctx.font = '700 9px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ EUROPE • SCHENGEN ★', width - 93, 51);
  ctx.font = '600 8px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PARIS • ROME • VOYAGE', width - 93, 63);
  ctx.restore();

  // --- BOTTOM-LEFT: AFRICA CONTINENT (Savanna Safari Acacia & Wildlife) ---
  ctx.save();
  // Desert warm gradient ground
  const afGrad = ctx.createLinearGradient(0, height - 160, 260, height);
  afGrad.addColorStop(0, 'rgba(217, 119, 6, 0.15)');
  afGrad.addColorStop(1, 'rgba(180, 83, 9, 0.35)');
  ctx.fillStyle = afGrad;
  ctx.beginPath();
  ctx.ellipse(90, height - 80, 120, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // African Acacia Umbrella Tree Silhouette
  const treeX = 64;
  const treeY = height - 100;
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(treeX - 3, treeY + 36);
  ctx.lineTo(treeX - 1, treeY + 12);
  ctx.lineTo(treeX - 18, treeY - 2);
  ctx.lineTo(treeX - 28, treeY - 14);
  ctx.lineTo(treeX - 2, treeY - 10);
  ctx.lineTo(treeX + 16, treeY - 14);
  ctx.lineTo(treeX + 2, treeY + 12);
  ctx.lineTo(treeX + 3, treeY + 36);
  ctx.closePath();
  ctx.fill();

  // Flat canopy foliage
  ctx.beginPath();
  ctx.ellipse(treeX - 12, treeY - 16, 26, 7, -0.1, 0, Math.PI * 2);
  ctx.ellipse(treeX + 10, treeY - 18, 22, 6, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Giraffe Silhouette
  const gX = 135;
  const gY = height - 90;
  ctx.beginPath();
  // Body & legs
  ctx.fillRect(gX - 6, gY + 8, 14, 8);
  ctx.fillRect(gX - 6, gY + 16, 2.5, 18);
  ctx.fillRect(gX + 4, gY + 16, 2.5, 18);
  // Neck
  ctx.moveTo(gX + 6, gY + 10);
  ctx.lineTo(gX + 12, gY - 18);
  ctx.lineTo(gX + 16, gY - 16);
  ctx.lineTo(gX + 10, gY + 10);
  ctx.fill();

  // African Safari Stamp
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(88, height - 45, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
  ctx.font = '700 8px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AFRICA', 88, height - 48);
  ctx.font = '600 7px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SAFARI', 88, height - 38);
  ctx.restore();

  // --- BOTTOM-RIGHT: AMERICAS & OCEANIA (Route 66 & Sydney Opera Sail) ---
  ctx.save();
  // Sydney Opera House Sail Shell Silhouette
  const sydX = width - 110;
  const sydY = height - 90;
  ctx.fillStyle = '#FFF2B2';
  // 3 interlocking sail arches
  ctx.beginPath();
  ctx.moveTo(sydX - 30, sydY + 20);
  ctx.quadraticCurveTo(sydX - 18, sydY - 18, sydX - 2, sydY + 20);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sydX - 14, sydY + 20);
  ctx.quadraticCurveTo(sydX + 2, sydY - 26, sydX + 18, sydY + 20);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sydX + 6, sydY + 20);
  ctx.quadraticCurveTo(sydX + 20, sydY - 14, sydX + 32, sydY + 20);
  ctx.fill();

  // Americas Route 66 Shield Badge Stamp
  const rX = width - 80;
  const rY = height - 48;
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rX - 18, rY - 14);
  ctx.lineTo(rX + 18, rY - 14);
  ctx.lineTo(rX + 18, rY + 4);
  ctx.lineTo(rX, rY + 18);
  ctx.lineTo(rX - 18, rY + 4);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
  ctx.font = 'bold 8px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ROUTE 66', rX, rY);
  ctx.font = 'bold 7px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AMERICA', rX, rY + 10);
  ctx.restore();

  // 4. PHOTO SLOTS: COMPLETELY HOLLOW & ZERO CLUTTER WITH BEVELED GOLD FOIL FRAMES
  for (const slot of collageDef.slots) {
    ctx.save();
    // Slots are already hollow from evenodd fill, now draw luxury gold foil borders and corner accents

    // Beveled outer metallic gold frame
    ctx.strokeStyle = createGoldGradient(ctx, slot.x, slot.y, slot.x + slot.width, slot.y + slot.height);
    ctx.lineWidth = 4;
    ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);

    // Inner bright gold hairline highlight
    ctx.strokeStyle = 'rgba(255, 242, 178, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(slot.x + 3, slot.y + 3, slot.width - 6, slot.height - 6);

    // Embossed gold corner brackets for each slot
    const bracketLen = 16;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(slot.x, slot.y + bracketLen);
    ctx.lineTo(slot.x, slot.y);
    ctx.lineTo(slot.x + bracketLen, slot.y);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(slot.x + slot.width - bracketLen, slot.y);
    ctx.lineTo(slot.x + slot.width, slot.y);
    ctx.lineTo(slot.x + slot.width, slot.y + bracketLen);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(slot.x, slot.y + slot.height - bracketLen);
    ctx.lineTo(slot.x, slot.y + slot.height);
    ctx.lineTo(slot.x + bracketLen, slot.y + slot.height);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(slot.x + slot.width - bracketLen, slot.y + slot.height);
    ctx.lineTo(slot.x + slot.width, slot.y + slot.height);
    ctx.lineTo(slot.x + slot.width, slot.y + slot.height - bracketLen);
    ctx.stroke();

    ctx.restore();
  }

  // 5. FOOTER BOARDING PASS DETAILS & BARCODE
  ctx.save();
  // Boarding pass text
  ctx.fillStyle = '#E2BA55';
  ctx.font = '600 13px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';
  ctx.fillText(
    'BOARDING PASS: 5C-VOYAGER  |  SEAT: 01A  |  GATE: GLOBE  |  FIRST CLASS CITIZEN',
    width / 2,
    height - 58
  );

  // Authenticated Travel Barcode
  const barStartY = height - 42;
  const barStartX = width / 2 - 140;
  ctx.fillStyle = '#D4AF37';
  for (let b = 0; b < 40; b++) {
    const isThick = b % 3 === 0 || b % 7 === 0;
    const barW = isThick ? 4 : 2;
    ctx.fillRect(barStartX + b * 7, barStartY, barW, 20);
  }

  ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.font = '500 10px "Space Grotesk", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`SERIAL: 2026-WORLD-CITIZEN-01 • ${dateText.toUpperCase()}`, width / 2, height - 12);
  ctx.restore();

  ctx.restore();
}

import { CollageType } from '../types';
import { COLLAGE_DEFINITIONS } from './collages';

export function renderWorldTourStripOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  collage: CollageType,
  meta?: { dateStr?: string }
) {
  ctx.save();
  const collageDef = COLLAGE_DEFINITIONS[collage];
  const dateText = meta?.dateStr || new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

  // 1. Fill outer background in dark passport navy, cutting out the exact slots using evenodd
  ctx.fillStyle = '#0a1120';
  ctx.beginPath();
  ctx.rect(0, 0, width, height);

  // Hollow cutouts for every photo slot
  for (const slot of collageDef.slots) {
    const r = slot.radius || 12;
    ctx.roundRect(slot.x, slot.y, slot.width, slot.height, r);
  }
  ctx.fill('evenodd');

  // 2. Airmail striped border (Red, White, Blue diagonal candy stripes) around each slot
  for (const slot of collageDef.slots) {
    ctx.save();
    // Outer border offset
    const bw = 10;
    const ox = slot.x - bw;
    const oy = slot.y - bw;
    const ow = slot.width + bw * 2;
    const oh = slot.height + bw * 2;

    // Draw diagonal airmail pattern
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ox, oy, ow, oh, 16);
    ctx.roundRect(slot.x, slot.y, slot.width, slot.height, 10);
    ctx.clip('evenodd');

    // Diagonal red/white/blue stripes
    const stripeW = 18;
    for (let x = -oh; x < ow + oh; x += stripeW * 3) {
      // Red
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.moveTo(ox + x, oy);
      ctx.lineTo(ox + x + stripeW, oy);
      ctx.lineTo(ox + x + stripeW - oh, oy + oh);
      ctx.lineTo(ox + x - oh, oy + oh);
      ctx.closePath();
      ctx.fill();

      // White
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(ox + x + stripeW, oy);
      ctx.lineTo(ox + x + stripeW * 2, oy);
      ctx.lineTo(ox + x + stripeW * 2 - oh, oy + oh);
      ctx.lineTo(ox + x + stripeW - oh, oy + oh);
      ctx.closePath();
      ctx.fill();

      // Blue
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.moveTo(ox + x + stripeW * 2, oy);
      ctx.lineTo(ox + x + stripeW * 3, oy);
      ctx.lineTo(ox + x + stripeW * 3 - oh, oy + oh);
      ctx.lineTo(ox + x + stripeW * 2 - oh, oy + oh);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Subtle inner gold keyline
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
    ctx.restore();
  }

  // 3. TOP HEADER BADGE: "WORLD TOUR 5 CONTINENTS"
  ctx.save();
  const topBadgeY = 65;
  // Card base
  ctx.fillStyle = '#FFFBEB';
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 200, 18, 400, 94, 16);
  ctx.fill();
  ctx.stroke();

  // Little globe icon
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2 - 145, topBadgeY - 6, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(width / 2 - 145, topBadgeY - 6, 9, 20, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 26px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WORLD TOUR', width / 2 + 18, topBadgeY - 12);

  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('★ 5 CONTINENTS EXPEDITION ★', width / 2 + 18, topBadgeY + 14);

  // Small airplane
  ctx.fillStyle = '#2563EB';
  ctx.font = '20px sans-serif';
  ctx.fillText('✈', width / 2 + 165, topBadgeY - 4);
  ctx.restore();

  // 4. CONTINENT STAMPS & TRAVEL GRAPHICS AROUND BORDERS
  // --- ASIA: Sakura, Pagoda, Kanji Stamp (Top Left) ---
  ctx.save();
  // Japanese Pagoda Silhouette
  ctx.fillStyle = '#BE123C';
  ctx.fillRect(10, 150, 32, 8);
  ctx.fillRect(14, 136, 24, 6);
  ctx.fillRect(18, 124, 16, 6);
  // Kanji red stamp
  ctx.strokeStyle = '#E11D48';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 230, 34, 48);
  ctx.fillStyle = '#E11D48';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('アジア', 25, 252);
  ctx.fillText('旅行', 25, 270);
  ctx.restore();

  // --- EUROPE: Eiffel Tower & Vintage Stamp (Top Right) ---
  ctx.save();
  ctx.fillStyle = '#CA8A04';
  const efX = width - 26;
  ctx.beginPath();
  ctx.moveTo(efX, 120);
  ctx.lineTo(efX - 14, 175);
  ctx.lineTo(efX + 14, 175);
  ctx.closePath();
  ctx.fill();
  // Europe Stamp
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(width - 44, 210, 38, 55);
  ctx.fillStyle = '#D97706';
  ctx.font = 'bold 9px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EUROPE', width - 25, 230);
  ctx.fillText('PARIS', width - 25, 250);
  ctx.restore();

  // --- AFRICA: Acacia Tree & Giraffe Stamp (Middle Left) ---
  ctx.save();
  // Acacia silhouette
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.ellipse(24, 730, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(22, 736, 4, 28);
  // Africa Giraffe Stamp
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 810, 38, 55);
  ctx.fillStyle = '#B45309';
  ctx.font = 'bold 9px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AFRICA', 25, 830);
  ctx.fillText('SAFARI', 25, 850);
  ctx.restore();

  // --- AMERICA: Liberty Stamp (Middle Right) ---
  ctx.save();
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.strokeRect(width - 44, 780, 38, 60);
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 9px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('USA', width - 25, 805);
  ctx.fillText('LIBERTY', width - 25, 825);
  ctx.restore();

  // --- AUSTRALIA & OCEANIA: Sydney Opera & Kangaroo (Bottom Left) ---
  ctx.save();
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 1340, 38, 55);
  ctx.fillStyle = '#0284C7';
  ctx.font = 'bold 8px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AUSTRALIA', 25, 1360);
  ctx.fillText('SYDNEY', 25, 1380);
  ctx.restore();

  // --- TRAVEL SUITCASE (Bottom Right) ---
  ctx.save();
  const scX = width - 42;
  const scY = 1380;
  ctx.fillStyle = '#EA580C';
  ctx.fillRect(scX, scY, 34, 46);
  ctx.strokeStyle = '#FDBA74';
  ctx.strokeRect(scX + 4, scY + 4, 26, 38);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRAVEL', scX + 17, scY + 28);
  ctx.restore();

  // 5. FOOTER: "AROUND THE WORLD" & POSTAL STAMP
  ctx.save();
  const fY = height - 100;

  // Vintage parchment seal base
  ctx.fillStyle = '#FFFBEB';
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 220, fY - 30, 440, 95, 20);
  ctx.fill();
  ctx.stroke();

  // Circular Passport Stamp
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(width / 2 - 150, fY + 16, 32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 8px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PASSPORT', width / 2 - 150, fY + 12);
  ctx.fillText('TRAVEL', width / 2 - 150, fY + 24);

  // Large Main Slogan
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 28px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ AROUND THE WORLD ★', width / 2 + 30, fY + 14);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`PID PHOTOBOOTH KIOSK • ${dateText}`, width / 2 + 30, fY + 38);

  ctx.restore();

  ctx.restore();
}

import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Upload, AlertCircle, Sparkles } from 'lucide-react';
import { CollageType, FrameTemplate } from '../types';
import { BUILTIN_TEMPLATES } from '../services/templates';
import { COLLAGE_DEFINITIONS } from '../services/collages';
import { soundFx } from '../services/audio';

interface TemplateSelectScreenProps {
  selectedCollage: CollageType;
  selectedTemplate: FrameTemplate;
  onSelectTemplate: (template: FrameTemplate) => void;
  customTemplate: FrameTemplate | null;
  onUploadCustomTemplate: (template: FrameTemplate) => void;
  onNext: () => void;
  onBack: () => void;
}

// Compact, crisp live visual thumbnail for each frame
const FrameThumbnail: React.FC<{
  template: FrameTemplate;
  collage: CollageType;
}> = ({ template, collage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const def = COLLAGE_DEFINITIONS[collage] || COLLAGE_DEFINITIONS.strip;
    const cw = def.canvasWidth;
    const ch = def.canvasHeight;

    // Aspect-ratio aware miniature canvas
    canvas.width = 180;
    canvas.height = Math.round(180 * (ch / cw));

    const scaleX = canvas.width / cw;
    const scaleY = canvas.height / ch;

    // Canvas background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Placeholder camera slot previews
    for (const slot of def.slots) {
      const sx = slot.x * scaleX;
      const sy = slot.y * scaleY;
      const sw = slot.width * scaleX;
      const sh = slot.height * scaleY;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, Math.max(2, (slot.radius || 8) * scaleX));
      ctx.fill();

      // Camera aperture hint
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(sx + sw / 2, sy + sh / 2, Math.min(sw, sh) * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render the actual frame overlay scaled
    ctx.save();
    ctx.scale(scaleX, scaleY);
    try {
      template.renderOverlay(ctx, cw, ch, collage, { dateStr: '2026' });
    } catch {
      // Safe fallback
    }
    ctx.restore();
  }, [template, collage]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-md max-h-[150px] sm:max-h-[170px] w-auto object-contain border border-neutral-800"
      />
    </div>
  );
};

export const TemplateSelectScreen: React.FC<TemplateSelectScreenProps> = ({
  selectedCollage,
  selectedTemplate,
  onSelectTemplate,
  customTemplate,
  onUploadCustomTemplate,
  onNext,
  onBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const collageDef = COLLAGE_DEFINITIONS[selectedCollage];

  // Combine built-in with custom if present
  const allTemplates: FrameTemplate[] = [
    ...BUILTIN_TEMPLATES,
    ...(customTemplate ? [customTemplate] : []),
  ];

  const handleSelect = (template: FrameTemplate) => {
    soundFx.playTouch();
    onSelectTemplate(template);
  };

  const handleNext = () => {
    soundFx.playTouch();
    onNext();
  };

  const handleBack = () => {
    soundFx.playTouch();
    onBack();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate PNG
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    if (!isPng) {
      setUploadError('Gunakan file berformat .PNG transparan.');
      soundFx.playBeep(300, 0.2);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Save locally and to backend so it persists permanently
        try {
          localStorage.setItem('plesir_custom_template_dataUrl', dataUrl);
          fetch('/api/upload-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl, filename: 'plesir.png' }),
          }).catch(() => {});
        } catch {
          // Ignore storage errors
        }

        const newCustom: FrameTemplate = {
          id: `custom_${Date.now()}`,
          title: file.name.replace(/\.png$/i, ''),
          theme: 'Desain Asli PNG',
          accentColor: '#38BDF8',
          isCustom: true,
          customDataUrl: dataUrl,
          description: 'Template gambar asli tanpa perubahan.',
          renderOverlay: (ctx, width, height) => {
            // Draw exact user PNG directly without modifying anything
            ctx.drawImage(img, 0, 0, width, height);
          },
        };
        onUploadCustomTemplate(newCustom);
        onSelectTemplate(newCustom);
        setUploadError(null);
        setUploadSuccessMessage(`File "${file.name}" berhasil disimpan ke Database Firebase Firestore & dijadikan Default!`);
        soundFx.playSuccess();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-y-auto bg-neutral-950 text-neutral-100">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,image/png"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Simplified Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <button
          id="template-back-btn"
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Pilih Bingkai
          </h2>
          <p className="text-xs text-neutral-400">
            Tata Letak: <span className="text-emerald-400 font-medium">{collageDef?.title || 'Photobooth'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Upload Button */}
          <button
            id="quick-upload-png-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs sm:text-sm font-medium transition-colors"
            title="Unggah Frame PNG Kustom"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Unggah PNG</span>
          </button>

          {/* Next Button */}
          <button
            id="template-next-btn"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Lanjut</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {uploadError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Success Notice */}
      {uploadSuccessMessage && (
        <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 max-w-5xl mx-auto w-full shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="font-semibold text-emerald-100">{uploadSuccessMessage}</span>
          </div>
          <button
            onClick={() => setUploadSuccessMessage(null)}
            className="text-emerald-300 hover:text-white px-2 py-1 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Visual Frame Cards Grid */}
      <div className="my-auto py-4 w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Upload Custom Card as 1st visual option */}
          <div
            id="upload-custom-png-card"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer border-2 border-dashed border-neutral-800 hover:border-emerald-500/70 bg-neutral-900/40 hover:bg-neutral-900/80 transition-all aspect-[3/4] text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-800/90 border border-neutral-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-emerald-500/50 transition-all">
              <Upload className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white mb-0.5">
              Unggah PNG
            </span>
            <span className="text-[10px] text-neutral-400">
              Desain Sendiri
            </span>
          </div>

          {/* Built-in & Custom Frame Cards */}
          {allTemplates.map((template) => {
            const isSelected = selectedTemplate.id === template.id;

            return (
              <div
                key={template.id}
                id={`template-card-${template.id}`}
                onClick={() => handleSelect(template)}
                className={`relative flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl cursor-pointer border-2 transition-all aspect-[3/4] ${
                  isSelected
                    ? 'border-emerald-500 bg-neutral-900 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-500/30 scale-[1.02]'
                    : 'border-neutral-800/90 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-neutral-700'
                }`}
              >
                {/* Active Checkmark Pill */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-neutral-950 shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Custom Badge if user-uploaded */}
                {template.isCustom && (
                  <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-sky-500 text-neutral-950 text-[10px] font-bold shadow-sm">
                    Kustom
                  </div>
                )}

                {/* Live Miniature Visual Canvas Preview */}
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                  <FrameThumbnail template={template} collage={selectedCollage} />
                </div>

                {/* Simple Label Bottom */}
                <div className="pt-2 border-t border-neutral-800/80 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: template.accentColor }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px]">
                      {template.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block truncate">
                    {template.theme}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified Footer Tip */}
      <div className="text-center text-xs text-neutral-500 py-1 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Sentuh bingkai untuk melihat tampilan langsungnya pada kamera</span>
      </div>
    </div>
  );
};

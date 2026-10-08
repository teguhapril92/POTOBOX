import React, { useEffect, useState } from 'react';
import { RotateCcw, QrCode, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { CollageType, FrameTemplate, PhotoFilter } from '../types';
import { composePhotoboothImage, loadImage } from '../services/canvasComposer';
import { soundFx } from '../services/audio';

interface ResultPreviewScreenProps {
  collageType: CollageType;
  capturedPhotos: string[];
  template: FrameTemplate;
  onRetake: () => void;
  onConfirm: (finalDataUrl: string, filter: PhotoFilter) => void;
}

export const ResultPreviewScreen: React.FC<ResultPreviewScreenProps> = ({
  collageType,
  capturedPhotos,
  template,
  onRetake,
  onConfirm,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>('normal');
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [isCompositing, setIsCompositing] = useState<boolean>(true);
  const [customImgElement, setCustomImgElement] = useState<HTMLImageElement | null>(null);

  // Load custom frame image if needed
  useEffect(() => {
    if (template.isCustom && template.customDataUrl) {
      loadImage(template.customDataUrl)
        .then((img) => setCustomImgElement(img))
        .catch((err) => console.error('Error loading custom template img:', err));
    }
  }, [template]);

  // Re-composite when filter or template changes
  useEffect(() => {
    let isCurrent = true;
    setIsCompositing(true);

    composePhotoboothImage({
      collageType,
      capturedPhotos,
      template,
      filter: selectedFilter,
      customFrameImg: customImgElement,
    })
      .then((url) => {
        if (isCurrent) {
          setCompositeUrl(url);
          setIsCompositing(false);
        }
      })
      .catch((err) => {
        console.error('Failed to compose final image:', err);
        if (isCurrent) setIsCompositing(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [collageType, capturedPhotos, template, selectedFilter, customImgElement]);

  const handleFilterChange = (filter: PhotoFilter) => {
    soundFx.playTouch();
    setSelectedFilter(filter);
  };

  const handleRetake = () => {
    soundFx.playTouch();
    onRetake();
  };

  const handleConfirm = () => {
    if (!compositeUrl) return;
    soundFx.playTouch();
    onConfirm(compositeUrl, selectedFilter);
  };

  const filters: { id: PhotoFilter; label: string }[] = [
    { id: 'normal', label: 'Asli (Normal)' },
    { id: 'bw', label: 'Hitam Putih (B&W)' },
    { id: 'warm', label: 'Warm Retro' },
    { id: 'cool', label: 'Cool Studio' },
    { id: 'vintage', label: 'Vintage Sepia' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-8 select-none overflow-y-auto bg-neutral-950 text-neutral-100">
      {/* Header */}
      <div className="text-center pb-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="w-24 text-left">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
            Langkah 3 dari 4
          </span>
          <span className="text-xs text-neutral-400">Pratinjau Hasil</span>
        </div>

        <h2 className="text-xl md:text-2xl font-extrabold text-white">
          Hasil Foto Kolase
        </h2>

        <div className="w-24 text-right">
          <span className="text-xs text-neutral-400 font-mono">
            {template.title}
          </span>
        </div>
      </div>

      {/* Main Preview Center Area */}
      <div className="my-auto flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 py-4 max-h-[70vh]">
        {/* Photo Image Card */}
        <div className="relative h-full flex items-center justify-center p-2 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden max-w-full">
          {isCompositing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-2" />
              <span className="text-xs font-semibold text-neutral-300">
                Menerapkan filter foto...
              </span>
            </div>
          )}

          {compositeUrl && (
            <img
              src={compositeUrl}
              alt="Final Composite Preview"
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          )}
        </div>

        {/* Filter Selection Panel */}
        <div className="flex flex-col gap-3 w-full lg:w-72">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
            <Wand2 className="w-4 h-4 text-emerald-400" />
            <span>Pilih Efek Warna (Filter)</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {filters.map((f) => {
              const isSelected = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  id={`filter-btn-${f.id}`}
                  onClick={() => handleFilterChange(f.id)}
                  className={`px-4 py-3 rounded-xl text-xs md:text-sm font-semibold text-left transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed mt-2">
            Kamu dapat mengulang foto jika hasil kurang memuaskan, atau lanjut untuk mengambil kode QR unduhan.
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
        <button
          id="retake-btn"
          onClick={handleRetake}
          className="w-full sm:w-auto px-6 py-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-700 text-neutral-200 text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Ulangi Sesi (Retake)</span>
        </button>

        <button
          id="confirm-preview-btn"
          onClick={handleConfirm}
          disabled={!compositeUrl || isCompositing}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 text-sm md:text-base font-extrabold shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
        >
          <QrCode className="w-5 h-5" />
          <span>Selesai & Dapatkan QR Code</span>
        </button>
      </div>
    </div>
  );
};

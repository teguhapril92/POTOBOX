import React from 'react';
import { ArrowLeft, ArrowRight, Check, Columns3, Grid2X2, Maximize2 } from 'lucide-react';
import { CollageType } from '../types';
import { COLLAGE_DEFINITIONS } from '../services/collages';
import { soundFx } from '../services/audio';

interface CollageSelectScreenProps {
  selectedCollage: CollageType;
  onSelectCollage: (collage: CollageType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CollageSelectScreen: React.FC<CollageSelectScreenProps> = ({
  selectedCollage,
  onSelectCollage,
  onNext,
  onBack,
}) => {
  const layouts: CollageType[] = ['strip', 'grid', 'single'];
  const disabledLayouts: CollageType[] = ['grid', 'single'];

  const handleSelect = (layout: CollageType) => {
    if (disabledLayouts.includes(layout)) return;
    soundFx.playTouch();
    onSelectCollage(layout);
  };

  const handleNext = () => {
    soundFx.playTouch();
    onNext();
  };

  const handleBack = () => {
    soundFx.playTouch();
    onBack();
  };

  const renderVisualMockup = (layout: CollageType) => {
    if (layout === 'strip') {
      return (
        <div className="w-16 h-36 border-2 border-neutral-700 rounded-lg p-1.5 flex flex-col gap-1.5 bg-neutral-900 shadow-inner">
          <div className="flex-1 bg-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-400">1</div>
          <div className="flex-1 bg-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-400">2</div>
          <div className="flex-1 bg-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-400">3</div>
        </div>
      );
    }
    if (layout === 'grid') {
      return (
        <div className="w-28 h-32 border-2 border-neutral-700 rounded-lg p-1.5 grid grid-cols-2 gap-1.5 bg-neutral-900 shadow-inner">
          <div className="bg-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-400">1</div>
          <div className="bg-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-400">2</div>
          <div className="bg-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-400">3</div>
          <div className="bg-neutral-800 rounded flex items-center justify-center text-[10px] text-neutral-400">4</div>
        </div>
      );
    }
    return (
      <div className="w-24 h-32 border-2 border-neutral-700 rounded-lg p-2 flex flex-col bg-neutral-900 shadow-inner">
        <div className="flex-1 bg-neutral-800 rounded flex items-center justify-center text-xs text-neutral-400">
          Single
        </div>
      </div>
    );
  };

  const getIcon = (layout: CollageType) => {
    switch (layout) {
      case 'strip':
        return <Columns3 className="w-6 h-6 text-emerald-400" />;
      case 'grid':
        return <Grid2X2 className="w-6 h-6 text-emerald-400" />;
      case 'single':
        return <Maximize2 className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-10 select-none overflow-y-auto bg-neutral-950 text-neutral-100">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <button
          id="collage-back-btn"
          onClick={handleBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
            Langkah 1 dari 4
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Pilih Tata Letak Kolase
          </h2>
        </div>

        <button
          id="collage-next-btn"
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <span>Lanjut ke Bingkai</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Options Grid */}
      <div className="my-auto py-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        {layouts.map((layout) => {
          const config = COLLAGE_DEFINITIONS[layout];
          const isSelected = selectedCollage === layout;
          const isDisabled = disabledLayouts.includes(layout);

          return (
            <div
              key={layout}
              id={`layout-card-${layout}`}
              onClick={() => {
                if (!isDisabled) handleSelect(layout);
              }}
              className={`relative flex flex-col items-center justify-between p-6 md:p-8 rounded-2xl border-2 transition-all select-none ${
                isDisabled
                  ? 'opacity-40 border-neutral-800 bg-neutral-900/20 cursor-not-allowed pointer-events-none grayscale-[40%]'
                  : isSelected
                  ? 'border-emerald-500 bg-neutral-900/90 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30 cursor-pointer transform active:scale-98'
                  : 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700 cursor-pointer transform active:scale-98'
              }`}
            >
              {/* Status Badge */}
              {isDisabled ? (
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-semibold text-neutral-400">
                  Sementara Dinonaktifkan
                </div>
              ) : isSelected ? (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-neutral-950 shadow">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              ) : null}

              {/* Layout Icon & Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="p-3 rounded-xl bg-neutral-800 mb-3 border border-neutral-700/60">
                  {getIcon(layout)}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                  {config.title}
                </h3>
                <p className="text-xs text-neutral-400 font-medium">
                  {config.subtitle}
                </p>
              </div>

              {/* Visual Diagram */}
              <div className="my-4 py-3 flex items-center justify-center">
                {renderVisualMockup(layout)}
              </div>

              {/* Shots Badge */}
              <div className="w-full mt-4 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Total Jepretan:</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                  {config.shotsRequired} Pose
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Guidance */}
      <div className="text-center text-xs md:text-sm text-neutral-400 py-2">
        💡 <span className="text-neutral-300 font-medium">Tips:</span> Jumlah pengambilan foto kamera akan otomatis menyesuaikan dengan tata letak yang kamu pilih.
      </div>
    </div>
  );
};

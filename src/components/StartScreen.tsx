import React, { useEffect, useState } from 'react';
import { Camera, Sparkles, Volume2, VolumeX, Maximize, RotateCcw, Monitor } from 'lucide-react';
import { KioskOrientation } from '../types';
import { soundFx } from '../services/audio';

interface StartScreenProps {
  onStart: () => void;
  orientation: KioskOrientation;
  onChangeOrientation: (o: KioskOrientation) => void;
  hasCameraPermission: boolean;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  orientation,
  onChangeOrientation,
  hasCameraPermission,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundFx.isEnabled());

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
    soundFx.playTouch();
  };

  const handleToggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playTouch();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCycleOrientation = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playTouch();
    if (orientation === 'portrait') onChangeOrientation('landscape');
    else if (orientation === 'landscape') onChangeOrientation('auto');
    else onChangeOrientation('portrait');
  };

  const handleClickStart = () => {
    soundFx.playTouch();
    // Pre-request camera permission on direct user touch gesture
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((s) => {
          s.getTracks().forEach((t) => t.stop());
        })
        .catch(() => {});
    }
    onStart();
  };

  return (
    <div
      id="start-screen"
      onClick={handleClickStart}
      className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 cursor-pointer select-none overflow-hidden bg-neutral-950 text-neutral-100"
    >
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        {/* Subtle grid pattern for PID aesthetic */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Bar: PID Header & Status */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-widest uppercase text-emerald-400">
              PID Interactive Kiosk
            </span>
            <span className="text-sm font-medium text-neutral-400">
              Photobooth Self-Service
            </span>
          </div>
        </div>

        {/* PID Screen Controls */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Orientation Switcher for PID evaluation */}
          <button
            id="orientation-toggle-btn"
            onClick={handleCycleOrientation}
            title="Ubah Orientasi Layar (Portrait / Landscape / Auto)"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
          >
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span className="capitalize">{orientation}</span>
          </button>

          {/* Audio toggle */}
          <button
            id="audio-toggle-btn"
            onClick={handleToggleSound}
            title="Audio Suara Kiosk"
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          {/* Fullscreen Kiosk */}
          <button
            id="fullscreen-toggle-btn"
            onClick={handleToggleFullscreen}
            title="Mode Kiosk Layar Penuh"
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
          >
            <Maximize className="w-4 h-4 text-neutral-300" />
          </button>
        </div>
      </header>

      {/* Center Hero: Big PID Touch Target */}
      <main className="relative z-10 my-auto flex flex-col items-center text-center max-w-2xl mx-auto">
        {/* Animated Camera Icon Box */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl animate-pulse" />
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl transition-transform transform group-hover:scale-105">
            <Camera className="w-14 h-14 md:w-18 md:h-18 text-emerald-400" strokeWidth={1.5} />
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-amber-300 animate-bounce" />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
          Photobooth PID
        </h1>

        <p className="text-neutral-400 text-base md:text-xl font-normal max-w-md mx-auto mb-10 leading-relaxed">
          Abadikan momen spesialmu. Pilih bingkai, berpose dengan timer otomatis, dan unduh nirkabel ke ponselmu.
        </p>

        {/* Giant Touch Button for PID Kiosk Screen */}
        <div className="w-full max-w-md">
          <button
            id="start-photobooth-btn"
            className="w-full py-5 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-lg md:text-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-98"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-neutral-950"></span>
            </span>
            Sentuh Layar untuk Mulai
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-neutral-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Resolusi HD
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Unduh via QR Code
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Format Kolase & Strip
          </span>
        </div>
      </main>

      {/* Footer: Live Date & Clock Bar */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-neutral-900 text-neutral-500 text-xs gap-3">
        <div className="flex items-center gap-4">
          <span className="font-mono text-neutral-400 font-medium text-sm">
            {timeStr || '12:00:00'}
          </span>
          <span className="text-neutral-600">•</span>
          <span>{dateStr || 'Hari ini'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-400">
            {hasCameraPermission ? 'Kamera PID Siap' : 'Inisialisasi Kamera...'}
          </span>
        </div>
      </footer>
    </div>
  );
};

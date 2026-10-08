import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  FlipHorizontal,
  ArrowLeft,
  Play,
  Sparkles,
  ExternalLink,
  Video,
  Check,
  Layers,
} from 'lucide-react';
import { CollageType, FrameTemplate } from '../types';
import { COLLAGE_DEFINITIONS } from '../services/collages';
import { soundFx } from '../services/audio';
import {
  CameraDevice,
  getAvailableCameras,
  requestCameraStream,
} from '../services/camera';

interface CameraSessionScreenProps {
  collageType: CollageType;
  template: FrameTemplate;
  onPhotosCaptured: (photos: string[]) => void;
  onCancel: () => void;
}

type SessionPhase = 'waiting' | 'countdown' | 'flash' | 'pause' | 'finished';

export const CameraSessionScreen: React.FC<CameraSessionScreenProps> = ({
  collageType,
  template,
  onPhotosCaptured,
  onCancel,
}) => {
  const collageDef = COLLAGE_DEFINITIONS[collageType];
  const totalShots = collageDef.shotsRequired;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const leftCanvasOverlayRef = useRef<HTMLCanvasElement>(null);

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);

  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(3);
  const [phase, setPhase] = useState<SessionPhase>('waiting');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [useVirtualCamera, setUseVirtualCamera] = useState<boolean>(false);
  const [simulationPose, setSimulationPose] = useState<number>(1);

  // Initialize or connect to camera
  const connectCamera = useCallback(async (deviceId?: string) => {
    setCameraLoading(true);
    setCameraError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const result = await requestCameraStream(deviceId);

    if (result.stream) {
      streamRef.current = result.stream;
      setActiveStream(result.stream);
      setUseVirtualCamera(false);
      setCameraError(null);

      const devices = await getAvailableCameras();
      setAvailableCameras(devices);
      if (devices.length > 0 && !deviceId) {
        setSelectedDeviceId(devices[0].deviceId);
      }
    } else {
      setActiveStream(null);
      setCameraError(result.error);
      setUseVirtualCamera(true);
    }
    setCameraLoading(false);
  }, []);

  // On mount: attempt camera connection
  useEffect(() => {
    connectCamera();
    getAvailableCameras().then((devices) => {
      setAvailableCameras(devices);
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [connectCamera]);

  // Bind video element whenever activeStream updates
  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch((err) => {
        console.warn('Video playback warning:', err);
      });
    }
  }, [activeStream, useVirtualCamera]);

  // Render left layout template frame overlay
  useEffect(() => {
    const canvas = leftCanvasOverlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (template.isCustom && template.customDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = template.customDataUrl;
    } else if (template.renderOverlay) {
      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      template.renderOverlay(ctx, canvas.width, canvas.height, collageType, { dateStr });
    }
  }, [template, collageType]);

  // Capture current frame preserving 100% native aspect ratio (tidak lonjong/stretch)
  const captureFrame = useCallback((): string => {
    const hiddenCanvas = document.createElement('canvas');
    const hasLiveVideo = !useVirtualCamera && videoRef.current && videoRef.current.videoWidth > 0;

    if (hasLiveVideo && videoRef.current) {
      // Use EXACT native video resolution to guarantee zero pixel stretching
      const vW = videoRef.current.videoWidth;
      const vH = videoRef.current.videoHeight;
      hiddenCanvas.width = vW;
      hiddenCanvas.height = vH;
      const ctx = hiddenCanvas.getContext('2d')!;

      ctx.save();
      if (isMirrored) {
        ctx.translate(vW, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, vW, vH);
      ctx.restore();
    } else {
      // 16:9 standard simulation canvas
      hiddenCanvas.width = 1280;
      hiddenCanvas.height = 720;
      const ctx = hiddenCanvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, hiddenCanvas.width, hiddenCanvas.height);
      const colors = [
        ['#1e293b', '#334155'],
        ['#3b0764', '#581c87'],
        ['#064e3b', '#065f46'],
        ['#831843', '#9d174d'],
      ];
      const colorPair = colors[(simulationPose + currentShotIndex) % colors.length];
      grad.addColorStop(0, colorPair[0]);
      grad.addColorStop(1, colorPair[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(hiddenCanvas.width / 2, hiddenCanvas.height / 2 - 60, 140, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(hiddenCanvas.width / 2, hiddenCanvas.height / 2 + 260, 300, 220, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`POSE #${currentShotIndex + 1}`, hiddenCanvas.width / 2, hiddenCanvas.height / 2 - 10);
      ctx.font = '22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('PID KIOSK SIMULATION FEED', hiddenCanvas.width / 2, hiddenCanvas.height / 2 + 35);
    }

    return hiddenCanvas.toDataURL('image/jpeg', 0.94);
  }, [useVirtualCamera, isMirrored, simulationPose, currentShotIndex]);

  // Main countdown timer & snapshot loop
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === 'countdown') {
      if (countdown > 0) {
        soundFx.playBeep(600 + (3 - countdown) * 150, 0.12);
        timer = setTimeout(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // Flash and capture!
        soundFx.playShutter();
        setIsFlashing(true);
        setPhase('flash');

        const photoData = captureFrame();
        const updated = [...capturedPhotos, photoData];
        setCapturedPhotos(updated);

        setTimeout(() => {
          setIsFlashing(false);
          const nextIndex = currentShotIndex + 1;

          if (nextIndex < totalShots) {
            setCurrentShotIndex(nextIndex);
            setPhase('pause');
            setTimeout(() => {
              setCountdown(3);
              setPhase('countdown');
            }, 2200);
          } else {
            setPhase('finished');
            soundFx.playSuccess();
            setTimeout(() => {
              onPhotosCaptured(updated);
            }, 800);
          }
        }, 350);
      }
    }

    return () => clearTimeout(timer);
  }, [phase, countdown, currentShotIndex, totalShots, captureFrame, capturedPhotos, onPhotosCaptured]);

  const handleStartSession = () => {
    soundFx.playTouch();
    setCapturedPhotos([]);
    setCurrentShotIndex(0);
    setCountdown(3);
    setPhase('countdown');
  };

  const handleManualActivateCamera = () => {
    soundFx.playTouch();
    connectCamera(selectedDeviceId);
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDeviceId(id);
    connectCamera(id);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 md:p-6 select-none overflow-hidden bg-neutral-950 text-white font-sans">
      {/* Screen Flash Overlay */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 bg-white flash-effect pointer-events-none" />
      )}

      {/* Top Header Controls */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 border-b border-neutral-800/80">
        <button
          id="camera-cancel-btn"
          onClick={onCancel}
          disabled={phase === 'countdown' || phase === 'flash'}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 text-xs md:text-sm font-semibold transition-colors disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        {/* Shot Counter Progress */}
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs md:text-sm font-bold tracking-wide">
            Jepretan: <span className="text-emerald-400 font-extrabold">{Math.min(currentShotIndex + 1, totalShots)}</span> / {totalShots} Pose
          </span>
        </div>

        {/* Camera Selector & Mirror Tools */}
        <div className="flex items-center gap-2">
          {availableCameras.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              className="bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 max-w-[140px] truncate"
            >
              {availableCameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleManualActivateCamera}
            disabled={cameraLoading}
            title="Muat Ulang / Aktifkan Kamera"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              !useVirtualCamera && activeStream
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{!useVirtualCamera && activeStream ? 'Kamera Aktif' : 'Izinkan Kamera'}</span>
          </button>

          <button
            id="camera-mirror-toggle-btn"
            onClick={() => setIsMirrored(!isMirrored)}
            title="Mirror Kamera"
            className={`p-2 rounded-xl border transition-colors ${
              isMirrored
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Left Layout View + Right Camera Viewfinder */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-8 overflow-hidden my-2 w-full max-w-7xl mx-auto">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: Live Photobooth Layout Filling Up Shot-by-Shot */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center justify-center h-full max-h-[76vh] shrink-0">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-neutral-400 tracking-wider uppercase">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Layout Foto Kolase ({capturedPhotos.length}/{totalShots})</span>
          </div>

          {/* The Collage Card: exact aspect ratio, no stretching/squishing */}
          <div
            id="live-collage-layout"
            className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-neutral-800 bg-neutral-900 flex items-center justify-center transition-all"
            style={{
              aspectRatio: collageDef.aspectRatio,
              height: '100%',
              maxHeight: '68vh',
              width: 'auto',
            }}
          >
            {/* Background of the frame */}
            <div
              className={`absolute inset-0 ${
                template.id === 'korean_pastel' ? 'bg-[#FFF5F7]' : 'bg-[#0B0F19]'
              }`}
            />

            {/* Individual Photo Slots in the Collage */}
            {collageDef.slots.map((slot, idx) => {
              const photoData = capturedPhotos[idx];
              const isCurrent = idx === currentShotIndex && phase !== 'waiting';
              const isFilled = Boolean(photoData);

              // Position relative to canvas width/height
              const leftPercent = (slot.x / collageDef.canvasWidth) * 100;
              const topPercent = (slot.y / collageDef.canvasHeight) * 100;
              const widthPercent = (slot.width / collageDef.canvasWidth) * 100;
              const heightPercent = (slot.height / collageDef.canvasHeight) * 100;

              return (
                <div
                  key={idx}
                  id={`collage-slot-${idx}`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                  className={`absolute rounded-lg overflow-hidden flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'border-2 border-emerald-400 ring-4 ring-emerald-400/30 z-10 animate-pulse'
                      : isFilled
                      ? 'border border-neutral-700/50 z-0'
                      : 'border-2 border-dashed border-neutral-700/80 bg-neutral-800/40 z-0'
                  }`}
                >
                  {isFilled ? (
                    // Captured photo: strict object-cover, preserves aspect ratio completely
                    <img
                      src={photoData}
                      alt={`Pose ${idx + 1}`}
                      className="w-full h-full object-cover rounded-md transition-opacity duration-300"
                    />
                  ) : (
                    // Placeholder for upcoming pose
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <span
                        className={`text-xs md:text-sm font-extrabold mb-0.5 ${
                          isCurrent ? 'text-emerald-400' : 'text-neutral-500'
                        }`}
                      >
                        Pose #{idx + 1}
                      </span>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Sedang Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-600">
                          Menunggu
                        </span>
                      )}
                    </div>
                  )}

                  {/* Little checkmark tag if already captured */}
                  {isFilled && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Template Graphics Overlay Layer on Top of Left Layout */}
            <canvas
              ref={leftCanvasOverlayRef}
              width={collageDef.canvasWidth}
              height={collageDef.canvasHeight}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Live Camera Viewfinder (Large & Undistorted) */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col items-center justify-center h-full max-h-[76vh] w-full max-w-2xl">
          <div className="w-full flex items-center justify-between mb-1.5 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">
              Pratinjau Kamera Langsung (Natural Aspect Ratio)
            </span>
            <span>Pose yang akan diambil: <strong className="text-emerald-400 font-mono">#{currentShotIndex + 1}</strong></span>
          </div>

          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-neutral-800 bg-neutral-950 flex items-center justify-center min-h-[320px] max-h-[64vh]">
            {/* Real Video Stream: natural proportions, never squished */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transition-transform ${
                isMirrored ? 'scale-x-[-1]' : ''
              } ${useVirtualCamera || !activeStream ? 'hidden' : 'block'}`}
            />

            {/* Fallback & Permission Prompt when camera is inactive */}
            {(useVirtualCamera || !activeStream) && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 text-center z-10">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400">
                  <Camera className="w-8 h-8" />
                </div>

                <h4 className="text-base md:text-lg font-bold text-white mb-1">
                  Kamera Fisik Belum Terhubung
                </h4>

                <p className="text-xs text-neutral-300 max-w-sm mb-4 leading-relaxed">
                  {cameraError ||
                    'Sentuh tombol di bawah untuk mengizinkan dan membuka kamera browser.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 mb-3 w-full max-w-xs">
                  <button
                    id="activate-camera-btn"
                    onClick={handleManualActivateCamera}
                    disabled={cameraLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>{cameraLoading ? 'Menghubungkan...' : 'Izinkan & Buka Kamera'}</span>
                  </button>

                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Buka di Tab Baru</span>
                  </a>
                </div>
              </div>
            )}

            {/* Face/Pose Framing Crosshairs Guide */}
            <div className="absolute inset-8 border border-white/15 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400/60 absolute top-0 left-0" />
              <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400/60 absolute top-0 right-0" />
              <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400/60 absolute bottom-0 left-0" />
              <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400/60 absolute bottom-0 right-0" />
            </div>

            {/* Big Countdown Overlay (3, 2, 1) */}
            {phase === 'countdown' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none z-30">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-44 h-44 rounded-full bg-emerald-500/25 blur-2xl animate-ping" />
                  <span className="relative text-8xl md:text-9xl font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-pulse">
                    {countdown === 0 ? 'Jepret!' : countdown}
                  </span>
                </div>
              </div>
            )}

            {/* Pause between shots */}
            {phase === 'pause' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none p-6 text-center z-30">
                <div className="px-6 py-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-700 shadow-2xl">
                  <p className="text-emerald-400 font-extrabold text-base md:text-lg mb-0.5">
                    Pose #{currentShotIndex} Terisi di Kolase! 📸
                  </p>
                  <p className="text-xs text-neutral-300">
                    Bersiap untuk pose berikutnya (#{currentShotIndex + 1})...
                  </p>
                </div>
              </div>
            )}

            {/* Finished state */}
            {phase === 'finished' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none p-6 text-center z-30">
                <Sparkles className="w-10 h-10 text-amber-400 animate-bounce mb-2" />
                <p className="text-xl md:text-2xl font-black text-white">
                  Semua Pose Lengkap!
                </p>
                <p className="text-xs text-neutral-300 mt-1">
                  Menyiapkan pratinjau hasil akhir...
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Action Shutter Bar */}
      <div className="relative z-20 flex items-center justify-between gap-4 pt-2 border-t border-neutral-800">
        <div className="text-xs text-neutral-400">
          {phase === 'waiting' && 'Sentuh "Mulai Jepret" untuk memulai pemotretan otomatis.'}
          {phase === 'countdown' && '⏳ Hitung mundur berjalan, bersiap tersenyum!'}
          {phase === 'pause' && '📸 Jeda 2 detik, cek foto yang masuk di layout kiri.'}
          {phase === 'finished' && '✨ Menyusun komposit...'}
        </div>

        {phase === 'waiting' && (
          <button
            id="start-shutter-btn"
            onClick={handleStartSession}
            className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-extrabold text-sm md:text-base shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            <span>Mulai Jepret ({totalShots} Pose)</span>
          </button>
        )}
      </div>
    </div>
  );
};

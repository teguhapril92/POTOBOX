import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Download, Smartphone, Home, Sparkles, ExternalLink, Copy, Check, CloudCheck, Loader2 } from 'lucide-react';
import { soundFx } from '../services/audio';

interface DownloadQrScreenProps {
  finalImageUrl: string;
  photoId: string;
  downloadUrl: string;
  viewUrl: string;
  cloudSyncStatus?: 'uploading' | 'synced' | 'error';
  onFinishNow: () => void;
}

export const DownloadQrScreen: React.FC<DownloadQrScreenProps> = ({
  finalImageUrl,
  photoId,
  downloadUrl,
  viewUrl,
  cloudSyncStatus = 'synced',
  onFinishNow,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Target URL: Uses direct query parameter format by default for 100% reliable Vercel and static hosting routing
  const targetUrl = viewUrl || `${window.location.origin}/?photoId=${photoId}&auto=1`;

  // Trigger celebration confetti and generate QR code
  useEffect(() => {
    soundFx.playSuccess();

    try {
      confetti({
        particleCount: 65,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
      });
    } catch {
      // safe fallback
    }

    // Generate high-clarity QR Code targeting the mobile direct download view
    QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0a0a0a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [targetUrl]);

  const handleManualDownload = () => {
    soundFx.playTouch();
    const link = document.createElement('a');
    link.href = finalImageUrl;
    link.download = `PID-Photobooth-${photoId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinish = () => {
    soundFx.playTouch();
    onFinishNow();
  };

  return (
    <div className="flex-1 w-full flex flex-col justify-between p-4 md:p-8 animate-fade-in select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Selesai! Unduh Foto Anda
          </h2>
          {/* Cloud Sync Status Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-850 border border-neutral-750 text-xs font-semibold text-neutral-300">
            {cloudSyncStatus === 'uploading' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Menyinkronkan Cloud...</span>
              </>
            ) : cloudSyncStatus === 'synced' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400">Cloud Siap</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Lokal Tersimpan</span>
              </>
            )}
          </span>
        </div>

        {/* Back to Home Button */}
        <button
          id="back-to-home-top-btn"
          onClick={handleFinish}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 text-xs md:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Home</span>
        </button>
      </div>

      {/* Main Content Area: QR Code & Photo Preview */}
      <div className="my-auto py-4 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl mx-auto w-full">
        {/* Left Card: QR Code for Wireless Mobile Access */}
        <div className="flex-1 flex flex-col items-center text-center p-6 md:p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl max-w-md w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <Smartphone className="w-4 h-4" />
            <span>Pindai dengan Smartphone (Scan QR)</span>
          </div>

          <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
            Unduh Langsung ke HP
          </h3>
          <p className="text-xs md:text-sm text-neutral-400 mb-5 max-w-xs">
            Buka kamera HP Anda dan scan kode QR ini untuk mengunduh foto beresolusi penuh langsung ke galeri.
          </p>

          {/* QR Code Graphic Container */}
          <div className="relative p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-5 ring-4 ring-emerald-500/20">
            {qrDataUrl ? (
              <img
                id="pid-photobooth-qr"
                src={qrDataUrl}
                alt="QR Code Unduhan Foto"
                className="w-52 h-52 md:w-60 md:h-60 object-contain"
              />
            ) : (
              <div className="w-52 h-52 md:w-60 md:h-60 flex items-center justify-center text-neutral-500 text-xs">
                Membuat Kode QR...
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full">
            <p className="text-[11px] text-neutral-400 font-mono">
              ID: {photoId}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(targetUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-xs text-neutral-200 font-semibold transition-colors cursor-pointer border border-neutral-700"
                title="Salin Tautan"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tautan Tersalin' : 'Salin Link'}</span>
              </button>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-xs text-neutral-200 font-semibold transition-colors border border-neutral-700"
                title="Buka Halaman Download di Tab Baru"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buka Link Download</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Card: Photo Thumbnail & Direct Actions */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-3xl bg-neutral-900/40 border border-neutral-800 max-w-md w-full">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Pratinjau Hasil Cetak
          </div>

          <div className="relative p-2 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg mb-6 flex items-center justify-center max-h-[350px]">
            <img
              src={finalImageUrl}
              alt="Final Photobooth Print"
              className="max-h-[310px] max-w-full object-contain rounded-lg"
            />
          </div>

          {/* Direct Download Button (For Kiosk/USB/Operator) */}
          <button
            id="direct-download-btn"
            onClick={handleManualDownload}
            className="w-full py-3.5 px-6 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 text-neutral-100 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors mb-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh File Asli di Kiosk PID</span>
          </button>

          <span className="text-[11px] text-neutral-400 text-center">
            Foto tersimpan otomatis di Firebase Firestore dan siap diakses kapan saja.
          </span>
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <div className="pt-2 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Terima kasih telah menggunakan Photobooth Layar PID!</span>
      </div>
    </div>
  );
};

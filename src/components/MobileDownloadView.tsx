import React, { useEffect, useState, useRef } from 'react';
import { Download, Share2, Sparkles, Check, ArrowLeft, RefreshCw, AlertCircle, ImageDown, ExternalLink } from 'lucide-react';
import { getPhotoFromFirestore, subscribeToPhotoFromFirestore } from '../services/firebase';

interface MobileDownloadViewProps {
  photoId: string;
}

export const MobileDownloadView: React.FC<MobileDownloadViewProps> = ({ photoId }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const hasAutoTriggered = useRef<boolean>(false);

  // Parse if auto-download is requested in query params (?auto=1 or ?download=1)
  const isAutoDownload =
    new URLSearchParams(window.location.search).get('auto') === '1' ||
    new URLSearchParams(window.location.search).get('download') === '1';

  // Helper to convert dataUrl or URL to Blob for reliable mobile file handling
  const getBlobFromUrl = async (url: string): Promise<Blob> => {
    if (url.startsWith('data:')) {
      const parts = url.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'image/jpeg';
      const raw = window.atob(parts[1]);
      const uInt8Array = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    }
    const response = await fetch(url);
    return await response.blob();
  };

  // Direct download handler (Blob link method)
  const handleDirectDownload = async () => {
    if (!imageUrl) return;

    try {
      const blob = await getBlobFromUrl(imageUrl);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `PID-Photobooth-${photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        setDownloadSuccess(false);
      }, 3000);
    } catch {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  // Smart mobile saver: Native gallery share sheet on iOS/Android or direct download
  const handleSmartSave = async () => {
    if (!imageUrl) return;

    try {
      const blob = await getBlobFromUrl(imageUrl);
      const file = new File([blob], `PID-Photobooth-${photoId}.jpg`, {
        type: blob.type || 'image/jpeg',
      });

      // If mobile browser supports sharing files (iOS Safari 15+, Android Chrome 89+)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Foto PID Photobooth',
          text: 'Foto kenangan dari Kiosk Layar PID',
        });
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // User cancelled share dialog
      }
    }

    // Standard direct file download fallback
    handleDirectDownload();
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/?photoId=${photoId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Foto Photobooth PID',
          text: 'Lihat foto photobooth saya dari Layar PID!',
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Real-time synchronization and automatic fallback polling
  useEffect(() => {
    let active = true;
    let pollInterval: NodeJS.Timeout | null = null;
    let pollAttempts = 0;

    setLoading(true);
    setErrorNotice(null);

    // 1. Check local storage first for instant response if tested on same device
    try {
      const localSaved = localStorage.getItem(`photobooth_photo_${photoId}`);
      if (localSaved && active) {
        setImageUrl(localSaved);
        setLoading(false);
        return;
      }
    } catch {
      // ignore local storage error
    }

    // 2. Real-time Firestore Listener (fires immediately when saved on kiosk)
    const unsubscribe = subscribeToPhotoFromFirestore(
      photoId,
      (data) => {
        if (!active) return;
        if (data && data.dataUrl) {
          setImageUrl(data.dataUrl);
          setLoading(false);
          setErrorNotice(null);
          if (pollInterval) clearInterval(pollInterval);
        }
      },
      () => {
        // Handled by polling fallback below
      }
    );

    // 3. Fallback Polling (polls every 1.5s up to 10 times in case kiosk was still uploading)
    pollInterval = setInterval(async () => {
      pollAttempts += 1;
      setRetryCount(pollAttempts);

      try {
        const firestoreData = await getPhotoFromFirestore(photoId);
        if (firestoreData && firestoreData.dataUrl && active) {
          setImageUrl(firestoreData.dataUrl);
          setLoading(false);
          setErrorNotice(null);
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
      } catch {
        // continue polling
      }

      // Check optional Node express backend
      try {
        const res = await fetch(`/api/photos/${photoId}/info`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const info = await res.json();
          if (info && info.id && active) {
            setImageUrl(`/api/photos/${photoId}`);
            setLoading(false);
            setErrorNotice(null);
            if (pollInterval) clearInterval(pollInterval);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Timeout after 12 attempts (~18 seconds)
      if (pollAttempts >= 12) {
        if (pollInterval) clearInterval(pollInterval);
        if (active && !imageUrl) {
          setLoading(false);
          setErrorNotice('Foto belum tersedia di Cloud. Pastikan proses foto di Kiosk sudah selesai.');
        }
      }
    }, 1500);

    return () => {
      active = false;
      unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [photoId]);

  // Auto-download execution if requested in query parameters
  useEffect(() => {
    if (imageUrl && isAutoDownload && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      // Small timeout to allow render
      const timer = setTimeout(() => {
        handleDirectDownload();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [imageUrl, isAutoDownload]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-6 select-auto overflow-y-auto font-sans">
      {/* Mobile Top Header */}
      <header className="flex items-center justify-between pb-4 border-b border-neutral-850">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-base font-extrabold text-white tracking-tight">
            PID Photobooth Mobile
          </h1>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
          Siap Diunduh
        </span>
      </header>

      {/* Main Container */}
      <main className="my-auto py-6 flex flex-col items-center max-w-md mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center px-4">
            <div className="relative w-14 h-14 mx-auto mb-5">
              <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              Menyinkronkan Foto dari Kiosk...
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
              Sedang mengambil foto resolusi penuh dari cloud. Mohon tunggu sebentar.
            </p>
            {retryCount > 1 && (
              <p className="text-[11px] text-emerald-400/80 mt-3 font-mono">
                Menghubungkan ke Cloud Firestore ({retryCount}/12)...
              </p>
            )}
          </div>
        ) : imageUrl ? (
          <div className="w-full flex flex-col items-center animate-fade-in">
            {/* Download Notification Banner */}
            {downloadSuccess && (
              <div className="w-full mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Foto berhasil diunduh ke perangkat Anda!</span>
              </div>
            )}

            {/* Photo Card Preview */}
            <div className="relative p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl mb-6 max-w-full">
              <img
                src={imageUrl}
                alt="Photobooth Memory"
                className="max-h-[62vh] w-auto max-w-full object-contain rounded-xl shadow-md"
              />
            </div>

            {/* Download & Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              {/* Primary Direct Download Button */}
              <button
                id="mobile-download-btn"
                onClick={handleDirectDownload}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Unduh Foto Sekarang (Download)</span>
              </button>

              {/* Smart Save to Gallery / Native Share */}
              <button
                id="mobile-smart-save-btn"
                onClick={handleSmartSave}
                className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-850 active:bg-neutral-800 border border-neutral-750 text-neutral-100 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <ImageDown className="w-4 h-4 text-emerald-400" />
                <span>Simpan ke Galeri / Bagikan</span>
              </button>

              {/* Copy / Share Link */}
              <button
                id="mobile-share-link-btn"
                onClick={handleShareLink}
                className="w-full py-3 px-6 rounded-2xl bg-neutral-950 hover:bg-neutral-900 active:bg-neutral-850 border border-neutral-850 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tautan Tersalin ke Clipboard!' : 'Salin Tautan Foto'}</span>
              </button>
            </div>

            {/* Mobile Native Tip */}
            <div className="mt-5 p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 text-center text-xs text-neutral-400 leading-relaxed">
              💡 <strong>Tips iPhone & Android:</strong> Jika unduhan otomatis tidak muncul, tekan dan tahan gambar di atas, lalu pilih <em>&ldquo;Simpan ke Foto&rdquo;</em> (Add to Photos).
            </div>
          </div>
        ) : (
          <div className="py-16 text-center max-w-sm px-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Foto Belum Ditemukan</h2>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              {errorNotice || 'Foto belum selesai diunggah dari kiosk atau ID foto tidak valid.'}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium text-xs border border-neutral-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Buka Kiosk Photobooth
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="pt-4 border-t border-neutral-900 text-center text-xs text-neutral-500 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Public Information Display Photobooth Kiosk</span>
      </footer>
    </div>
  );
};

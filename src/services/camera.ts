// Robust camera management utility for PID Kiosk Photobooth

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface CameraInitResult {
  stream: MediaStream | null;
  error: string | null;
  errorType: 'permission_denied' | 'not_found' | 'in_use' | 'security' | 'unknown' | null;
}

export async function getAvailableCameras(): Promise<CameraDevice[]> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    return videoInputs.map((d, index) => ({
      deviceId: d.deviceId,
      label: d.label || `Kamera ${index + 1} (${d.deviceId ? 'USB/Internal' : 'Default'})`,
    }));
  } catch (err) {
    console.warn('Failed to enumerate video devices:', err);
    return [];
  }
}

export async function requestCameraStream(preferredDeviceId?: string): Promise<CameraInitResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      error: 'Browser tidak mendukung akses kamera (MediaDevices API).',
      errorType: 'not_found',
    };
  }

  // Tier 1: Try with selected deviceId if provided
  if (preferredDeviceId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: preferredDeviceId } },
        audio: false,
      });
      return { stream, error: null, errorType: null };
    } catch (err) {
      console.warn('DeviceId constraint failed, falling back to general video...', err);
    }
  }

  // Tier 2: Try 720p without strict facingMode (compatible with desktop webcams and PID displays)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    return { stream, error: null, errorType: null };
  } catch (err: unknown) {
    console.warn('Resolution constraint failed, trying basic { video: true }...', err);
  }

  // Tier 3: Absolute simplest constraint
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    return { stream, error: null, errorType: null };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    const name = errorObj?.name || '';
    console.error('Camera request failed completely:', name, errorObj);

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return {
        stream: null,
        error: 'Izin kamera belum diberikan. Klik tombol "Aktifkan Kamera" di bawah untuk mengizinkan akses kamera browser.',
        errorType: 'permission_denied',
      };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        stream: null,
        error: 'Tidak ada perangkat kamera/webcam yang terdeteksi di sistem.',
        errorType: 'not_found',
      };
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return {
        stream: null,
        error: 'Kamera sedang digunakan oleh aplikasi lain (misal: Zoom/Meet/browser lain). Tutup aplikasi tersebut lalu coba lagi.',
        errorType: 'in_use',
      };
    }
    if (name === 'SecurityError') {
      return {
        stream: null,
        error: 'Akses kamera dibatasi oleh kebijakan iframe. Buka aplikasi di tab baru untuk mengizinkan kamera.',
        errorType: 'security',
      };
    }

    return {
      stream: null,
      error: errorObj?.message || 'Gagal mengakses kamera.',
      errorType: 'unknown',
    };
  }
}

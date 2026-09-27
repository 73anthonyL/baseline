import { Panel, Direction, ScanRecord, CompareResult } from '../types';
import heic2any from 'heic2any';

// Helper to check if a file is HEIC/HEIF
export function isHeicFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  return (
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif') ||
    fileType === 'image/heic' ||
    fileType === 'image/heif'
  );
}

// Convert HEIC file to JPEG using browser canvas & libheif/heic2any decoder
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const conversionResult = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.88,
    });

    const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');

    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('heic2any fallback to canvas ImageBitmap:', err);
    // Secondary fallback: test if browser natively supports createImageBitmap
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(bitmap, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.88);
      });

      if (!blob) throw new Error('Could not convert canvas to JPEG');
      const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      return new File([blob], newName, { type: 'image/jpeg' });
    } catch (fallbackErr) {
      throw new Error(`Failed to convert HEIC to JPEG: ${fallbackErr || err}`);
    }
  }
}

// Helper to compute SHA-256 of any File or Blob
export async function computeFileSHA256(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate randomized walkaround challenge
export function generateRandomChallenge(): {
  targetPanel: Panel;
  targetDirection: Direction;
  challengeCode: string;
} {
  const candidatePanels: Panel[] = [
    'front_bumper',
    'passenger_quarter_panel',
    'trunk_rear_bumper',
    'driver_quarter_panel',
    'driver_fender',
    'passenger_fender',
  ];
  const targetPanel = candidatePanels[Math.floor(Math.random() * candidatePanels.length)];
  const targetDirection: Direction = Math.random() > 0.5 ? 'clockwise' : 'counter-clockwise';
  const challengeCode = `CHL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  return { targetPanel, targetDirection, challengeCode };
}

// Extract ~1 frame per second, max 35 frames, compressed to max 960px long edge
export async function extractVideoKeyframes(
  videoFile: File,
  maxFrames = 35,
  onProgress?: (pct: number) => void
): Promise<{ frames: { timestamp_seconds: number; frame_index: number; dataUrl: string }[]; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 10;
        // Interval: 1 frame per second, or larger interval if duration > maxFrames
        const interval = Math.max(1, duration / maxFrames);
        const targetTimestamps: number[] = [];
        for (let t = 0.5; t < duration; t += interval) {
          targetTimestamps.push(t);
        }
        if (targetTimestamps.length > maxFrames) {
          targetTimestamps.length = maxFrames;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        const frames: { timestamp_seconds: number; frame_index: number; dataUrl: string }[] = [];

        // Calculate aspect-ratio preserving dimensions capped at 960px
        const maxEdge = 960;
        let w = video.videoWidth || 1280;
        let h = video.videoHeight || 720;
        if (w > h && w > maxEdge) {
          h = Math.round((h * maxEdge) / w);
          w = maxEdge;
        } else if (h > maxEdge) {
          w = Math.round((w * maxEdge) / h);
          h = maxEdge;
        }
        canvas.width = w;
        canvas.height = h;

        for (let i = 0; i < targetTimestamps.length; i++) {
          const time = targetTimestamps[i];
          video.currentTime = time;

          await new Promise<void>((res) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              res();
            };
            video.addEventListener('seeked', onSeeked);
          });

          ctx.drawImage(video, 0, 0, w, h);
          // Compress to JPEG 0.72 quality for tight, fast transfer
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          frames.push({
            timestamp_seconds: Math.round(time * 10) / 10,
            frame_index: i,
            dataUrl,
          });

          if (onProgress) {
            onProgress(Math.round(((i + 1) / targetTimestamps.length) * 100));
          }
        }

        URL.revokeObjectURL(objectUrl);
        resolve({ frames, duration });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video file in browser'));
    };
  });
}

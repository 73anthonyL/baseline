import { VideoFrame } from '../types';

// Helper to synthesize a video Blob from real image frames via Canvas & MediaRecorder
export function createVideoFromFrames(
  frames: VideoFrame[],
  frameDurationMs = 2500
): Promise<string> {
  return new Promise((resolve) => {
    if (frames.length === 0) {
      resolve('');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Load HTMLImageElements for all frames
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    frames.forEach((frame, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedCount++;
        if (loadedCount === frames.length) {
          startRecording(ctx);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === frames.length) {
          startRecording(ctx);
        }
      };
      img.src = frame.dataUrl;
      images[idx] = img;
    });

    function startRecording(context: CanvasRenderingContext2D) {
      try {
        const stream = canvas.captureStream(30);
        let mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = '';
        }
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          resolve(url);
        };

        recorder.start();

        let currentFrame = 0;

        function drawNext() {
          if (currentFrame >= images.length) {
            recorder.stop();
            return;
          }

          const img = images[currentFrame];
          if (img && img.complete && img.naturalWidth > 0) {
            context.fillStyle = '#000000';
            context.fillRect(0, 0, 1280, 720);

            // Center and scale image
            const scale = Math.min(1280 / img.naturalWidth, 720 / img.naturalHeight);
            const w = img.naturalWidth * scale;
            const h = img.naturalHeight * scale;
            const x = (1280 - w) / 2;
            const y = (720 - h) / 2;
            context.drawImage(img, x, y, w, h);

            // Watermark timestamp & frame
            context.fillStyle = 'rgba(0,0,0,0.6)';
            context.fillRect(20, 660, 260, 40);
            context.font = '16px monospace';
            context.fillStyle = '#ffffff';
            context.fillText(
              `FRAME #${currentFrame + 1}/${images.length} • ${(currentFrame * (frameDurationMs / 1000)).toFixed(1)}s`,
              30,
              686
            );
          }

          currentFrame++;
          setTimeout(drawNext, frameDurationMs);
        }

        drawNext();
      } catch (err) {
        console.warn('MediaRecorder not available or failed:', err);
        resolve('');
      }
    }
  });
}

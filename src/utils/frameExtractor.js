/**
 * Frame Extractor Utility
 * Extracts frames from a video file at a specified FPS using HTML5 video + canvas API.
 */

/**
 * Extract frames from a video file.
 * @param {File} videoFile - The video file to extract frames from.
 * @param {number} fps - Frames per second to extract.
 * @param {function} onProgress - Callback with (currentFrame, totalFrames) for progress updates.
 * @returns {Promise<Array<{blob: Blob, filename: string, url: string}>>} Array of frame data.
 */
export async function extractFrames(videoFile, fps, onProgress) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video. Please ensure the file is a valid video.'));
    });

    video.addEventListener('loadedmetadata', async () => {
      const duration = video.duration;

      if (!isFinite(duration) || duration <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not determine video duration.'));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const interval = 1 / fps;
      const totalFrames = Math.floor(duration * fps);
      const frames = [];

      if (totalFrames === 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No frames to extract. Video may be too short for the selected FPS.'));
        return;
      }

      for (let i = 0; i < totalFrames; i++) {
        const time = i * interval;

        try {
          await seekToTime(video, time);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const blob = await new Promise((res) => {
            canvas.toBlob((b) => res(b), 'image/png');
          });

          const frameNumber = String(i + 1).padStart(String(totalFrames).length, '0');
          const filename = `frame_${frameNumber}.png`;
          const url = URL.createObjectURL(blob);

          frames.push({ blob, filename, url });

          if (onProgress) {
            onProgress(i + 1, totalFrames);
          }
        } catch (err) {
          console.warn(`Skipping frame ${i + 1}: ${err.message}`);
        }
      }

      URL.revokeObjectURL(objectUrl);
      resolve(frames);
    });
  });
}

/**
 * Seek video to a specific time and wait for the seek to complete.
 * @param {HTMLVideoElement} video
 * @param {number} time - Time in seconds to seek to.
 * @returns {Promise<void>}
 */
function seekToTime(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      // Small delay to ensure the frame is fully rendered
      requestAnimationFrame(() => {
        resolve();
      });
    };

    const onError = () => {
      video.removeEventListener('error', onError);
      reject(new Error('Seek failed'));
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.currentTime = time;
  });
}

/**
 * Get video metadata without extracting frames.
 * @param {File} videoFile
 * @returns {Promise<{duration: number, width: number, height: number}>}
 */
export function getVideoMetadata(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };
      URL.revokeObjectURL(objectUrl);
      resolve(metadata);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load video metadata.'));
    });
  });
}

/**
 * Format seconds into MM:SS format.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format file size into human-readable format.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

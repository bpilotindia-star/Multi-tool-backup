import { useState, useCallback, useEffect, useRef } from 'react';
import useSEO from '../hooks/useSEO';
import VideoUploader from '../components/VideoUploader';
import VideoPreview from '../components/VideoPreview';
import FPSControl from '../components/FPSControl';
import ProgressBar from '../components/ProgressBar';
import FrameGallery from '../components/FrameGallery';
import FAQ from '../components/FAQ';
import { extractFrames, getVideoMetadata } from '../utils/frameExtractor';
import './VideoToFramesPage.css';

export default function VideoToFramesPage() {
  useSEO({
    title: 'Free Video to Frames Converter | Extract Images from Video',
    description: 'Extract high-quality frames (PNG/JPG) from any video file right in your browser. 100% private, no server uploads required.',
    keywords: 'video to frame, extract frames from video, video to png, video to jpg, video frame extractor free, client side video editor',
    url: 'https://multi-tool-platform.online/video-to-frames'
  });

  const [videoFile, setVideoFile] = useState(null);
  const [fps, setFps] = useState(5);
  const [videoDuration, setVideoDuration] = useState(0);
  const [frames, setFrames] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);

  const totalEstimatedFrames = Math.floor(videoDuration * fps);

  useEffect(() => {
    if (!videoFile) {
      setVideoDuration(0);
      return;
    }
    getVideoMetadata(videoFile)
      .then((meta) => setVideoDuration(meta.duration))
      .catch(() => setVideoDuration(0));
  }, [videoFile]);

  const handleVideoSelect = useCallback((file) => {
    frames.forEach((frame) => URL.revokeObjectURL(frame.url));
    setFrames([]);
    setError(null);
    setProgress({ current: 0, total: 0 });
    setVideoFile(file);
  }, [frames]);

  const handleRemoveVideo = useCallback(() => {
    frames.forEach((frame) => URL.revokeObjectURL(frame.url));
    setVideoFile(null);
    setFrames([]);
    setError(null);
    setProgress({ current: 0, total: 0 });
  }, [frames]);

  const handleExtract = useCallback(async () => {
    if (!videoFile) return;
    frames.forEach((frame) => URL.revokeObjectURL(frame.url));
    setFrames([]);
    setError(null);
    setIsExtracting(true);
    setProgress({ current: 0, total: totalEstimatedFrames });

    try {
      const extractedFrames = await extractFrames(videoFile, fps, (current, total) => {
        setProgress({ current, total });
      });
      setFrames(extractedFrames);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  }, [videoFile, fps, frames, totalEstimatedFrames]);

  return (
    <div className="v2f-page">
      {/* Header section for the tool specifically */}
      <div className="v2f-header">
        <h1 className="v2f-title">Free Video to Frame Converter Online</h1>
        <p className="v2f-desc">
          The fastest video to frame extractor free tool. Upload a video, choose your frame rate, and instantly get your video to frames PNG download. Everything runs locally in your browser.
        </p>
      </div>

      {!videoFile ? (
        <div className="v2f-upload-container">
          <VideoUploader onVideoSelect={handleVideoSelect} disabled={isExtracting} />
        </div>
      ) : (
        <div className="workspace">
          <section className="workspace__top">
            <VideoPreview videoFile={videoFile} onRemove={handleRemoveVideo} />
            <FPSControl
              fps={fps}
              onFpsChange={setFps}
              totalFrames={totalEstimatedFrames}
              onExtract={handleExtract}
              isExtracting={isExtracting}
              disabled={!videoFile}
            />
          </section>

          <ProgressBar
            current={progress.current}
            total={progress.total}
            isActive={isExtracting}
          />

          {error && (
            <div className="error-bar" id="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <FrameGallery frames={frames} videoFileName={videoFile?.name} />
        </div>
      )}

      <FAQ />
    </div>
  );
}

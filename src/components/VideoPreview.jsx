import { useEffect, useRef, useState } from 'react';
import { getVideoMetadata, formatDuration, formatFileSize } from '../utils/frameExtractor';
import './VideoPreview.css';

export default function VideoPreview({ videoFile, onRemove }) {
  const videoRef = useRef(null);
  const [metadata, setMetadata] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    if (!videoFile) return;
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    getVideoMetadata(videoFile).then(setMetadata).catch(console.error);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  if (!videoFile || !videoUrl) return null;

  return (
    <div className="vp" id="video-preview">
      <div className="vp__head">
        <span className="vp__label">Preview</span>
        <button className="vp__remove" onClick={onRemove}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Remove
        </button>
      </div>

      <div className="vp__player">
        <video ref={videoRef} src={videoUrl} controls preload="metadata" className="vp__video" />
      </div>

      <div className="vp__meta">
        <div className="vp__meta-item">
          <span className="vp__meta-k">File</span>
          <span className="vp__meta-v">{videoFile.name}</span>
        </div>
        <div className="vp__meta-item">
          <span className="vp__meta-k">Size</span>
          <span className="vp__meta-v">{formatFileSize(videoFile.size)}</span>
        </div>
        {metadata && (
          <>
            <div className="vp__meta-item">
              <span className="vp__meta-k">Duration</span>
              <span className="vp__meta-v">{formatDuration(metadata.duration)}</span>
            </div>
            <div className="vp__meta-item">
              <span className="vp__meta-k">Resolution</span>
              <span className="vp__meta-v">{metadata.width}×{metadata.height}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

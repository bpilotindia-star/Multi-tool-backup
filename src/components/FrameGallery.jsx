import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './FrameGallery.css';

export default function FrameGallery({ frames, videoFileName }) {
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    if (frames.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('frames');
      for (const frame of frames) {
        folder.file(frame.filename, frame.blob);
      }
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const baseName = videoFileName ? videoFileName.replace(/\.[^/.]+$/, '') : 'video';
      saveAs(zipBlob, `${baseName}_frames.zip`);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('Failed to create ZIP file.');
    } finally {
      setIsDownloading(false);
    }
  }, [frames, videoFileName]);

  const handleDownloadSingle = useCallback((frame) => {
    saveAs(frame.blob, frame.filename);
  }, []);

  if (!frames || frames.length === 0) return null;

  const padLen = String(frames.length).length;

  return (
    <div className="gal" id="frame-gallery">
      <div className="gal__head">
        <div className="gal__head-left">
          <span className="gal__label">Frames</span>
          <span className="gal__count">{frames.length}</span>
        </div>
        <button
          className="gal__dl-btn"
          onClick={handleDownloadAll}
          disabled={isDownloading}
          id="download-all-button"
        >
          {isDownloading ? (
            <>
              <svg className="gal__spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Creating ZIP…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download ZIP
            </>
          )}
        </button>
      </div>

      <div className="gal__grid">
        {frames.map((frame, i) => (
          <div key={i} className="gal__item" onClick={() => setSelectedFrame(frame)}>
            <img src={frame.url} alt={frame.filename} className="gal__thumb" loading="lazy" />
            <div className="gal__overlay">
              <span className="gal__num">{String(i + 1).padStart(padLen, '0')}</span>
              <button
                className="gal__dl-one"
                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(frame); }}
                title="Download"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedFrame && (
        <div className="lb" onClick={() => setSelectedFrame(null)} id="frame-lightbox">
          <div className="lb__wrap" onClick={(e) => e.stopPropagation()}>
            <button className="lb__close" onClick={() => setSelectedFrame(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img src={selectedFrame.url} alt={selectedFrame.filename} className="lb__img" />
            <div className="lb__bar">
              <span className="lb__name">{selectedFrame.filename}</span>
              <button className="lb__dl" onClick={() => handleDownloadSingle(selectedFrame)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

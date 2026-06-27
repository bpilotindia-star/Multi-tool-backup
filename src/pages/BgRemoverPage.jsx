import { useState, useRef } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { saveAs } from 'file-saver';
import './BgRemoverPage.css';

export default function BgRemoverPage() {
  const [sourceImage, setSourceImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  
  const [status, setStatus] = useState('idle'); // idle | loading | processing | done | error
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const processImage = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setSourceImage(URL.createObjectURL(file));
    setResultImage(null);
    setStatus('loading');
    setProgressPct(0);
    setProgressText('Initializing AI model...');

    try {
      const blob = await removeBackground(file, {
        model: 'medium',
        progress: (key, current, total) => {
          if (key.includes('fetch')) {
            setStatus('loading');
            setProgressText('Downloading AI model (only happens once)...');
            if (total) setProgressPct(Math.round((current / total) * 100));
          } else {
            setStatus('processing');
            setProgressText('Removing background...');
            if (total) setProgressPct(Math.round((current / total) * 100));
          }
        }
      });
      
      setResultImage(URL.createObjectURL(blob));
      setStatus('done');
    } catch (err) {
      console.error('Removal error:', err);
      setStatus('error');
      setProgressText('Failed to process image. Please try another.');
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processImage(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    if (resultImage) saveAs(resultImage, 'removed-bg.png');
  };

  const handleReset = () => {
    setSourceImage(null);
    setResultImage(null);
    setStatus('idle');
    setProgressPct(0);
  };

  return (
    <div className="bgr-page">
      <div className="bgr-header">
        <h1 className="bgr-title">Free Image Background Remover</h1>
        <p className="bgr-desc">
          Remove backgrounds from any image instantly using local AI. 100% private, free, and runs entirely in your browser without uploading to any server.
        </p>
      </div>

      <div className="bgr-workspace">
        {status === 'idle' && (
          <div
            className={`bgr-upload ${isDragging ? 'bgr-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="bgr-upload__inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="bgr-upload__icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="bgr-upload__text">Drag an image here</p>
              <p className="bgr-upload__sub">or</p>
              <label className="bgr-upload__btn" htmlFor="img-upload">Browse files</label>
              <input type="file" id="img-upload" accept="image/*" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'loading' || status === 'processing') && (
          <div className="bgr-processing">
            <div className="bgr-proc__preview">
              <img src={sourceImage} alt="Source" className="bgr-proc__img" />
              <div className="bgr-proc__overlay">
                <div className="bgr-proc__info">
                  <span className="bgr-proc__text">{progressText}</span>
                  {status === 'loading' && <span className="bgr-proc__pct">{progressPct}%</span>}
                </div>
                <div className="bgr-proc__bar">
                  <div 
                    className={`bgr-proc__fill ${status === 'processing' ? 'bgr-proc__fill--indeterminate' : ''}`} 
                    style={{ width: status === 'processing' ? '100%' : `${progressPct}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="bgr-result">
            <div className="bgr-result__grid">
              <div className="bgr-result__box">
                <span className="bgr-result__label">Original</span>
                <img src={sourceImage} alt="Original" className="bgr-result__img" />
              </div>
              <div className="bgr-result__box bgr-result__box--checker">
                <span className="bgr-result__label">Background Removed</span>
                <img src={resultImage} alt="Result" className="bgr-result__img" />
              </div>
            </div>
            
            <div className="bgr-result__actions">
              <button className="bgr-btn bgr-btn--secondary" onClick={handleReset}>
                Process Another Image
              </button>
              <button className="bgr-btn bgr-btn--primary" onClick={handleDownload}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download HD PNG
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bgr-error">
            <p>{progressText}</p>
            <button className="bgr-btn bgr-btn--secondary" onClick={handleReset}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

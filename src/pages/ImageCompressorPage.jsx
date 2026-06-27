import { useState, useRef, useCallback } from 'react';
import useSEO from '../hooks/useSEO';
import imageCompression from 'browser-image-compression';
import { saveAs } from 'file-saver';
import './ImageCompressorPage.css';

export default function ImageCompressorPage() {
  useSEO({
    title: 'Free Image Compressor | Reduce Photo Size Online',
    description: 'Compress JPG, PNG, and WebP images instantly in your browser. Reduce file size without losing quality. 100% private, no uploads.',
    keywords: 'image compressor, compress image online, reduce photo size, compress jpeg, compress png, client side image compressor, free image compressor',
    url: 'https://multi-tool-platform.online/image-compressor'
  });

  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);
  const [resultFile, setResultFile] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);

  const [targetKB, setTargetKB] = useState(500);
  const [status, setStatus] = useState('idle'); // idle | loading | processing | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
    setResultFile(null);
    setResultPreview(null);
    setStatus('idle');
  };

  const compressImage = async () => {
    if (!sourceFile) return;
    setStatus('processing');
    setErrorMsg('');

    try {
      const options = {
        maxSizeMB: targetKB / 1024,
        maxWidthOrHeight: 1920, // Start from a reasonable web resolution to help hit very low targets
        useWebWorker: true,
        initialQuality: 0.8,
        maxIteration: 20, // Increase iterations to enforce target size more strictly
        fileType: sourceFile.type // Keep original format (e.g., PNG stays PNG to preserve transparency)
      };

      const compressedFile = await imageCompression(sourceFile, options);
      
      setResultFile(compressedFile);
      setResultPreview(URL.createObjectURL(compressedFile));
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Failed to compress image. It might already be highly compressed.');
    }
  };

  // Drag and Drop
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
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };
  const handleInputChange = (e) => {
    if (e.target.files[0]) handleFileSelect(e.target.files[0]);
    e.target.value = '';
  };

  const handleDownload = () => {
    if (resultFile) {
      saveAs(resultFile, `compressed_${sourceFile.name}`);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourcePreview(null);
    setResultFile(null);
    setResultPreview(null);
    setStatus('idle');
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="imc-page">
      <div className="imc-header">
        <h1 className="imc-title">Free Image Compressor</h1>
        <p className="imc-desc">
          Compress images to your exact target file size (KB) without losing significant quality. 100% local, fast, and secure.
        </p>
      </div>

      <div className="imc-workspace">
        {!sourceFile && (
          <div
            className={`imc-upload ${isDragging ? 'imc-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="imc-upload__inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="imc-upload__icon">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 17 4 4 4-4" />
              </svg>
              <p className="imc-upload__text">Drag an image here to compress</p>
              <label className="imc-upload__btn" htmlFor="img-compress-upload">Browse files</label>
              <input type="file" id="img-compress-upload" accept="image/*" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {sourceFile && (
          <div className="imc-editor">
            <div className="imc-editor__controls">
              <div className="imc-control-group">
                <label className="imc-label">
                  Target File Size (KB)
                  <span style={{display: 'block', fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 'normal'}}>
                    * Note: High compression may reduce image quality
                  </span>
                </label>
                <div className="imc-input-wrap">
                  <input
                    type="number"
                    className="imc-input"
                    value={targetKB}
                    onChange={(e) => setTargetKB(Math.max(1, parseInt(e.target.value) || 0))}
                    min="1"
                    disabled={status === 'processing'}
                  />
                  <span className="imc-input-suffix">KB</span>
                </div>
              </div>
              <button 
                className="imc-btn imc-btn--primary" 
                onClick={compressImage} 
                disabled={status === 'processing'}
              >
                {status === 'processing' ? 'Compressing...' : 'Compress Image'}
              </button>
              <button 
                className="imc-btn imc-btn--secondary" 
                onClick={handleReset} 
                disabled={status === 'processing'}
              >
                Clear
              </button>
            </div>

            <div className="imc-preview-grid">
              {/* Original */}
              <div className="imc-preview-card">
                <div className="imc-preview-card__header">
                  <span>Original</span>
                  <span className="imc-badge">{formatSize(sourceFile.size)}</span>
                </div>
                <div className="imc-preview-card__img-wrap">
                  <img src={sourcePreview} alt="Original" className="imc-preview-card__img" />
                </div>
              </div>

              {/* Compressed */}
              <div className="imc-preview-card">
                <div className="imc-preview-card__header">
                  <span>Compressed</span>
                  {resultFile && (
                    <span className="imc-badge imc-badge--success">{formatSize(resultFile.size)}</span>
                  )}
                </div>
                <div className="imc-preview-card__img-wrap">
                  {status === 'processing' ? (
                    <div className="imc-loader">
                      <div className="imc-loader__spinner"></div>
                      <p>Optimizing...</p>
                    </div>
                  ) : resultPreview ? (
                    <img src={resultPreview} alt="Compressed" className="imc-preview-card__img" />
                  ) : (
                    <div className="imc-empty">Ready to compress</div>
                  )}
                </div>
              </div>
            </div>

            {status === 'error' && (
              <div className="imc-error">{errorMsg}</div>
            )}

            {status === 'done' && resultFile && (
              <div className="imc-actions">
                <div className="imc-stats">
                  Saved <strong>{formatSize(sourceFile.size - resultFile.size)}</strong> (
                  {Math.round(((sourceFile.size - resultFile.size) / sourceFile.size) * 100)}%)
                </div>
                <button className="imc-btn imc-btn--success" onClick={handleDownload}>
                  Download Compressed Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

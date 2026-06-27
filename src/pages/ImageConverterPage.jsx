import { useState, useRef, useEffect } from 'react';
import { saveAs } from 'file-saver';
import './ImageConverterPage.css';

const SUPPORTED_FORMATS = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPG / JPEG' },
  { value: 'image/webp', label: 'WEBP' }
];

export default function ImageConverterPage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);
  const [targetFormat, setTargetFormat] = useState('');
  
  const [resultBlob, setResultBlob] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFormatLabel = (mimeType) => {
    if (mimeType === 'image/jpeg') return 'JPG';
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/webp') return 'WEBP';
    return mimeType.split('/')[1]?.toUpperCase() || 'UNKNOWN';
  };

  const getExtension = (mimeType) => {
    if (mimeType === 'image/jpeg') return '.jpg';
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    return '';
  };

  const availableFormats = SUPPORTED_FORMATS.filter(f => f.value !== sourceFile?.type);

  useEffect(() => {
    if (sourceFile && availableFormats.length > 0) {
      if (!availableFormats.find(f => f.value === targetFormat)) {
        setTargetFormat(availableFormats[0].value);
      }
    }
  }, [sourceFile, availableFormats, targetFormat]);

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
    setResultBlob(null);
    setStatus('idle');
  };

  const convertImage = () => {
    if (!sourceFile || !targetFormat) return;
    setStatus('processing');
    setErrorMsg('');

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // If converting to JPEG, fill with white background first to avoid black backgrounds for transparent pixels
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setResultBlob(blob);
            setStatus('done');
          } else {
            setStatus('error');
            setErrorMsg('Failed to convert image format.');
          }
        },
        targetFormat,
        1.0 // Maintain high quality
      );
    };
    img.onerror = () => {
      setStatus('error');
      setErrorMsg('Failed to load image for conversion.');
    };
    img.src = sourcePreview;
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
    if (resultBlob) {
      const originalName = sourceFile.name.replace(/\.[^/.]+$/, "");
      const ext = getExtension(targetFormat);
      saveAs(resultBlob, `${originalName}_converted${ext}`);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourcePreview(null);
    setResultBlob(null);
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
    <div className="imcv-page">
      <div className="imcv-header">
        <h1 className="imcv-title">Image Format Converter</h1>
        <p className="imcv-desc">
          Convert images between PNG, JPG, and WEBP instantly. Processed securely and locally in your browser.
        </p>
      </div>

      <div className="imcv-workspace">
        {!sourceFile && (
          <div
            className={`imcv-upload ${isDragging ? 'imcv-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="imcv-upload__inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="imcv-upload__icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="imcv-upload__text">Drag an image here to convert</p>
              <label className="imcv-upload__btn" htmlFor="img-convert-upload">Browse files</label>
              <input type="file" id="img-convert-upload" accept="image/*" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {sourceFile && (
          <div className="imcv-editor">
            <div className="imcv-editor__controls">
              
              <div className="imcv-info-card">
                <span className="imcv-info-label">Detected Format:</span>
                <span className="imcv-info-value">{getFormatLabel(sourceFile.type)}</span>
              </div>

              <div className="imcv-control-group">
                <label className="imcv-label">Convert To</label>
                <div className={`imcv-custom-select ${status === 'processing' || status === 'done' ? 'disabled' : ''}`} ref={dropdownRef}>
                  <div 
                    className="imcv-custom-select__trigger" 
                    onClick={() => {
                      if (status !== 'processing' && status !== 'done' && availableFormats.length > 0) {
                        setIsDropdownOpen(!isDropdownOpen);
                      }
                    }}
                  >
                    <span>{availableFormats.find(f => f.value === targetFormat)?.label || 'No targets'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`imcv-custom-select__icon ${isDropdownOpen ? 'open' : ''}`}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {isDropdownOpen && availableFormats.length > 0 && (
                    <div className="imcv-custom-select__menu">
                      {availableFormats.map(f => (
                        <div 
                          key={f.value} 
                          className={`imcv-custom-select__option ${f.value === targetFormat ? 'selected' : ''}`}
                          onClick={() => {
                            setTargetFormat(f.value);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {f.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {status !== 'done' ? (
                <button 
                  className="imcv-btn imcv-btn--primary" 
                  onClick={convertImage} 
                  disabled={status === 'processing' || !targetFormat}
                >
                  {status === 'processing' ? 'Converting...' : 'Convert Image'}
                </button>
              ) : (
                <button className="imcv-btn imcv-btn--success" onClick={handleDownload}>
                  Download {getFormatLabel(targetFormat)}
                </button>
              )}

              <button 
                className="imcv-btn imcv-btn--secondary" 
                onClick={handleReset} 
                disabled={status === 'processing'}
              >
                Clear
              </button>
            </div>

            <div className="imcv-preview">
              <div className="imcv-preview__header">
                <span>Preview</span>
                <div className="imcv-preview__badges">
                  <span className="imcv-badge">{formatSize(sourceFile.size)}</span>
                  {status === 'done' && resultBlob && (
                    <>
                      <span className="imcv-arrow">→</span>
                      <span className="imcv-badge imcv-badge--success">{formatSize(resultBlob.size)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="imcv-preview__img-wrap">
                <img src={sourcePreview} alt="Preview" className="imcv-preview__img" />
              </div>
            </div>

            {status === 'error' && (
              <div className="imcv-error">{errorMsg}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

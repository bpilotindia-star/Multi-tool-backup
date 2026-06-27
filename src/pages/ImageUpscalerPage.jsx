import { useState, useRef, useEffect } from 'react';
import './ImageUpscalerPage.css';

export default function ImageUpscalerPage() {
  const [image, setImage] = useState(null); // { file, dataUrl, width, height, size }
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState('image/png');
  const [status, setStatus] = useState('idle'); // idle | processing | done
  const [progressMsg, setProgressMsg] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage({
          file: file,
          dataUrl: e.target.result,
          width: img.width,
          height: img.height,
          size: file.size,
          name: file.name
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  const handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const processAndDownload = async () => {
    if (!image) return;

    setStatus('processing');
    setProgressMsg('Rendering at high resolution...');

    try {
      // Small delay to let UI update
      await new Promise(r => setTimeout(r, 50));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const targetWidth = Math.round(image.width * scale);
      const targetHeight = Math.round(image.height * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Ensure crisp scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const imgElement = new Image();
      imgElement.src = image.dataUrl;

      await new Promise(resolve => {
        imgElement.onload = () => {
          ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);
          resolve();
        };
      });

      setProgressMsg('Generating file...');

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Generate new filename
        const ext = format === 'image/png' ? 'png' : 'jpg';
        const newName = image.name.replace(/\.[^/.]+$/, "") + `_upscaled_${scale}x.${ext}`;
        
        a.href = url;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setStatus('done');
        setTimeout(() => setStatus('idle'), 2000);
      }, format, 1.0); // 1.0 is max quality for JPEG/WEBP

    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('An error occurred during upscaling.');
    }
  };

  return (
    <div className="iu-page">
      <div className="iu-header">
        <h1 className="iu-title">Image Upscaler</h1>
        <p className="iu-desc">
          Increase the dimensions and file size of your image. Maximize quality securely in your browser.
        </p>
      </div>

      <div className="iu-workspace">
        {!image ? (
          <div
            className={`iu-upload ${isDragging ? 'iu-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="iu-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="iu-upload__icon">
                <polyline points="15 3 21 3 21 9" />
                <line x1="9" y1="21" x2="21" y2="9" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
              </svg>
              <p className="iu-upload__text">Drag & drop an image</p>
              <p className="iu-upload__subtext">Supports PNG, JPG, JPEG, WEBP</p>
              <label className="iu-upload__btn" htmlFor="iu-upload">Select Image</label>
              <input type="file" id="iu-upload" accept="image/*" onChange={handleInputChange} hidden />
            </div>
          </div>
        ) : (
          <div className="iu-editor">
            
            <div className="iu-preview-card">
              <div className="iu-preview-img-wrap">
                <img src={image.dataUrl} alt="Preview" />
              </div>
              <div className="iu-preview-stats">
                <div className="iu-stat">
                  <span className="iu-stat-label">Original Dimensions:</span>
                  <span className="iu-stat-val">{image.width} x {image.height} px</span>
                </div>
                <div className="iu-stat">
                  <span className="iu-stat-label">Original File Size:</span>
                  <span className="iu-stat-val">{formatBytes(image.size)}</span>
                </div>
              </div>
            </div>

            <div className="iu-controls">
              <h3 className="iu-controls-title">Upscale Settings</h3>
              
              <div className="iu-control-group">
                <label>Resolution Multiplier</label>
                <div className="iu-radio-group">
                  {[1, 2, 3, 4].map(mult => (
                    <button 
                      key={mult}
                      className={`iu-radio-btn ${scale === mult ? 'iu-radio-btn--active' : ''}`}
                      onClick={() => setScale(mult)}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
                <div className="iu-target-info">
                  New Dimensions: <strong>{Math.round(image.width * scale)} x {Math.round(image.height * scale)} px</strong>
                </div>
              </div>

              <div className="iu-control-group">
                <label>Output Format & File Size Booster</label>
                <select 
                  className="iu-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="image/png">PNG (Maximum Quality & Largest File Size)</option>
                  <option value="image/jpeg">JPEG (100% Quality, Large File Size)</option>
                </select>
                <p className="iu-help-text">
                  PNG will typically result in the heaviest file size (MBs). Perfect for bypassing minimum file size limits.
                </p>
              </div>

              {status === 'processing' ? (
                <div className="iu-progress">
                  <div className="iu-progress-text">{progressMsg}</div>
                  <div className="iu-progress-track">
                    <div className="iu-progress-fill"></div>
                  </div>
                </div>
              ) : (
                <div className="iu-actions">
                  <button className="iu-btn iu-btn--secondary" onClick={() => setImage(null)}>Cancel</button>
                  <button className="iu-btn iu-btn--primary" onClick={processAndDownload}>
                    Upscale & Download
                  </button>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

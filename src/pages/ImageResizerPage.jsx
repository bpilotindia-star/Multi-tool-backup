import { useState, useRef, useCallback, useEffect } from 'react';
import useSEO from '../hooks/useSEO';
import Cropper from 'react-easy-crop';
import { saveAs } from 'file-saver';
import './ImageResizerPage.css';

const RATIOS = [
  { label: 'Freeform', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Portrait (4:5)', value: 4/5 },
  { label: 'Story (9:16)', value: 9/16 },
  { label: 'Landscape (16:9)', value: 16/9 },
  { label: 'Classic (4:3)', value: 4/3 },
];

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, fileType = 'image/jpeg') {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, fileType, 1.0);
  });
}

export default function ImageResizerPage() {
  useSEO({
    title: 'Free Image Resizer | Resize Photos Online without losing quality',
    description: 'Resize images by custom dimensions (pixels) or percentages. Fast, completely free, and secure client-side processing.',
    keywords: 'image resizer, resize photo online, change image dimensions, scale image, resize image free, client side image resizer',
    url: 'https://multi-tool-platform.online/image-resizer'
  });

  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(RATIOS[1].value); // Default to 1:1
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const [resultBlob, setResultBlob] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | cropping | done | error

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
    setResultBlob(null);
    setResultPreview(null);
    setStatus('idle');
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleCrop = async () => {
    if (!sourcePreview || !croppedAreaPixels) return;
    setStatus('cropping');

    try {
      // Retain original format to preserve transparency if PNG
      const format = sourceFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const croppedImageBlob = await getCroppedImg(sourcePreview, croppedAreaPixels, format);
      
      setResultBlob(croppedImageBlob);
      setResultPreview(URL.createObjectURL(croppedImageBlob));
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('error');
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
    if (resultBlob) {
      const originalName = sourceFile.name.replace(/\.[^/.]+$/, "");
      const ext = sourceFile.type === 'image/png' ? '.png' : '.jpg';
      saveAs(resultBlob, `${originalName}_cropped${ext}`);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourcePreview(null);
    setResultBlob(null);
    setResultPreview(null);
    setStatus('idle');
  };

  return (
    <div className="imr-page">
      <div className="imr-header">
        <h1 className="imr-title">Image Cropper</h1>
        <p className="imr-desc">
          Easily crop and resize your images. Drag to position, scroll to zoom, and export instantly.
        </p>
      </div>

      <div className="imr-workspace">
        {!sourceFile && (
          <div
            className={`imr-upload ${isDragging ? 'imr-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="imr-upload__inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="imr-upload__icon">
                <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                <path d="M18 22V8a2 2 0 0 0-2-2H2" />
              </svg>
              <p className="imr-upload__text">Drag an image here to crop</p>
              <label className="imr-upload__btn" htmlFor="img-resize-upload">Browse files</label>
              <input type="file" id="img-resize-upload" accept="image/*" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {sourceFile && status !== 'done' && (
          <div className="imr-editor">
            
            <div className="imr-cropper-container">
              <Cropper
                image={sourcePreview}
                crop={crop}
                zoom={zoom}
                aspect={aspect || undefined}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                classes={{
                  containerClassName: 'imr-cropper-wrapper',
                  cropAreaClassName: 'imr-crop-area'
                }}
              />
            </div>

            <div className="imr-controls">
              <div className="imr-controls-section">
                <label className="imr-label">Aspect Ratio</label>
                <div className="imr-ratios">
                  {RATIOS.map(r => (
                    <button
                      key={r.label}
                      className={`imr-ratio-btn ${aspect === r.value ? 'active' : ''}`}
                      onClick={() => setAspect(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="imr-controls-section">
                <label className="imr-label">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="imr-slider"
                />
              </div>

              <div className="imr-actions">
                <button 
                  className="imr-btn imr-btn--secondary" 
                  onClick={handleReset}
                >
                  Cancel
                </button>
                <button 
                  className="imr-btn imr-btn--primary" 
                  onClick={handleCrop}
                  disabled={status === 'cropping'}
                >
                  {status === 'cropping' ? 'Cropping...' : 'Crop Image'}
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'done' && resultPreview && (
          <div className="imr-result">
            <div className="imr-result__header">
              <h3 className="imr-result__title">Cropped Successfully</h3>
            </div>
            
            <div className="imr-result__img-wrap">
              <img src={resultPreview} alt="Cropped" className="imr-result__img" />
            </div>

            <div className="imr-result__actions">
              <button className="imr-btn imr-btn--secondary" onClick={() => setStatus('idle')}>
                Edit Crop
              </button>
              <button className="imr-btn imr-btn--success" onClick={handleDownload}>
                Download Cropped Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

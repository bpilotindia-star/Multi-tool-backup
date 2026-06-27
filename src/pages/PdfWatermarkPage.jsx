import { useState, useRef, useEffect, useCallback } from 'react';
import useSEO from '../hooks/useSEO';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { saveAs } from 'file-saver';
import { HexColorPicker } from "react-colorful";
import './PdfWatermarkPage.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfWatermarkPage() {
  useSEO({
    title: 'Free PDF Watermark Tool | Add Text or Image to PDF',
    description: 'Add a custom text or image watermark to your PDF documents. Change color, opacity, and rotation. 100% secure client-side processing.',
    keywords: 'add watermark to pdf, pdf watermark, protect pdf, text watermark, image watermark pdf, free pdf tool',
    url: 'https://multi-tool-platform.online/pdf-watermark'
  });

  const [sourceFile, setSourceFile] = useState(null);
  const [fileBuffer, setFileBuffer] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progressMsg, setProgressMsg] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  
  // Draggable Watermark State
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDraggingWM, setIsDraggingWM] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartElementPos = useRef({ x: 0, y: 0 });
  const previewImgRef = useRef(null);
  const wmRef = useRef(null);

  // Watermark Settings
  const [wmMode, setWmMode] = useState('text'); // 'text' | 'image'
  
  // Text Settings
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmColor, setWmColor] = useState('#ff0000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [wmSize, setWmSize] = useState(60);
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmRotation, setWmRotation] = useState(45);
  
  // Image Settings
  const [wmImageFile, setWmImageFile] = useState(null);
  const [wmImagePreview, setWmImagePreview] = useState('');
  const [wmImageSize, setWmImageSize] = useState(150); // pixels
  const [wmImageOpacity, setWmImageOpacity] = useState(0.5);

  const loadPDF = async (file) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }
    
    try {
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);
      setSourceFile(file);
      
      // Generate preview of the first page
      generatePreview(buffer.slice(0)); 
    } catch (err) {
      console.error(err);
      alert('Failed to load PDF.');
    }
  };
  
  const generatePreview = async (buffer) => {
    try {
      const typedarray = new Uint8Array(buffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      const page = await pdf.getPage(1); // Get first page
      
      // Render at a decent scale for preview
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const url = canvas.toDataURL('image/jpeg', 0.8);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error('Failed to generate preview', error);
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
    if (e.dataTransfer.files[0]) loadPDF(e.dataTransfer.files[0]);
  };
  const handleInputChange = (e) => {
    if (e.target.files[0]) loadPDF(e.target.files[0]);
    e.target.value = '';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setWmImageFile(file);
      const url = URL.createObjectURL(file);
      setWmImagePreview(url);
    } else {
      alert('Please upload a valid JPEG or PNG image.');
    }
    e.target.value = '';
  };

  const clearFile = () => {
    setSourceFile(null);
    setFileBuffer(null);
    setPdfPreviewUrl('');
    setStatus('idle');
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  // --- Watermark Drag Logic ---
  const onPointerDown = (e) => {
    e.preventDefault();
    setIsDraggingWM(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartElementPos.current = { ...position };
  };

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!isDraggingWM) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setPosition({
        x: dragStartElementPos.current.x + dx,
        y: dragStartElementPos.current.y + dy
      });
    };

    const onPointerUp = () => setIsDraggingWM(false);

    if (isDraggingWM) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDraggingWM]);

  const applyWatermark = async () => {
    if (!fileBuffer) return;
    
    if (wmMode === 'image' && !wmImageFile) {
      alert('Please select an image for the watermark.');
      return;
    }

    if (wmMode === 'text' && !wmText.trim()) {
      alert('Please enter some text for the watermark.');
      return;
    }

    setStatus('processing');
    setProgressMsg('Applying watermark to all pages...');

    try {
      const freshBuffer = await sourceFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(freshBuffer);
      const pages = pdfDoc.getPages();

      let pdfImage = null;
      let originalImgDims = null;

      if (wmMode === 'image') {
        const imgBuffer = await wmImageFile.arrayBuffer();
        if (wmImageFile.type === 'image/jpeg') {
          pdfImage = await pdfDoc.embedJpg(imgBuffer);
        } else {
          pdfImage = await pdfDoc.embedPng(imgBuffer);
        }
        originalImgDims = pdfImage.scale(1); // intrinsic dimensions
      }

      const { r, g, b } = hexToRgb(wmColor);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        
        let scaleX = 1;
        let scaleY = 1;
        let pdfX = 0;
        let pdfY = 0;
        let mappedScale = 1;

        if (previewImgRef.current && wmRef.current) {
          const previewWidth = previewImgRef.current.clientWidth;
          const previewHeight = previewImgRef.current.clientHeight;
          
          scaleX = width / previewWidth;
          scaleY = height / previewHeight;
          
          // PDF-lib y-axis is from bottom. So bottom-left of UI div is the anchor.
          const wmVisualHeight = wmRef.current.clientHeight;
          pdfX = position.x * scaleX;
          pdfY = height - ((position.y + wmVisualHeight) * scaleY);
          
          mappedScale = scaleX; // Use scaleX for proportional resizing (like images/fonts)
        }

        if (wmMode === 'text') {
          page.drawText(wmText, {
            x: pdfX,
            y: pdfY,
            size: Number(wmSize) * mappedScale,
            color: rgb(r, g, b),
            opacity: Number(wmOpacity),
            rotate: degrees(Number(wmRotation)),
          });
        } else if (wmMode === 'image' && pdfImage && originalImgDims) {
          // Intrinsic ratio
          const imgRatio = originalImgDims.height / originalImgDims.width;
          const targetWidth = Number(wmImageSize) * mappedScale;
          const targetHeight = targetWidth * imgRatio;

          page.drawImage(pdfImage, {
            x: pdfX,
            y: pdfY,
            width: targetWidth,
            height: targetHeight,
            opacity: Number(wmImageOpacity),
            // pdf-lib supports rotation on images as well, we use the same angle but counter-clockwise
            rotate: degrees(Number(wmRotation)),
          });
        }
      });

      setProgressMsg('Saving PDF...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${sourceFile.name.replace('.pdf', '')}_watermarked.pdf`);
      
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      alert('An error occurred while applying the watermark.');
      setStatus('idle');
    }
  };

  return (
    <div className="wm-page">
      <div className="wm-header">
        <h1 className="wm-title">Add Watermark to PDF</h1>
        <p className="wm-desc">
          Stamp an image or text over your PDF pages. 100% private and runs right in your browser.
        </p>
      </div>

      <div className="wm-workspace">
        {!sourceFile && (
          <div
            className={`wm-upload ${isDragging ? 'wm-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="wm-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="wm-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M10 18v-4a2 2 0 0 1 4 0v4" />
                <path d="M8 12h8" />
              </svg>
              <p className="wm-upload__text">Drag & drop a PDF file</p>
              <label className="wm-upload__btn" htmlFor="wm-upload">Select PDF</label>
              <input type="file" id="wm-upload" accept="application/pdf" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'processing' || status === 'done' || status === 'error') && !sourceFile && (
           <div className="wm-progress-card">
              <h3 className="wm-progress-title">{progressMsg}</h3>
           </div>
        )}

        {sourceFile && (
          <div className="wm-editor">
            <div className="wm-editor-header">
              <div>
                <h2 className="wm-editor-title">{sourceFile.name}</h2>
                <p className="wm-editor-subtitle">Configure your watermark settings below.</p>
              </div>
              <div className="wm-editor-actions">
                <button className="wm-btn wm-btn--secondary" onClick={clearFile} disabled={status === 'processing'}>Clear File</button>
                <button className="wm-btn wm-btn--primary" onClick={applyWatermark} disabled={status === 'processing'}>
                  {status === 'processing' ? 'Processing...' : 'Apply Watermark'}
                </button>
              </div>
            </div>

            {status === 'processing' && (
              <div className="wm-progress-card">
                <h3 className="wm-progress-title">{progressMsg}</h3>
                <div className="wm-progress-bar">
                  <div className="wm-progress-fill" style={{ width: '100%', animation: 'wm-loading 1.5s infinite linear' }}></div>
                </div>
              </div>
            )}

            <div className="wm-settings">
              <div className="wm-tabs">
                <button 
                  className={`wm-tab ${wmMode === 'text' ? 'wm-tab--active' : ''}`} 
                  onClick={() => setWmMode('text')}
                >
                  Text Watermark
                </button>
                <button 
                  className={`wm-tab ${wmMode === 'image' ? 'wm-tab--active' : ''}`} 
                  onClick={() => setWmMode('image')}
                >
                  Image Watermark
                </button>
              </div>

              {wmMode === 'text' && (
                <div className="wm-controls">
                  <div className="wm-control-group">
                    <label className="wm-label">Text</label>
                    <input type="text" className="wm-input" value={wmText} onChange={e => setWmText(e.target.value)} />
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Color</label>
                    <div className="wm-color-picker-wrapper">
                      <div 
                        className="wm-color-swatch" 
                        style={{ backgroundColor: wmColor }} 
                        onClick={() => setShowColorPicker(true)}
                      />
                      {showColorPicker && (
                        <>
                          <div className="wm-color-cover" onClick={() => setShowColorPicker(false)} />
                          <div className="wm-color-popover">
                            <HexColorPicker color={wmColor} onChange={setWmColor} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Size: {wmSize}</label>
                    <input type="range" className="wm-input" min="10" max="150" value={wmSize} onChange={e => setWmSize(e.target.value)} />
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Opacity: {Math.round(wmOpacity * 100)}%</label>
                    <input type="range" className="wm-input" min="0.1" max="1" step="0.1" value={wmOpacity} onChange={e => setWmOpacity(e.target.value)} />
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Rotation: {wmRotation}°</label>
                    <input type="range" className="wm-input" min="0" max="360" value={wmRotation} onChange={e => setWmRotation(e.target.value)} />
                  </div>
                </div>
              )}

              {wmMode === 'image' && (
                <div className="wm-controls">
                  <div className="wm-control-group">
                    <label className="wm-label">Watermark Image</label>
                    <div className="wm-image-upload">
                      {wmImagePreview && <img src={wmImagePreview} alt="Preview" className="wm-image-preview" />}
                      <label className="wm-image-btn" htmlFor="wm-img-upload">Upload PNG/JPG</label>
                      <input type="file" id="wm-img-upload" accept="image/png, image/jpeg" onChange={handleImageUpload} hidden />
                    </div>
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Image Size</label>
                    <input type="range" className="wm-input" min="30" max="800" value={wmImageSize} onChange={e => setWmImageSize(e.target.value)} />
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Opacity: {Math.round(wmImageOpacity * 100)}%</label>
                    <input type="range" className="wm-input" min="0.1" max="1" step="0.1" value={wmImageOpacity} onChange={e => setWmImageOpacity(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview Section */}
            {pdfPreviewUrl && (
              <div className="wm-preview-section">
                <h3 className="wm-preview-title">Live Preview (Page 1)</h3>
                <p className="wm-editor-subtitle" style={{ alignSelf: 'flex-start', marginTop: '-8px' }}>Drag the watermark to position it perfectly.</p>
                <div className="wm-preview-container">
                  <img ref={previewImgRef} src={pdfPreviewUrl} alt="PDF Page 1" className="wm-preview-pdf" draggable={false} />
                  
                  <div 
                    ref={wmRef}
                    className="wm-preview-overlay" 
                    onPointerDown={onPointerDown}
                    style={{ 
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                      transform: `rotate(-${wmMode === 'text' ? wmRotation : 0}deg)`,
                      opacity: wmMode === 'text' ? wmOpacity : wmImageOpacity
                    }}
                  >
                    {wmMode === 'text' && (
                      <span style={{ 
                        color: wmColor, 
                        fontSize: `${wmSize}px`, 
                        fontWeight: 'bold',
                        fontFamily: 'Helvetica, sans-serif',
                        padding: '2px'
                      }}>
                        {wmText}
                      </span>
                    )}
                    
                    {wmMode === 'image' && wmImagePreview && (
                      <img 
                        src={wmImagePreview} 
                        alt="Watermark Overlay" 
                        style={{ width: `${wmImageSize}px`, height: 'auto', pointerEvents: 'none' }} 
                        draggable={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

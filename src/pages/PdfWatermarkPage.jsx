import { useState, useRef } from 'react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import './PdfWatermarkPage.css';

export default function PdfWatermarkPage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [fileBuffer, setFileBuffer] = useState(null);
  
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progressMsg, setProgressMsg] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Watermark Settings
  const [wmMode, setWmMode] = useState('text'); // 'text' | 'image'
  
  // Text Settings
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmColor, setWmColor] = useState('#ff0000');
  const [wmSize, setWmSize] = useState(60);
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmRotation, setWmRotation] = useState(45);
  
  // Image Settings
  const [wmImageFile, setWmImageFile] = useState(null);
  const [wmImagePreview, setWmImagePreview] = useState('');
  const [wmImageScale, setWmImageScale] = useState(0.5); // 0.1 to 2
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
    } catch (err) {
      console.error(err);
      alert('Failed to load PDF.');
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
    setStatus('idle');
  };

  // Helper to convert hex to rgb float (0-1) for pdf-lib
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

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
      // Load the fresh buffer from the original file object to avoid detachment issues
      const freshBuffer = await sourceFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(freshBuffer);
      const pages = pdfDoc.getPages();

      let pdfImage = null;
      let imgDims = null;

      if (wmMode === 'image') {
        const imgBuffer = await wmImageFile.arrayBuffer();
        if (wmImageFile.type === 'image/jpeg') {
          pdfImage = await pdfDoc.embedJpg(imgBuffer);
        } else {
          pdfImage = await pdfDoc.embedPng(imgBuffer);
        }
        imgDims = pdfImage.scale(Number(wmImageScale));
      }

      const { r, g, b } = hexToRgb(wmColor);

      // Loop through all pages and apply watermark in the center
      pages.forEach((page) => {
        const { width, height } = page.getSize();

        if (wmMode === 'text') {
          // Estimate text width roughly (font size * 0.6 * characters)
          const textWidth = wmSize * 0.6 * wmText.length;
          
          page.drawText(wmText, {
            x: width / 2 - textWidth / 2, // Approximate centering
            y: height / 2 - wmSize / 2,
            size: Number(wmSize),
            color: rgb(r, g, b),
            opacity: Number(wmOpacity),
            rotate: degrees(Number(wmRotation)),
          });
        } else if (wmMode === 'image' && pdfImage && imgDims) {
          page.drawImage(pdfImage, {
            x: width / 2 - imgDims.width / 2,
            y: height / 2 - imgDims.height / 2,
            width: imgDims.width,
            height: imgDims.height,
            opacity: Number(wmImageOpacity),
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
                    <input type="color" className="wm-input" value={wmColor} onChange={e => setWmColor(e.target.value)} />
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Size: {wmSize}px</label>
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
                    <label className="wm-label">Scale: {Math.round(wmImageScale * 100)}%</label>
                    <input type="range" className="wm-input" min="0.1" max="2" step="0.1" value={wmImageScale} onChange={e => setWmImageScale(e.target.value)} />
                  </div>
                  
                  <div className="wm-control-group">
                    <label className="wm-label">Opacity: {Math.round(wmImageOpacity * 100)}%</label>
                    <input type="range" className="wm-input" min="0.1" max="1" step="0.1" value={wmImageOpacity} onChange={e => setWmImageOpacity(e.target.value)} />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

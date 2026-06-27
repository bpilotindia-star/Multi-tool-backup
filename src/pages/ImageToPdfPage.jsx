import { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import './ImageToPdfPage.css';

const A4_RATIO = 1.414;

export default function ImageToPdfPage() {
  const [images, setImages] = useState([]); // array of { file, dataUrl, id, edited: boolean }
  const [status, setStatus] = useState('idle'); // idle | processing | done
  const [progressMsg, setProgressMsg] = useState('');
  const [orientation, setOrientation] = useState('portrait');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Editor Modal State
  const [editingIndex, setEditingIndex] = useState(null);
  const [konvaImageObj, setKonvaImageObj] = useState(null);
  const [imgNodeProps, setImgNodeProps] = useState({ x: 0, y: 0, width: 0, height: 0, scaleX: 1, scaleY: 1, rotation: 0 });
  const [stageSize, setStageSize] = useState({ width: 400, height: 565 });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const imgRef = useRef(null);

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setStatus('processing');
    setProgressMsg('Loading images...');

    const newImages = [];
    let loadedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({
          id: Date.now() + Math.random(),
          file: file,
          dataUrl: e.target.result,
          edited: false
        });
        
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setImages(prev => [...prev, ...newImages]);
          setStatus('idle');
        }
      };
      reader.readAsDataURL(file);
    });
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

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  const moveImage = (index, direction) => {
    const newImages = [...images];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      setImages(newImages);
    }
  };

  const clearAll = () => {
    setImages([]);
  };

  // ----- Modal Editor Logic -----
  const openEditor = (index) => {
    setEditingIndex(index);
    setIsPreviewMode(false);
    const imgData = images[index].dataUrl;
    
    // Calculate stage size to perfectly fit the screen without scrolling
    const padding = 40;
    const maxW = Math.min(window.innerWidth - padding * 2, 800); 
    const maxH = window.innerHeight * 0.45; // Leave 55% of screen height for header, footer, padding and safety margin
    
    let sWidth, sHeight;

    if (orientation === 'portrait') {
      sHeight = maxH;
      sWidth = sHeight / A4_RATIO;
      if (sWidth > maxW) {
        sWidth = maxW;
        sHeight = sWidth * A4_RATIO;
      }
    } else {
      sWidth = maxW;
      sHeight = sWidth / A4_RATIO;
      if (sHeight > maxH) {
        sHeight = maxH;
        sWidth = sHeight * A4_RATIO;
      }
    }
    
    setStageSize({ width: sWidth, height: sHeight });

    const img = new window.Image();
    img.src = imgData;
    img.onload = () => {
      setKonvaImageObj(img);
      
      // Calculate initial fit
      const imgRatio = img.width / img.height;
      const stageRatio = sWidth / sHeight;
      let finalW, finalH;

      if (imgRatio > stageRatio) {
        finalW = sWidth * 0.8;
        finalH = finalW / imgRatio;
      } else {
        finalH = sHeight * 0.8;
        finalW = finalH * imgRatio;
      }

      setImgNodeProps({
        x: (sWidth - finalW) / 2,
        y: (sHeight - finalH) / 2,
        width: finalW,
        height: finalH,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      });
    };
  };

  const closeEditor = () => {
    setEditingIndex(null);
    setKonvaImageObj(null);
  };

  const saveLayout = () => {
    if (!stageRef.current) return;
    
    // Deselect image to hide transformer bounds before export
    trRef.current.nodes([]);
    
    setTimeout(() => {
      // Export at high resolution
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3, mimeType: 'image/jpeg', quality: 0.95 });
      
      const newImages = [...images];
      newImages[editingIndex].dataUrl = dataUrl;
      newImages[editingIndex].edited = true;
      setImages(newImages);
      
      closeEditor();
    }, 50);
  };

  // Attach transformer
  useEffect(() => {
    if (editingIndex !== null && imgRef.current && trRef.current) {
      if (isPreviewMode) {
        trRef.current.nodes([]);
      } else {
        trRef.current.nodes([imgRef.current]);
      }
      trRef.current.getLayer().batchDraw();
    }
  }, [editingIndex, konvaImageObj, isPreviewMode]);

  // ----- PDF Generation -----
  const generatePDF = async () => {
    if (images.length === 0) return;

    setStatus('processing');
    setProgressMsg('Generating PDF...');

    try {
      await new Promise(r => setTimeout(r, 100));

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        
        setProgressMsg(`Processing image ${i + 1} of ${images.length}...`);

        const imgData = images[i].dataUrl;
        
        if (images[i].edited) {
          // It's exactly the A4 ratio canvas, fill the page
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        } else {
          // Unedited, center it mathematically
          const imgProps = pdf.getImageProperties(imgData);
          const imgRatio = imgProps.width / imgProps.height;
          const pdfRatio = pdfWidth / pdfHeight;

          let finalW, finalH;
          if (imgRatio > pdfRatio) {
            finalW = pdfWidth;
            finalH = pdfWidth / imgRatio;
          } else {
            finalH = pdfHeight;
            finalW = pdfHeight * imgRatio;
          }
          const x = (pdfWidth - finalW) / 2;
          const y = (pdfHeight - finalH) / 2;

          pdf.addImage(imgData, imgProps.fileType || 'JPEG', x, y, finalW, finalH);
        }
      }

      setProgressMsg('Downloading...');
      pdf.save('Combined_Images.pdf');
      
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);

    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('An error occurred while generating the PDF.');
    }
  };

  return (
    <div className="itp-page">
      <div className="itp-header">
        <h1 className="itp-title">Image to PDF Converter</h1>
        <p className="itp-desc">
          Combine multiple images into a single, beautifully formatted PDF document. Locally and securely.
        </p>
      </div>

      <div className="itp-workspace">
        {images.length === 0 ? (
          <div
            className={`itp-upload ${isDragging ? 'itp-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="itp-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="itp-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <circle cx="10" cy="13" r="2" />
                <path d="M6 17l4-4 4 4" />
              </svg>
              <p className="itp-upload__text">Drag & drop multiple images</p>
              <p className="itp-upload__subtext">Supports PNG, JPG, JPEG, WEBP</p>
              <label className="itp-upload__btn" htmlFor="itp-upload">Select Images</label>
              <input type="file" id="itp-upload" accept="image/*" multiple onChange={handleInputChange} hidden />
            </div>
          </div>
        ) : (
          <div className="itp-editor">
            
            <div className="itp-editor-header">
              <div>
                <h2 className="itp-editor-title">{images.length} Image{images.length !== 1 ? 's' : ''} Selected</h2>
                <p className="itp-editor-subtitle">They will be added to the PDF in this exact order.</p>
              </div>
              <div className="itp-editor-actions">
                <select 
                  className="itp-select" 
                  value={orientation} 
                  onChange={(e) => setOrientation(e.target.value)}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>

                <label className="itp-btn itp-btn--secondary" htmlFor="itp-upload-more">
                  Add More
                </label>
                <input type="file" id="itp-upload-more" accept="image/*" multiple onChange={handleInputChange} hidden />
                <button className="itp-btn itp-btn--danger" onClick={clearAll}>Clear All</button>
                <button className="itp-btn itp-btn--primary" onClick={generatePDF} disabled={status === 'processing'}>
                  {status === 'processing' ? 'Generating...' : 'Generate PDF'}
                </button>
              </div>
            </div>

            {status === 'processing' && (
              <div className="itp-progress-bar">
                <div className="itp-progress-text">{progressMsg}</div>
                <div className="itp-progress-track">
                  <div className="itp-progress-fill"></div>
                </div>
              </div>
            )}

            <div className="itp-grid">
              {images.map((img, index) => (
                <div key={img.id} className="itp-grid-item">
                  <div className="itp-grid-img-wrap" style={{ aspectRatio: orientation === 'portrait' ? '1/1.414' : '1.414/1' }}>
                    <img src={img.dataUrl} alt={`Page ${index + 1}`} loading="lazy" />
                    
                    <button className="itp-grid-remove-btn" onClick={() => removeImage(img.id)} title="Remove Image">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    
                    <button className="itp-grid-edit-btn" onClick={() => openEditor(index)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Edit Layout
                    </button>

                    <div className="itp-grid-controls">
                      <button 
                        className="itp-grid-move-btn" 
                        onClick={() => moveImage(index, -1)} 
                        disabled={index === 0}
                        title="Move Left"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button 
                        className="itp-grid-move-btn" 
                        onClick={() => moveImage(index, 1)} 
                        disabled={index === images.length - 1}
                        title="Move Right"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="itp-grid-label">Page {index + 1}</div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Interactive Editor Modal */}
      {editingIndex !== null && (
        <div className="itp-modal">
          <div className="itp-modal-content">
            <div className="itp-modal-header">
              <h3>Edit Layout for Page {editingIndex + 1}</h3>
              <p>Drag to move, use corners to resize and rotate. The white area is exactly your {orientation} A4 page.</p>
            </div>
            
            <div className="itp-modal-canvas-wrap">
              <Stage width={stageSize.width} height={stageSize.height} ref={stageRef} style={{ background: '#e0e0e0', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', margin: '0 auto' }}>
                <Layer>
                  {/* White A4 Paper Background */}
                  <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="white" />
                  
                  {konvaImageObj && (
                    <KonvaImage
                      ref={imgRef}
                      image={konvaImageObj}
                      {...imgNodeProps}
                      draggable={!isPreviewMode}
                      onDragEnd={(e) => {
                        setImgNodeProps({ ...imgNodeProps, x: e.target.x(), y: e.target.y() });
                      }}
                      onTransformEnd={(e) => {
                        const node = imgRef.current;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        node.scaleX(1);
                        node.scaleY(1);
                        setImgNodeProps({
                          ...imgNodeProps,
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          width: Math.max(5, node.width() * scaleX),
                          height: Math.max(5, node.height() * scaleY)
                        });
                      }}
                    />
                  )}
                  <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} />
                </Layer>
              </Stage>
            </div>

            <div className="itp-modal-actions">
              <button 
                className="itp-btn itp-btn--secondary" 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                style={{ marginRight: 'auto' }}
              >
                {isPreviewMode ? 'Back to Edit' : 'Preview Layout'}
              </button>
              <button className="itp-btn itp-btn--secondary" onClick={closeEditor}>Cancel</button>
              <button className="itp-btn itp-btn--primary" onClick={saveLayout}>Save Layout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

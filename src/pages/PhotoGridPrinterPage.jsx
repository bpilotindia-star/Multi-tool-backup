import { useState, useRef, useCallback, useEffect } from 'react';
import useSEO from '../hooks/useSEO';
import { jsPDF } from 'jspdf';
import './PhotoGridPrinterPage.css';

// Photo sizes in mm (width x height)
const PHOTO_SIZES = [
  { id: 'passport', label: 'Passport Size (35 × 45 mm)', w: 35, h: 45 },
  { id: 'stamp', label: 'Stamp Size (25 × 30 mm)', w: 25, h: 30 },
  { id: 'postcard', label: 'Postcard (100 × 150 mm)', w: 100, h: 150 },
  { id: 'wallet', label: 'Wallet Size (50 × 75 mm)', w: 50, h: 75 },
  { id: '2x2', label: '2×2 inch (51 × 51 mm)', w: 51, h: 51 },
  { id: '1x1', label: '1×1 inch (25 × 25 mm)', w: 25, h: 25 },
];

// Paper sizes in mm
const PAPER_SIZES = [
  { id: 'a4', label: 'A4 (210 × 297 mm)', w: 210, h: 297 },
  { id: '4x6', label: '4×6 inch (102 × 152 mm)', w: 102, h: 152 },
];

// DPI for rendering the preview canvas
const PREVIEW_DPI = 3; // px per mm for preview

export default function PhotoGridPrinterPage() {
  useSEO({
    title: 'Free Photo Grid Printer | Make Passport & Stamp Photos Online',
    description: 'Instantly generate a print-ready A4 grid of your passport or ID photos. Features customizable margins, gaps, and cutting guides. 100% free and private.',
    keywords: 'photo grid printer, passport photo maker, stamp photo print, print multiple photos on a4, ID photo generator, free photo grid tool',
    url: 'https://multi-tool-platform.online/photo-grid'
  });

  const [sourceFile, setSourceFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [sizeId, setSizeId] = useState('passport');
  const [paperId, setPaperId] = useState('a4');
  const [copies, setCopies] = useState('max'); // 'max' or a number
  const [margin, setMargin] = useState(5); // Default to 5mm margin for tighter fit
  const [gap, setGap] = useState(2);       // Default to 2mm gap to fit 30 photos on A4
  const [showGuides, setShowGuides] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [gridInfo, setGridInfo] = useState({ cols: 0, rows: 0, maxTotal: 0, printed: 0 });

  const dragCounter = useRef(0);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const selectedSize = PHOTO_SIZES.find(s => s.id === sizeId);
  const selectedPaper = PAPER_SIZES.find(p => p.id === paperId);

  // Calculate grid dimensions
  const calcGrid = useCallback((photoW, photoH) => {
    const usableW = selectedPaper.w - margin * 2;
    const usableH = selectedPaper.h - margin * 2;
    const cols = Math.floor((usableW + gap) / (photoW + gap));
    const rows = Math.floor((usableH + gap) / (photoH + gap));
    return { cols, rows, maxTotal: cols * rows };
  }, [selectedPaper, margin, gap]);

  // Draw the preview canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !selectedSize) return;

    const { w: photoW, h: photoH } = selectedSize;
    const { cols, rows, maxTotal } = calcGrid(photoW, photoH);
    const printedTotal = copies === 'max' ? maxTotal : Math.min(Math.max(1, Number(copies) || 1), maxTotal);

    const canvasW = selectedPaper.w * PREVIEW_DPI;
    const canvasH = selectedPaper.h * PREVIEW_DPI;
    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');

    // White background (A4 paper)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const marginPx = margin * PREVIEW_DPI;
    const gapPx = gap * PREVIEW_DPI;
    const photoWPx = photoW * PREVIEW_DPI;
    const photoHPx = photoH * PREVIEW_DPI;

    // Top-Left Alignment to save paper space
    const offsetX = marginPx;
    const offsetY = marginPx;

    // Calculate how many rows/cols are actually used
    const usedRows = Math.ceil(printedTotal / cols);
    const totalGridW = cols * photoWPx + (cols - 1) * gapPx;
    const totalGridH = usedRows * photoHPx + (usedRows - 1) * gapPx;

    let drawn = 0;
    // Draw photos
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (drawn >= printedTotal) break;
        
        const x = offsetX + col * (photoWPx + gapPx);
        const y = offsetY + row * (photoHPx + gapPx);

        // Draw image (cover-fit)
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const cellAspect = photoWPx / photoHPx;

        let sx, sy, sw, sh;
        if (imgAspect > cellAspect) {
          // Image is wider → crop sides
          sh = img.naturalHeight;
          sw = sh * cellAspect;
          sx = (img.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          // Image is taller → crop top/bottom
          sw = img.naturalWidth;
          sh = sw / cellAspect;
          sx = 0;
          sy = (img.naturalHeight - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, x, y, photoWPx, photoHPx);

        // Thin border around each photo
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, photoWPx, photoHPx);
        
        drawn++;
      }
    }

    // Draw cutting guides (dashed lines)
    if (showGuides) {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 0.8;

      // Horizontal cutting lines (only up to used rows)
      for (let row = 0; row <= usedRows; row++) {
        const y = offsetY + row * (photoHPx + gapPx) - gapPx / 2;
        
        // Find how many cols to draw for this horizontal line
        let lineCols = cols;
        if (row === usedRows && printedTotal % cols !== 0) {
           lineCols = printedTotal % cols;
        }
        
        const lineWidth = lineCols * photoWPx + (lineCols - 1) * gapPx;
        
        if (row === 0) {
          const yTop = offsetY - gapPx / 2;
          ctx.beginPath();
          ctx.moveTo(offsetX - gapPx, yTop);
          ctx.lineTo(offsetX + totalGridW + gapPx, yTop); // Top line always full width
          ctx.stroke();
        }
        if (row > 0) {
          ctx.beginPath();
          ctx.moveTo(offsetX - gapPx, y);
          ctx.lineTo(offsetX + lineWidth + gapPx, y);
          ctx.stroke();
        }
      }

      // Vertical cutting lines
      for (let col = 0; col <= cols; col++) {
        const x = offsetX + col * (photoWPx + gapPx) - gapPx / 2;
        
        // Calculate line height for this column based on printedTotal
        let colRows = usedRows;
        if (col > (printedTotal % cols) && printedTotal % cols !== 0) {
          colRows = usedRows - 1;
        }
        
        const lineHeight = colRows * photoHPx + (colRows - 1) * gapPx;
        
        if (col === 0) {
          const xLeft = offsetX - gapPx / 2;
          ctx.beginPath();
          ctx.moveTo(xLeft, offsetY - gapPx);
          ctx.lineTo(xLeft, offsetY + totalGridH + gapPx); // Leftmost line always full height
          ctx.stroke();
        }
        if (col > 0 && colRows > 0) {
          ctx.beginPath();
          ctx.moveTo(x, offsetY - gapPx);
          ctx.lineTo(x, offsetY + lineHeight + gapPx);
          ctx.stroke();
        }
      }

      // Small scissors icon hint at top-left
      ctx.setLineDash([]);
      ctx.fillStyle = '#bbbbbb';
      ctx.font = `${10 * PREVIEW_DPI}px sans-serif`;
      ctx.fillText('✂', offsetX - gapPx - 2, offsetY - gapPx - 4);
    }

    setGridInfo({ cols, rows, maxTotal, printed: printedTotal });
  }, [selectedSize, selectedPaper, showGuides, copies, calcGrid, margin, gap]);

  // Redraw when settings change
  useEffect(() => {
    if (imageUrl && imgRef.current) {
      drawPreview();
    }
  }, [imageUrl, sizeId, paperId, showGuides, copies, margin, gap, drawPreview]);

  // Load image
  const loadImage = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setSourceFile(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawPreview();
    };
    img.src = url;
  };

  // Drag & Drop
  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); dragCounter.current = 0; setIsDragging(false); if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); };
  const handleInputChange = (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); e.target.value = ''; };

  const clearFile = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setSourceFile(null);
    setImageUrl('');
  };

  // Download as PDF
  const downloadPDF = () => {
    if (!imgRef.current || !selectedSize || !selectedPaper) return;

    const { w: photoW, h: photoH } = selectedSize;
    const { cols, rows, maxTotal } = calcGrid(photoW, photoH);
    const printedTotal = copies === 'max' ? maxTotal : Math.min(Math.max(1, Number(copies) || 1), maxTotal);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [selectedPaper.w, selectedPaper.h] });

    // Top-Left Alignment
    const offsetX = margin;
    const offsetY = margin;
    
    const usedRows = Math.ceil(printedTotal / cols);
    const totalGridW = cols * photoW + (cols - 1) * gap;
    const totalGridH = usedRows * photoH + (usedRows - 1) * gap;

    // Use a temporary canvas for high quality crop
    const img = imgRef.current;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const cellAspect = photoW / photoH;

    const tempCanvas = document.createElement('canvas');
    const pdfDpi = 10; // px per mm for PDF images
    tempCanvas.width = photoW * pdfDpi;
    tempCanvas.height = photoH * pdfDpi;
    const tCtx = tempCanvas.getContext('2d');

    let sx, sy, sw, sh;
    if (imgAspect > cellAspect) {
      sh = img.naturalHeight;
      sw = sh * cellAspect;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / cellAspect;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tempCanvas.width, tempCanvas.height);
    const croppedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.92);

    let drawn = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (drawn >= printedTotal) break;
        const x = offsetX + col * (photoW + gap);
        const y = offsetY + row * (photoH + gap);
        pdf.addImage(croppedDataUrl, 'JPEG', x, y, photoW, photoH);
        drawn++;
      }
    }

    // Draw cutting guides
    if (showGuides) {
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineDashPattern([2, 1.5], 0);
      pdf.setLineWidth(0.2);

      for (let row = 0; row <= usedRows; row++) {
        const y = offsetY + row * (photoH + gap) - gap / 2;
        let lineCols = cols;
        if (row === usedRows && printedTotal % cols !== 0) lineCols = printedTotal % cols;
        const lineWidth = lineCols * photoW + (lineCols - 1) * gap;

        if (row === 0) {
          const yTop = offsetY - gap / 2;
          pdf.line(offsetX - gap, yTop, offsetX + totalGridW + gap, yTop);
        }
        if (row > 0) {
          pdf.line(offsetX - gap, y, offsetX + lineWidth + gap, y);
        }
      }

      for (let col = 0; col <= cols; col++) {
        const x = offsetX + col * (photoW + gap) - gap / 2;
        let colRows = usedRows;
        if (col > (printedTotal % cols) && printedTotal % cols !== 0) colRows = usedRows - 1;
        const lineHeight = colRows * photoH + (colRows - 1) * gap;

        if (col === 0) {
          const xLeft = offsetX - gap / 2;
          pdf.line(xLeft, offsetY - gap, xLeft, offsetY + totalGridH + gap);
        }
        if (col > 0 && colRows > 0) {
          pdf.line(x, offsetY - gap, x, offsetY + lineHeight + gap);
        }
      }
    }

    pdf.save(`photo_grid_${sizeId}.pdf`);
  };

  // Download as High-Res Image (300 DPI)
  const downloadImage = () => {
    const exportDpi = 11.811; // 300 DPI
    const exportCanvas = document.createElement('canvas');
    const img = imgRef.current;
    if (!exportCanvas || !img || !selectedSize || !selectedPaper) return;

    const { w: photoW, h: photoH } = selectedSize;
    const { cols, rows, maxTotal } = calcGrid(photoW, photoH);
    const printedTotal = copies === 'max' ? maxTotal : Math.min(Math.max(1, Number(copies) || 1), maxTotal);

    const canvasW = selectedPaper.w * exportDpi;
    const canvasH = selectedPaper.h * exportDpi;
    exportCanvas.width = canvasW;
    exportCanvas.height = canvasH;

    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const gapPx = gap * exportDpi;
    const photoWPx = photoW * exportDpi;
    const photoHPx = photoH * exportDpi;
    const offsetX = margin * exportDpi;
    const offsetY = margin * exportDpi;

    const usedRows = Math.ceil(printedTotal / cols);
    const totalGridW = cols * photoWPx + (cols - 1) * gapPx;
    const totalGridH = usedRows * photoHPx + (usedRows - 1) * gapPx;

    let drawn = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (drawn >= printedTotal) break;
        const x = offsetX + col * (photoWPx + gapPx);
        const y = offsetY + row * (photoHPx + gapPx);

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const cellAspect = photoWPx / photoHPx;

        let sx, sy, sw, sh;
        if (imgAspect > cellAspect) {
          sh = img.naturalHeight;
          sw = sh * cellAspect;
          sx = (img.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          sw = img.naturalWidth;
          sh = sw / cellAspect;
          sx = 0;
          sy = (img.naturalHeight - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, x, y, photoWPx, photoHPx);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, photoWPx, photoHPx);
        drawn++;
      }
    }

    if (showGuides) {
      ctx.setLineDash([20, 15]);
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 2;

      for (let row = 0; row <= usedRows; row++) {
        const yTop = offsetY - gapPx / 2;
        const yLine = offsetY + row * (photoHPx + gapPx) - gapPx / 2;
        
        let lineCols = cols;
        if (row === usedRows && printedTotal % cols !== 0) lineCols = printedTotal % cols;
        const lineWidth = lineCols * photoWPx + (lineCols - 1) * gapPx;

        ctx.beginPath();
        if (row === 0) { ctx.moveTo(offsetX - gapPx, yTop); ctx.lineTo(offsetX + totalGridW + gapPx, yTop); }
        if (row > 0) { ctx.moveTo(offsetX - gapPx, yLine); ctx.lineTo(offsetX + lineWidth + gapPx, yLine); }
        ctx.stroke();
      }

      for (let col = 0; col <= cols; col++) {
        const xLeft = offsetX - gapPx / 2;
        const xLine = offsetX + col * (photoWPx + gapPx) - gapPx / 2;
        
        let colRows = usedRows;
        if (col > (printedTotal % cols) && printedTotal % cols !== 0) colRows = usedRows - 1;
        const lineHeight = colRows * photoHPx + (colRows - 1) * gapPx;

        ctx.beginPath();
        if (col === 0) { ctx.moveTo(xLeft, offsetY - gapPx); ctx.lineTo(xLeft, offsetY + totalGridH + gapPx); }
        if (col > 0 && colRows > 0) { ctx.moveTo(xLine, offsetY - gapPx); ctx.lineTo(xLine, offsetY + lineHeight + gapPx); }
        ctx.stroke();
      }
    }

    const link = document.createElement('a');
    link.download = `photo_grid_${sizeId}.jpg`;
    link.href = exportCanvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // Print directly
  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head><title>Photo Grid Print</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
            img { width: 210mm; height: 297mm; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="pg-page">
      <div className="pg-header">
        <h1 className="pg-title">Photo Grid Printer</h1>
        <p className="pg-desc">
          Upload a photo and instantly generate a print-ready A4 sheet with a grid of copies. 
          Perfect for passport photos, ID photos, and forms. Includes dashed cutting guides.
        </p>
      </div>

      <div className="pg-workspace">
        {!sourceFile && (
          <div
            className={`pg-upload ${isDragging ? 'pg-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pg-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pg-upload__icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p className="pg-upload__text">Drag & drop a photo</p>
              <label className="pg-upload__btn" htmlFor="pg-upload">Select Photo</label>
              <input type="file" id="pg-upload" accept="image/*" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {sourceFile && (
          <div className="pg-editor">
            <div className="pg-editor-header">
              <div>
                <h2 className="pg-editor-title">{sourceFile.name}</h2>
                <p className="pg-editor-subtitle">Configure photo size and download the print-ready sheet.</p>
              </div>
              <div className="pg-editor-actions">
                <button className="pg-btn pg-btn--secondary" onClick={clearFile}>Clear</button>
                <button className="pg-btn pg-btn--secondary" onClick={handlePrint}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Print
                </button>
                <button className="pg-btn pg-btn--secondary" onClick={downloadImage}>
                  Download JPG
                </button>
                <button className="pg-btn pg-btn--primary" onClick={downloadPDF}>
                  Download PDF
                </button>
              </div>
            </div>

            <div className="pg-editor-layout">
              {/* Settings Panel */}
              <div className="pg-settings">
                <h3 className="pg-settings-title">Settings</h3>

                <div className="pg-control-group">
                  <label className="pg-label">Paper Size</label>
                  <select className="pg-select" value={paperId} onChange={e => setPaperId(e.target.value)}>
                    {PAPER_SIZES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pg-control-group">
                  <label className="pg-label">Photo Size</label>
                  <select className="pg-select" value={sizeId} onChange={e => setSizeId(e.target.value)}>
                    {PHOTO_SIZES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pg-control-group">
                  <label className="pg-label">Number of Copies</label>
                  <select 
                    className="pg-select" 
                    value={copies === 'max' ? 'max' : 'custom'} 
                    onChange={e => setCopies(e.target.value === 'max' ? 'max' : 1)}
                  >
                    <option value="max">Fill Entire Page</option>
                    <option value="custom">Custom Amount...</option>
                  </select>
                  {copies !== 'max' && (
                    <input 
                      type="number" 
                      className="pg-select" 
                      style={{ marginTop: '8px', backgroundImage: 'none', paddingRight: '14px' }}
                      min="1" 
                      max={gridInfo.maxTotal} 
                      value={copies} 
                      onChange={e => setCopies(e.target.value)} 
                    />
                  )}
                </div>

                <div className="pg-control-group">
                  <label className="pg-label">Page Margins (mm)</label>
                  <input 
                    type="number" 
                    className="pg-select" 
                    style={{ backgroundImage: 'none', paddingRight: '14px' }}
                    min="0" 
                    max="50" 
                    value={margin} 
                    onChange={e => setMargin(Number(e.target.value))} 
                  />
                </div>

                <div className="pg-control-group">
                  <label className="pg-label">Photo Spacing (mm)</label>
                  <input 
                    type="number" 
                    className="pg-select" 
                    style={{ backgroundImage: 'none', paddingRight: '14px' }}
                    min="0" 
                    max="20" 
                    value={gap} 
                    onChange={e => setGap(Number(e.target.value))} 
                  />
                </div>

                <div className="pg-checkbox-row">
                  <input
                    type="checkbox"
                    className="pg-checkbox"
                    id="pg-guides"
                    checked={showGuides}
                    onChange={e => setShowGuides(e.target.checked)}
                  />
                  <label className="pg-checkbox-label" htmlFor="pg-guides">Show Cutting Guides</label>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
                  <p className="pg-label" style={{ marginBottom: '8px' }}>Grid Info</p>
                  <div className="pg-info-row">
                    <span className="pg-info-label">Photo Size</span>
                    <span className="pg-info-value">{selectedSize?.w} × {selectedSize?.h} mm</span>
                  </div>
                  <div className="pg-info-row">
                    <span className="pg-info-label">Max Capacity</span>
                    <span className="pg-info-value">{gridInfo.maxTotal} photos</span>
                  </div>
                  <div className="pg-info-row">
                    <span className="pg-info-label">Printing</span>
                    <span className="pg-info-value" style={{ color: 'var(--text-primary)' }}>{gridInfo.printed} photos</span>
                  </div>
                  <div className="pg-info-row" style={{ borderBottom: 'none' }}>
                    <span className="pg-info-label">Paper</span>
                    <span className="pg-info-value">{selectedPaper?.label}</span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="pg-preview">
                <h3 className="pg-preview-title">Print Preview</h3>
                <div className="pg-canvas-wrapper">
                  <canvas ref={canvasRef} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

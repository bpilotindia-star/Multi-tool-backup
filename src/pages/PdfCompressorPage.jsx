import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { jsPDF } from 'jspdf';
import './PdfCompressorPage.css';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfCompressorPage() {
  const [pdfFile, setPdfFile] = useState(null); // { file, name, size, totalPages }
  const [level, setLevel] = useState('medium'); // low | medium | extreme
  const [status, setStatus] = useState('idle'); // idle | processing | done
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null); // { originalSize, compressedSize, blobUrl }
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setStatus('processing');
    setProgress({ current: 0, total: 0 });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfFile({
        file: file,
        name: file.name,
        size: file.size,
        totalPages: pdf.numPages,
        arrayBuffer: arrayBuffer
      });
      setResults(null);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      alert('Failed to read PDF file.');
      setStatus('idle');
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

  const clearFile = () => {
    setPdfFile(null);
    setResults(null);
  };

  const compressPDF = async () => {
    if (!pdfFile) return;

    setStatus('processing');
    setProgress({ current: 0, total: pdfFile.totalPages });
    setResults(null);

    let scale = 1.0;
    let quality = 0.6;

    if (level === 'low') {
      scale = 1.5;
      quality = 0.8;
    } else if (level === 'extreme') {
      scale = 0.75;
      quality = 0.4;
    }

    try {
      // Small timeout to allow UI to update
      await new Promise(r => setTimeout(r, 100));

      const arrayBuffer = await pdfFile.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const newPdf = new jsPDF({ unit: 'pt', compress: true });
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProgress({ current: pageNum, total: pdf.numPages });
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const imgData = canvas.toDataURL('image/jpeg', quality);

        // Original viewport at scale 1 for actual physical PDF dimensions in points
        const originalViewport = page.getViewport({ scale: 1.0 });
        const orientation = originalViewport.width > originalViewport.height ? 'landscape' : 'portrait';

        if (pageNum > 1) {
          newPdf.addPage([originalViewport.width, originalViewport.height], orientation);
        } else {
          // Change first page format dynamically if possible, or just add it
          // jsPDF doesn't cleanly allow changing the very first page size after init without undocumented tricks
          // So we initialize it properly above or just ignore small discrepancies. 
          // For safety, let's just use the current page format.
          newPdf.setPage(1);
          // Hack to set first page dimensions
          newPdf.internal.pageSize.width = originalViewport.width;
          newPdf.internal.pageSize.height = originalViewport.height;
        }

        newPdf.addImage(imgData, 'JPEG', 0, 0, originalViewport.width, originalViewport.height);
      }

      setProgress({ current: 'Finalizing...', total: pdf.numPages });
      
      // Output as blob to calculate final size
      const compressedBlob = newPdf.output('blob');
      const blobUrl = URL.createObjectURL(compressedBlob);
      
      setResults({
        originalSize: pdfFile.size,
        compressedSize: compressedBlob.size,
        blobUrl: blobUrl
      });
      
      setStatus('done');

    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('An error occurred during compression.');
    }
  };

  const handleDownload = () => {
    if (!results) return;
    const a = document.createElement('a');
    a.href = results.blobUrl;
    const newName = pdfFile.name.replace(/\.pdf$/i, '') + '_compressed.pdf';
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Cleanup blob url
  useEffect(() => {
    return () => {
      if (results?.blobUrl) {
        URL.revokeObjectURL(results.blobUrl);
      }
    };
  }, [results]);

  const percentageSaved = results ? Math.max(0, ((results.originalSize - results.compressedSize) / results.originalSize) * 100).toFixed(1) : 0;

  return (
    <div className="pc-page">
      <div className="pc-header">
        <h1 className="pc-title">PDF Compressor</h1>
        <p className="pc-desc">
          Drastically reduce the file size of your PDF documents locally without uploading to any server.
        </p>
      </div>

      <div className="pc-workspace">
        {!pdfFile ? (
          <div
            className={`pc-upload ${isDragging ? 'pc-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pc-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pc-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
              <p className="pc-upload__text">Drag & drop your PDF file</p>
              <p className="pc-upload__subtext">Process happens 100% locally in your browser</p>
              <label className="pc-upload__btn" htmlFor="pc-upload">Select PDF</label>
              <input type="file" id="pc-upload" accept="application/pdf" onChange={handleInputChange} hidden />
            </div>
          </div>
        ) : (
          <div className="pc-editor">
            
            <div className="pc-editor-header">
              <div>
                <h2 className="pc-editor-title">{pdfFile.name}</h2>
                <p className="pc-editor-subtitle">{pdfFile.totalPages} Pages • {formatBytes(pdfFile.size)}</p>
              </div>
              <div className="pc-editor-actions">
                <button className="pc-btn pc-btn--danger" onClick={clearFile} disabled={status === 'processing'}>Remove</button>
              </div>
            </div>

            {!results ? (
              <div className="pc-controls-wrap">
                <div className="pc-controls">
                  <h3 className="pc-controls-title">Select Compression Level</h3>
                  <p className="pc-help-text">
                    Note: This local process converts pages into high-quality images to bypass server uploads. Text will no longer be selectable.
                  </p>
                  
                  <div className="pc-radio-group">
                    <button 
                      className={`pc-radio-btn ${level === 'low' ? 'pc-radio-btn--active' : ''}`}
                      onClick={() => setLevel('low')}
                      disabled={status === 'processing'}
                    >
                      <div className="pc-radio-title">Low Compression</div>
                      <div className="pc-radio-desc">High Quality</div>
                    </button>
                    <button 
                      className={`pc-radio-btn ${level === 'medium' ? 'pc-radio-btn--active' : ''}`}
                      onClick={() => setLevel('medium')}
                      disabled={status === 'processing'}
                    >
                      <div className="pc-radio-title">Medium Compression</div>
                      <div className="pc-radio-desc">Recommended</div>
                    </button>
                    <button 
                      className={`pc-radio-btn ${level === 'extreme' ? 'pc-radio-btn--active' : ''}`}
                      onClick={() => setLevel('extreme')}
                      disabled={status === 'processing'}
                    >
                      <div className="pc-radio-title">Extreme Compression</div>
                      <div className="pc-radio-desc">Low Quality</div>
                    </button>
                  </div>

                  {status === 'processing' ? (
                    <div className="pc-progress">
                      <div className="pc-progress-text">
                        {typeof progress.current === 'number' ? `Compressing page ${progress.current} of ${progress.total}...` : progress.current}
                      </div>
                      <div className="pc-progress-track">
                        <div 
                          className="pc-progress-fill" 
                          style={{ width: `${typeof progress.current === 'number' ? (progress.current / progress.total) * 100 : 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <button className="pc-btn pc-btn--primary pc-btn--large" onClick={compressPDF}>
                      Compress PDF Now
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="pc-results">
                <div className="pc-results-box">
                  <div className="pc-results-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2beb84" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h3 className="pc-results-title">Compression Successful!</h3>
                  <div className="pc-stats-row">
                    <div className="pc-stat-card">
                      <span className="pc-stat-label">Original</span>
                      <span className="pc-stat-val">{formatBytes(results.originalSize)}</span>
                    </div>
                    <div className="pc-stat-arrow">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>
                    <div className="pc-stat-card pc-stat-card--success">
                      <span className="pc-stat-label">Compressed</span>
                      <span className="pc-stat-val">{formatBytes(results.compressedSize)}</span>
                    </div>
                  </div>
                  
                  {results.compressedSize < results.originalSize ? (
                    <p className="pc-success-text">You saved {percentageSaved}% of the file size!</p>
                  ) : (
                    <p className="pc-warning-text">The compressed file is larger. Try a heavier compression level, or the original PDF was already highly optimized text.</p>
                  )}

                  <div className="pc-results-actions">
                    <button className="pc-btn pc-btn--secondary" onClick={() => setResults(null)}>Try Another Level</button>
                    <button className="pc-btn pc-btn--primary" onClick={handleDownload}>
                      Download Compressed PDF
                    </button>
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

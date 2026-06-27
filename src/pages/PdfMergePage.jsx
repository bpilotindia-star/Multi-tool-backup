import { useState, useRef, useEffect } from 'react';
import useSEO from '../hooks/useSEO';
import { PDFDocument } from 'pdf-lib';
import './PdfMergePage.css';

export default function PdfMergePage() {
  useSEO({
    title: 'Free PDF Merger | Combine PDF Files Online',
    description: 'Merge multiple PDF files into one easily. Reorder pages with drag and drop. 100% private, no files are uploaded to any server.',
    keywords: 'merge pdf, combine pdf, join pdf files, pdf merger online, free pdf merger, client side pdf tools',
    url: 'https://multi-tool-platform.online/pdf-merge'
  });

  const [pdfFiles, setPdfFiles] = useState([]); // array of { id, file, name, size }
  const [status, setStatus] = useState('idle'); // idle | processing | done
  const [progressMsg, setProgressMsg] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if (validFiles.length === 0) return;

    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }));

    setPdfFiles(prev => [...prev, ...newFiles]);
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

  const removeFile = (id) => {
    setPdfFiles(pdfFiles.filter(f => f.id !== id));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...pdfFiles];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      const temp = newFiles[index];
      newFiles[index] = newFiles[targetIndex];
      newFiles[targetIndex] = temp;
      setPdfFiles(newFiles);
    }
  };

  const clearAll = () => {
    setPdfFiles([]);
  };

  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      alert("Please select at least 2 PDF files to merge.");
      return;
    }

    setStatus('processing');
    setProgressMsg('Initializing merge...');

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfFiles.length; i++) {
        setProgressMsg(`Processing document ${i + 1} of ${pdfFiles.length}...`);
        
        const fileBuffer = await pdfFiles[i].file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      setProgressMsg('Saving merged PDF...');
      const mergedPdfFile = await mergedPdf.save();
      
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Merged_Document.pdf';
      a.click();
      URL.revokeObjectURL(url);

      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      alert('An error occurred while merging the PDFs.');
      setStatus('idle');
    }
  };

  return (
    <div className="pm-page">
      <div className="pm-header">
        <h1 className="pm-title">Merge PDF</h1>
        <p className="pm-desc">
          Combine multiple PDF files into one document quickly and securely. All processing happens in your browser.
        </p>
      </div>

      <div className="pm-workspace">
        {pdfFiles.length === 0 ? (
          <div
            className={`pm-upload ${isDragging ? 'pm-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pm-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pm-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <p className="pm-upload__text">Drag & drop PDF files here</p>
              <label className="pm-upload__btn" htmlFor="pm-upload">Select PDFs</label>
              <input type="file" id="pm-upload" accept="application/pdf" multiple onChange={handleInputChange} hidden />
            </div>
          </div>
        ) : (
          <div className="pm-editor">
            <div className="pm-editor-header">
              <div>
                <h2 className="pm-editor-title">{pdfFiles.length} PDF{pdfFiles.length !== 1 ? 's' : ''} Selected</h2>
                <p className="pm-editor-subtitle">They will be merged in the order shown below.</p>
              </div>
              <div className="pm-editor-actions">
                <label className="pm-btn pm-btn--secondary" htmlFor="pm-upload-more">
                  Add More
                </label>
                <input type="file" id="pm-upload-more" accept="application/pdf" multiple onChange={handleInputChange} hidden />
                <button className="pm-btn pm-btn--danger" onClick={clearAll}>Clear All</button>
                <button className="pm-btn pm-btn--primary" onClick={mergePDFs} disabled={status === 'processing' || pdfFiles.length < 2}>
                  {status === 'processing' ? 'Merging...' : 'Merge PDFs'}
                </button>
              </div>
            </div>

            {status === 'processing' && (
              <div className="pm-progress-bar">
                <div className="pm-progress-text">{progressMsg}</div>
                <div className="pm-progress-track">
                  <div className="pm-progress-fill"></div>
                </div>
              </div>
            )}

            <div className="pm-list">
              {pdfFiles.map((f, index) => (
                <div key={f.id} className="pm-list-item">
                  <div className="pm-list-info">
                    <div className="pm-list-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="pm-list-details">
                      <div className="pm-list-name">{f.name}</div>
                      <div className="pm-list-size">{f.size}</div>
                    </div>
                  </div>
                  
                  <div className="pm-list-controls">
                    <button 
                      className="pm-btn-icon" 
                      onClick={() => moveFile(index, -1)} 
                      disabled={index === 0}
                      title="Move Up"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button 
                      className="pm-btn-icon" 
                      onClick={() => moveFile(index, 1)} 
                      disabled={index === pdfFiles.length - 1}
                      title="Move Down"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button className="pm-btn-icon pm-btn-icon--danger" onClick={() => removeFile(f.id)} title="Remove PDF">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

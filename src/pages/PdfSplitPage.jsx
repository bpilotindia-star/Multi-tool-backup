import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './PdfSplitPage.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfSplitPage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | parsing | extracting | done | error
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  
  const [pages, setPages] = useState([]); // array of { pageNum, url, selected }
  const [exportMode, setExportMode] = useState('single'); // 'single' (merged) | 'separate' (zip)
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const loadPDF = async (file) => {
    setStatus('parsing');
    setProgressMsg('Loading PDF preview...');
    setProgressPct(0);
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setSourceFile(file);

      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      const numPages = pdf.numPages;
      const extractedPages = [];

      for (let i = 1; i <= numPages; i++) {
        setProgressMsg(`Generating preview ${i} of ${numPages}...`);
        setProgressPct(Math.round(((i - 1) / numPages) * 100));

        const page = await pdf.getPage(i);
        // Use lower scale for faster thumbnails
        const viewport = page.getViewport({ scale: 0.7 }); 

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const url = canvas.toDataURL('image/jpeg', 0.8);
        extractedPages.push({ pageNum: i, url, selected: true }); // By default all selected
      }

      setPages(extractedPages);
      setProgressPct(100);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setProgressMsg('Failed to process PDF. Ensure it is not password protected or corrupted.');
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      loadPDF(file);
    } else {
      alert('Please upload a valid PDF file.');
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
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };
  const handleInputChange = (e) => {
    if (e.target.files[0]) handleFileSelect(e.target.files[0]);
    e.target.value = '';
  };

  const togglePageSelection = (pageNum) => {
    setPages(pages.map(p => p.pageNum === pageNum ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = () => setPages(pages.map(p => ({ ...p, selected: true })));
  const deselectAll = () => setPages(pages.map(p => ({ ...p, selected: false })));

  const handleReset = () => {
    setSourceFile(null);
    setPages([]);
    setStatus('idle');
    setProgressPct(0);
  };

  const extractSelected = async () => {
    const selectedPages = pages.filter(p => p.selected).map(p => p.pageNum - 1); // 0-indexed for pdf-lib

    if (selectedPages.length === 0) {
      alert("Please select at least one page to extract.");
      return;
    }

    setStatus('extracting');
    setProgressMsg('Preparing PDF...');

    try {
      const arrayBuffer = await sourceFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      
      if (exportMode === 'single') {
        setProgressMsg('Creating single PDF...');
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, selectedPages);
        
        copiedPages.forEach((page) => {
          newPdf.addPage(page);
        });

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `${sourceFile.name.replace('.pdf', '')}_extracted.pdf`);
      } else {
        if (selectedPages.length === 1) {
          setProgressMsg('Extracting 1 page...');
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(sourcePdf, [selectedPages[0]]);
          newPdf.addPage(copiedPage);
          
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          saveAs(blob, `${sourceFile.name.replace('.pdf', '')}_page_${selectedPages[0] + 1}.pdf`);
        } else {
          setProgressMsg('Creating ZIP file...');
          const zip = new JSZip();
          const folderName = sourceFile.name.replace('.pdf', '') + '_pages';
          const folder = zip.folder(folderName);
          
          for (let i = 0; i < selectedPages.length; i++) {
            setProgressMsg(`Processing page ${selectedPages[i] + 1} (${i + 1}/${selectedPages.length})...`);
            
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(sourcePdf, [selectedPages[i]]);
            newPdf.addPage(copiedPage);
            
            const pdfBytes = await newPdf.save();
            folder.file(`page_${selectedPages[i] + 1}.pdf`, pdfBytes);
          }
          
          setProgressMsg('Zipping files...');
          const zipContent = await zip.generateAsync({ type: 'blob' });
          saveAs(zipContent, `${folderName}.zip`);
        }
      }

      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      alert('An error occurred while extracting the PDF pages.');
      setStatus('idle');
    }
  };

  const selectedCount = pages.filter(p => p.selected).length;

  return (
    <div className="ps-page">
      <div className="ps-header">
        <h1 className="ps-title">Split & Extract PDF</h1>
        <p className="ps-desc">
          Visually select which pages you want to extract or remove. Save them as a single document or separate files.
        </p>
      </div>

      <div className="ps-workspace">
        {!sourceFile && (
          <div
            className={`ps-upload ${isDragging ? 'ps-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="ps-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ps-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M10 18v-4a2 2 0 0 1 4 0v4" />
                <path d="M8 12h8" />
              </svg>
              <p className="ps-upload__text">Drag & drop a PDF file here</p>
              <label className="ps-upload__btn" htmlFor="ps-upload">Select PDF</label>
              <input type="file" id="ps-upload" accept="application/pdf" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'parsing' || status === 'error' || status === 'extracting' || status === 'done') && !pages.length && (
          <div className="ps-progress-card">
            <h3 className="ps-progress-title">{progressMsg}</h3>
            {(status === 'parsing' || status === 'extracting') && (
              <div className="ps-progress-bar">
                <div className="ps-progress-fill" style={{ width: `${progressPct}%`, animation: progressPct === 0 ? 'ps-loading 1.5s infinite linear' : 'none' }}></div>
              </div>
            )}
            {status === 'error' && (
              <button className="ps-btn ps-btn--secondary mt-4" onClick={handleReset} style={{ marginTop: '1rem' }}>Try Again</button>
            )}
          </div>
        )}

        {pages.length > 0 && (
          <div className="ps-editor">
            <div className="ps-editor-header">
              <div>
                <h2 className="ps-editor-title">{sourceFile.name}</h2>
                <p className="ps-editor-subtitle">{selectedCount} of {pages.length} Pages Selected</p>
              </div>
              <div className="ps-editor-actions">
                <button className="ps-btn ps-btn--secondary" onClick={handleReset} disabled={status === 'extracting'}>Clear File</button>
                <div className="ps-divider"></div>
                <button className="ps-btn ps-btn--secondary" onClick={selectAll} disabled={status === 'extracting'}>Select All</button>
                <button className="ps-btn ps-btn--secondary" onClick={deselectAll} disabled={status === 'extracting'}>Deselect All</button>
              </div>
            </div>

            <div className="ps-options">
              <h3>Export Options</h3>
              <div className="ps-option-group ps-option-group--row">
                <label className="ps-radio-label">
                  <input 
                    type="radio" 
                    name="exportMode" 
                    value="single" 
                    checked={exportMode === 'single'} 
                    onChange={() => setExportMode('single')} 
                    disabled={status === 'extracting'}
                  />
                  <div className="ps-radio-content">
                    <span className="ps-radio-title">Merge into one PDF</span>
                    <span className="ps-radio-desc">Selected pages will form a single new PDF document. (Useful for removing pages)</span>
                  </div>
                </label>
                
                <label className="ps-radio-label">
                  <input 
                    type="radio" 
                    name="exportMode" 
                    value="separate" 
                    checked={exportMode === 'separate'} 
                    onChange={() => setExportMode('separate')}
                    disabled={status === 'extracting'}
                  />
                  <div className="ps-radio-content">
                    <span className="ps-radio-title">Separate PDF files</span>
                    <span className="ps-radio-desc">Each selected page will be saved as an individual PDF inside a ZIP archive.</span>
                  </div>
                </label>
              </div>

              <div className="ps-export-action">
                <button className="ps-btn ps-btn--primary" onClick={extractSelected} disabled={status === 'extracting' || selectedCount === 0}>
                  {status === 'extracting' ? 'Processing...' : `Export ${selectedCount} Pages`}
                </button>
              </div>
              
              {status === 'extracting' && (
                <div className="ps-progress-bar" style={{ marginTop: '1rem' }}>
                  <div className="ps-progress-text" style={{ color: 'var(--text-white)' }}>{progressMsg}</div>
                </div>
              )}
            </div>

            <div className="ps-grid">
              {pages.map((page) => (
                <div 
                  key={page.pageNum} 
                  className={`ps-grid-item ${page.selected ? 'ps-grid-item--selected' : ''}`}
                  onClick={() => togglePageSelection(page.pageNum)}
                >
                  <div className="ps-grid-img-wrap">
                    <img src={page.url} alt={`Page ${page.pageNum}`} loading="lazy" />
                    <div className="ps-grid-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                  <div className="ps-grid-label">Page {page.pageNum}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

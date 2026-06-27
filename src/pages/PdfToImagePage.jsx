import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './PdfToImagePage.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfToImagePage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [images, setImages] = useState([]); // array of { pageNum, url }
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const extractPages = async (file) => {
    setStatus('processing');
    setProgressMsg('Loading PDF...');
    setProgressPct(0);
    setImages([]);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const numPages = pdf.numPages;
          const extractedImages = [];

          for (let i = 1; i <= numPages; i++) {
            setProgressMsg(`Extracting page ${i} of ${numPages}...`);
            setProgressPct(Math.round(((i - 1) / numPages) * 100));

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for high quality

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            const url = canvas.toDataURL('image/jpeg', 0.9);
            extractedImages.push({ pageNum: i, url });
          }

          setImages(extractedImages);
          setProgressPct(100);
          setProgressMsg('Extraction complete!');
          setTimeout(() => {
            setStatus('done');
          }, 500);

        } catch (err) {
          console.error(err);
          setStatus('error');
          setProgressMsg('Failed to process PDF. Ensure it is not password protected or corrupted.');
        }
      };
      fileReader.readAsArrayBuffer(file);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setProgressMsg('Failed to read file.');
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setSourceFile(file);
      extractPages(file);
    } else {
      alert('Please upload a valid PDF file.');
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

  const downloadSingle = (img) => {
    saveAs(img.url, `page_${img.pageNum.toString().padStart(3, '0')}.jpg`);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder("pdf_pages");
    
    images.forEach((img) => {
      const base64Data = img.url.split(',')[1];
      folder.file(`page_${img.pageNum.toString().padStart(3, '0')}.jpg`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const zipName = sourceFile.name.replace(/\.[^/.]+$/, "") + "_pages.zip";
    saveAs(content, zipName);
  };

  const handleReset = () => {
    setSourceFile(null);
    setImages([]);
    setStatus('idle');
    setProgressPct(0);
  };

  return (
    <div className="pdf-page">
      <div className="pdf-header">
        <h1 className="pdf-title">PDF to Image Converter</h1>
        <p className="pdf-desc">
          Extract all pages from a PDF document into high-quality JPEG images securely in your browser.
        </p>
      </div>

      <div className="pdf-workspace">
        {!sourceFile && (
          <div
            className={`pdf-upload ${isDragging ? 'pdf-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pdf-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pdf-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p className="pdf-upload__text">Drag & drop a PDF document</p>
              <label className="pdf-upload__btn" htmlFor="pdf-upload">Browse files</label>
              <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'processing' || status === 'error') && (
          <div className="pdf-progress-card">
            <h3 className="pdf-progress-title">{progressMsg}</h3>
            {status === 'processing' && (
              <div className="pdf-progress-bar">
                <div className="pdf-progress-fill" style={{ width: `${progressPct}%` }}></div>
              </div>
            )}
            {status === 'error' && (
              <button className="pdf-btn pdf-btn--secondary mt-4" onClick={handleReset}>Try Again</button>
            )}
          </div>
        )}

        {status === 'done' && (
          <div className="pdf-results">
            <div className="pdf-results-header">
              <div>
                <h2 className="pdf-results-title">Extracted {images.length} Pages</h2>
                <p className="pdf-results-subtitle">Select individual pages to download or download them all as a ZIP file.</p>
              </div>
              <div className="pdf-results-actions">
                <button className="pdf-btn pdf-btn--secondary" onClick={handleReset}>Convert Another</button>
                <button className="pdf-btn pdf-btn--primary" onClick={handleDownloadAll}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download All (ZIP)
                </button>
              </div>
            </div>

            <div className="pdf-grid">
              {images.map((img) => (
                <div key={img.pageNum} className="pdf-grid-item">
                  <div className="pdf-grid-img-wrap">
                    <img src={img.url} alt={`Page ${img.pageNum}`} loading="lazy" />
                    <button className="pdf-grid-dl-btn" onClick={() => downloadSingle(img)} title="Download Page">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                  </div>
                  <div className="pdf-grid-label">Page {img.pageNum}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

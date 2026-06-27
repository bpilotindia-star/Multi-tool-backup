import { useState, useRef } from 'react';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import './PdfWordToPdfPage.css';

export default function PdfWordToPdfPage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');

  const [status, setStatus] = useState('idle'); // idle | converting | done | error
  const [progressMsg, setProgressMsg] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const printAreaRef = useRef(null);

  const processWordDoc = async (file) => {
    if (!file.name.endsWith('.docx')) {
      alert('Please upload a valid .docx file.');
      return;
    }

    setStatus('converting');
    setProgressMsg('Extracting content from Word document...');

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Convert .docx to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
      const html = result.value;

      setSourceFile(file);
      setHtmlContent(html);

      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setProgressMsg('Failed to read the Word document. Make sure it is a valid .docx file.');
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
    if (e.dataTransfer.files[0]) processWordDoc(e.dataTransfer.files[0]);
  };
  const handleInputChange = (e) => {
    if (e.target.files[0]) processWordDoc(e.target.files[0]);
    e.target.value = '';
  };

  const clearFile = () => {
    setSourceFile(null);
    setHtmlContent('');
    setStatus('idle');
  };

  const generatePDF = () => {
    if (!htmlContent || !printAreaRef.current) return;

    setStatus('converting');
    setProgressMsg('Rendering and saving as PDF...');

    const element = printAreaRef.current;

    // Set options for html2pdf
    const opt = {
      margin: 10, // 10mm margin
      filename: sourceFile.name.replace('.docx', '.pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf to generate and download the PDF
    html2pdf().set(opt).from(element).save().then(() => {
      setStatus('done');
    }).catch(err => {
      console.error('PDF Generation Error:', err);
      alert('An error occurred while generating the PDF.');
      setStatus('done'); // Even if error, return to done state so they can try again
    });
  };

  return (
    <div className="wp-page">
      <div className="wp-header">
        <h1 className="wp-title">Word to PDF</h1>
        <p className="wp-desc">
          Convert your .docx files to PDF directly in the browser. Fast, free, and 100% private.
        </p>
      </div>

      <div className="wp-workspace">
        {!sourceFile && (
          <div
            className={`wp-upload ${isDragging ? 'wp-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="wp-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="wp-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p className="wp-upload__text">Drag & drop a Word Document (.docx)</p>
              <label className="wp-upload__btn" htmlFor="wp-upload">Select File</label>
              <input type="file" id="wp-upload" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'converting' || status === 'error') && !htmlContent && (
          <div className="wp-progress-card">
            <h3 className="wp-progress-title">{progressMsg}</h3>
            {status === 'converting' && (
              <div className="wp-progress-bar">
                <div className="wp-progress-fill" style={{ width: '100%', animation: 'wp-loading 1.5s infinite linear' }}></div>
              </div>
            )}
            {status === 'error' && (
              <button className="wp-btn wp-btn--secondary mt-4" onClick={clearFile} style={{ marginTop: '1rem' }}>Try Again</button>
            )}
          </div>
        )}

        {sourceFile && htmlContent && (
          <div className="wp-editor">
            <div className="wp-editor-header">
              <div>
                <h2 className="wp-editor-title">{sourceFile.name}</h2>
                <p className="wp-editor-subtitle">Content extracted successfully. Ready to generate PDF.</p>
              </div>
              <div className="wp-editor-actions">
                <button className="wp-btn wp-btn--secondary" onClick={clearFile} disabled={status === 'converting'}>Clear File</button>
                <button className="wp-btn wp-btn--primary" onClick={generatePDF} disabled={status === 'converting'}>
                  {status === 'converting' ? 'Generating PDF...' : 'Download PDF'}
                </button>
              </div>
            </div>

            {status === 'converting' && (
              <div className="wp-progress-card">
                <h3 className="wp-progress-title">{progressMsg}</h3>
                <div className="wp-progress-bar">
                  <div className="wp-progress-fill" style={{ width: '100%', animation: 'wp-loading 1.5s infinite linear' }}></div>
                </div>
              </div>
            )}

            <div className="wp-alert">
              <div className="wp-alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              </div>
              <div className="wp-alert-content">
                <span className="wp-alert-title">Client-Side Limitations</span>
                <span className="wp-alert-desc">Because this tool runs entirely in your browser without uploading your file, it extracts text and images but cannot perfectly preserve complex layouts, exact pagination, or specific fonts from the original Word document.</span>
              </div>
            </div>

            {/* Hidden container where html2pdf reads from */}
            <div className="wp-hidden-content-container">
              <div
                className="wp-print-area"
                ref={printAreaRef}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

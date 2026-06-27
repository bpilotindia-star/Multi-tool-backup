import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import './PdfExcelToPdfPage.css';

export default function PdfExcelToPdfPage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [sheetsList, setSheetsList] = useState([]); // Array of sheet names
  
  const [status, setStatus] = useState('idle'); // idle | converting | done | error
  const [progressMsg, setProgressMsg] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const printAreaRef = useRef(null);

  const processExcelDoc = async (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv' // csv
    ];

    // Some systems don't have accurate mimetypes for excel files, so we also check extension
    const extension = file.name.split('.').pop().toLowerCase();
    const isValidExt = ['xlsx', 'xls', 'csv'].includes(extension);

    if (!validTypes.includes(file.type) && !isValidExt) {
      alert('Please upload a valid Excel or CSV file (.xlsx, .xls, .csv).');
      return;
    }

    setStatus('converting');
    setProgressMsg('Extracting data from spreadsheet...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the workbook using SheetJS
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      
      if (sheetNames.length === 0) {
        throw new Error('No sheets found in the document.');
      }

      setSheetsList(sheetNames);
      
      // We will render all sheets sequentially into HTML
      let combinedHtml = '';
      
      sheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const htmlTable = XLSX.utils.sheet_to_html(worksheet, { header: '', footer: '' });
        
        // Add a title for the sheet if there are multiple, or just add the table
        if (sheetNames.length > 1) {
          combinedHtml += `<h2>Sheet: ${sheetName}</h2>`;
        }
        
        // The HTML returned by SheetJS has html, body tags etc. 
        // We just need to extract the <table> part if possible, or dump it all since our CSS targets tables.
        // It's usually safe to dump the whole thing, the browser will render the table.
        combinedHtml += htmlTable;
      });
      
      setSourceFile(file);
      setHtmlContent(combinedHtml);
      
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setProgressMsg('Failed to read the spreadsheet. Make sure it is not encrypted.');
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
    if (e.dataTransfer.files[0]) processExcelDoc(e.dataTransfer.files[0]);
  };
  const handleInputChange = (e) => {
    if (e.target.files[0]) processExcelDoc(e.target.files[0]);
    e.target.value = '';
  };

  const clearFile = () => {
    setSourceFile(null);
    setHtmlContent('');
    setSheetsList([]);
    setStatus('idle');
  };

  const generatePDF = () => {
    if (!htmlContent || !printAreaRef.current) return;

    setStatus('converting');
    setProgressMsg('Rendering tables and saving as PDF...');

    const element = printAreaRef.current;
    
    // Set options for html2pdf
    const opt = {
      margin:       10, // 10mm margin
      filename:     sourceFile.name.replace(/\.[^/.]+$/, "") + '.pdf', // Replace any extension with .pdf
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // Landscape is better for tables
    };

    // Use html2pdf to generate and download the PDF
    html2pdf().set(opt).from(element).save().then(() => {
      setStatus('done');
    }).catch(err => {
      console.error('PDF Generation Error:', err);
      alert('An error occurred while generating the PDF.');
      setStatus('done'); 
    });
  };

  return (
    <div className="ep-page">
      <div className="ep-header">
        <h1 className="ep-title">Excel to PDF</h1>
        <p className="ep-desc">
          Convert your .xlsx, .xls, or .csv spreadsheets into PDF directly in the browser. 100% private.
        </p>
      </div>

      <div className="ep-workspace">
        {!sourceFile && (
          <div
            className={`ep-upload ${isDragging ? 'ep-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="ep-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ep-upload__icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
                <line x1="12" y1="9" x2="12" y2="21" />
              </svg>
              <p className="ep-upload__text">Drag & drop an Excel file (.xlsx, .csv)</p>
              <label className="ep-upload__btn" htmlFor="ep-upload">Select File</label>
              <input type="file" id="ep-upload" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'converting' || status === 'error') && !htmlContent && (
          <div className="ep-progress-card">
            <h3 className="ep-progress-title">{progressMsg}</h3>
            {status === 'converting' && (
              <div className="ep-progress-bar">
                <div className="ep-progress-fill" style={{ width: '100%', animation: 'ep-loading 1.5s infinite linear' }}></div>
              </div>
            )}
            {status === 'error' && (
              <button className="ep-btn ep-btn--secondary mt-4" onClick={clearFile} style={{ marginTop: '1rem' }}>Try Again</button>
            )}
          </div>
        )}

        {sourceFile && htmlContent && (
          <div className="ep-editor">
            <div className="ep-editor-header">
              <div>
                <h2 className="ep-editor-title">{sourceFile.name}</h2>
                <p className="ep-editor-subtitle">Found {sheetsList.length} sheet(s). Data extracted successfully.</p>
              </div>
              <div className="ep-editor-actions">
                <button className="ep-btn ep-btn--secondary" onClick={clearFile} disabled={status === 'converting'}>Clear File</button>
                <button className="ep-btn ep-btn--primary" onClick={generatePDF} disabled={status === 'converting'}>
                  {status === 'converting' ? 'Generating PDF...' : 'Download PDF'}
                </button>
              </div>
            </div>

            {status === 'converting' && (
              <div className="ep-progress-card">
                <h3 className="ep-progress-title">{progressMsg}</h3>
                <div className="ep-progress-bar">
                  <div className="ep-progress-fill" style={{ width: '100%', animation: 'ep-loading 1.5s infinite linear' }}></div>
                </div>
              </div>
            )}

            <div className="ep-alert">
              <div className="ep-alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div className="ep-alert-content">
                <span className="ep-alert-title">Client-Side Limitations</span>
                <span className="ep-alert-desc">Because this runs entirely in your browser without uploading your file, the generated PDF contains the raw data in a standardized table format. Advanced styling like colors, charts, or merged cells from the original Excel file are not preserved.</span>
              </div>
            </div>

            {/* Hidden container where html2pdf reads from */}
            <div className="ep-hidden-content-container">
              <div 
                className="ep-print-area" 
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

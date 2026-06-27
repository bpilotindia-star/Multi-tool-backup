import { useState, useRef } from 'react';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { saveAs } from 'file-saver';
import './PdfProtectPage.css';

export default function PdfProtectPage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [fileBuffer, setFileBuffer] = useState(null);
  const [password, setPassword] = useState('');
  
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progressMsg, setProgressMsg] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

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

  const clearFile = () => {
    setSourceFile(null);
    setFileBuffer(null);
    setPassword('');
    setStatus('idle');
  };

  const handleProtect = async () => {
    if (!fileBuffer || !sourceFile) return;
    
    if (!password.trim()) {
      alert('Please enter a password to protect the PDF.');
      return;
    }

    setStatus('processing');
    setProgressMsg('Encrypting PDF securely...');

    try {
      // Re-read buffer from file to avoid ArrayBuffer detachment issues
      const freshBuffer = await sourceFile.arrayBuffer();
      const pdfBytes = new Uint8Array(freshBuffer);

      // Encrypt the PDF bytes using @pdfsmaller/pdf-encrypt
      // By default it uses AES-256 for strong protection
      const encryptedPdfBytes = await encryptPDF(pdfBytes, password);

      setProgressMsg('Saving protected PDF...');
      
      const blob = new Blob([encryptedPdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${sourceFile.name.replace('.pdf', '')}_protected.pdf`);
      
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
      setPassword('');
    } catch (error) {
      console.error(error);
      alert('An error occurred while encrypting the PDF.');
      setStatus('idle');
    }
  };

  return (
    <div className="prot-page">
      <div className="prot-header">
        <h1 className="prot-title">Protect PDF</h1>
        <p className="prot-desc">
          Add a secure password to your PDF document. Encrypted entirely in your browser using AES-256, so your file stays 100% private.
        </p>
      </div>

      <div className="prot-workspace">
        {!sourceFile && (
          <div
            className={`prot-upload ${isDragging ? 'prot-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="prot-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="prot-upload__icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <p className="prot-upload__text">Drag & drop a PDF file to secure</p>
              <label className="prot-upload__btn" htmlFor="prot-upload">Select PDF</label>
              <input type="file" id="prot-upload" accept="application/pdf" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'processing' || status === 'done' || status === 'error') && !sourceFile && (
           <div className="prot-progress-card">
              <h3 className="prot-progress-title">{progressMsg}</h3>
           </div>
        )}

        {sourceFile && (
          <div className="prot-editor">
            <div className="prot-editor-header">
              <div>
                <h2 className="prot-editor-title">{sourceFile.name}</h2>
                <p className="prot-editor-subtitle">Ready to be encrypted.</p>
              </div>
              <div className="prot-editor-actions">
                <button className="prot-btn prot-btn--secondary" onClick={clearFile} disabled={status === 'processing'}>Clear File</button>
                <button className="prot-btn prot-btn--primary" onClick={handleProtect} disabled={status === 'processing'}>
                  {status === 'processing' ? 'Encrypting...' : 'Protect PDF'}
                </button>
              </div>
            </div>

            {status === 'processing' && (
              <div className="prot-progress-card">
                <h3 className="prot-progress-title">{progressMsg}</h3>
                <div className="prot-progress-bar">
                  <div className="prot-progress-fill" style={{ width: '100%', animation: 'prot-loading 1.5s infinite linear' }}></div>
                </div>
              </div>
            )}

            <div className="prot-settings">
              <h3 className="prot-settings-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Set Document Password
              </h3>
              
              <div className="prot-control-group">
                <label className="prot-label">User Password</label>
                <input 
                  type="password" 
                  className="prot-input" 
                  placeholder="Enter a secure password..."
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Anyone opening this PDF will be required to enter this password.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

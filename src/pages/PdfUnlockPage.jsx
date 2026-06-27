import { useState, useRef } from 'react';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import { saveAs } from 'file-saver';
import './PdfUnlockPage.css';

export default function PdfUnlockPage() {
  const [sourceFile, setSourceFile] = useState(null);
  const [fileBuffer, setFileBuffer] = useState(null);
  const [password, setPassword] = useState('');
  
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
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
      setErrorMessage('');
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
    setErrorMessage('');
    setStatus('idle');
  };

  const handleUnlock = async () => {
    if (!fileBuffer || !sourceFile) return;
    
    if (!password.trim()) {
      setErrorMessage('Please enter the current password to unlock.');
      return;
    }

    setErrorMessage('');
    setStatus('processing');
    setProgressMsg('Decrypting PDF...');

    try {
      const freshBuffer = await sourceFile.arrayBuffer();
      
      // Decrypt the document using the specialized library
      // It handles AES-256 and RC4 encryption natively
      const pdfBytes = new Uint8Array(freshBuffer);
      const decryptedBytes = await decryptPDF(pdfBytes, password);

      setProgressMsg('Saving unlocked PDF...');
      
      const blob = new Blob([decryptedBytes], { type: 'application/pdf' });
      saveAs(blob, `${sourceFile.name.replace('.pdf', '')}_unlocked.pdf`);
      
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
      setPassword('');
    } catch (error) {
      console.error(error);
      setStatus('idle');
      
      const errMsg = error.message ? error.message.toLowerCase() : '';
      if (errMsg.includes('password') || errMsg.includes('incorrect') || errMsg.includes('invalid')) {
        setErrorMessage('Incorrect password. Please try again.');
      } else {
        setErrorMessage('Failed to decrypt. Ensure this is a valid protected PDF.');
      }
    }
  };

  return (
    <div className="unlock-page">
      <div className="unlock-header">
        <h1 className="unlock-title">Unlock PDF</h1>
        <p className="unlock-desc">
          Remove password protection from your PDF files permanently. Processed securely in your browser.
        </p>
      </div>

      <div className="unlock-workspace">
        {!sourceFile && (
          <div
            className={`unlock-upload ${isDragging ? 'unlock-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="unlock-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="unlock-upload__icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
              </svg>
              <p className="unlock-upload__text">Drag & drop a protected PDF</p>
              <label className="unlock-upload__btn" htmlFor="unlock-upload">Select PDF</label>
              <input type="file" id="unlock-upload" accept="application/pdf" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {(status === 'processing' || status === 'done' || status === 'error') && !sourceFile && (
           <div className="unlock-progress-card">
              <h3 className="unlock-progress-title">{progressMsg}</h3>
           </div>
        )}

        {sourceFile && (
          <div className="unlock-editor">
            <div className="unlock-editor-header">
              <div>
                <h2 className="unlock-editor-title">{sourceFile.name}</h2>
                <p className="unlock-editor-subtitle">Ready to be unlocked.</p>
              </div>
              <div className="unlock-editor-actions">
                <button className="unlock-btn unlock-btn--secondary" onClick={clearFile} disabled={status === 'processing'}>Clear File</button>
                <button className="unlock-btn unlock-btn--primary" onClick={handleUnlock} disabled={status === 'processing'}>
                  {status === 'processing' ? 'Decrypting...' : 'Unlock PDF'}
                </button>
              </div>
            </div>

            {status === 'processing' && (
              <div className="unlock-progress-card">
                <h3 className="unlock-progress-title">{progressMsg}</h3>
                <div className="unlock-progress-bar">
                  <div className="unlock-progress-fill" style={{ width: '100%', animation: 'unlock-loading 1.5s infinite linear' }}></div>
                </div>
              </div>
            )}

            <div className="unlock-settings">
              <h3 className="unlock-settings-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
                Enter Current Password
              </h3>
              
              <div className="unlock-control-group">
                <label className="unlock-label">Document Password</label>
                <input 
                  type="password" 
                  className="unlock-input" 
                  placeholder="Enter the password..."
                  value={password} 
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrorMessage(''); // Clear error on type
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                />
                {errorMessage && (
                  <p className="unlock-error-msg">{errorMessage}</p>
                )}
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: '8px' }}>
                  You must know the current password to permanently remove it.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback, useState, useRef } from 'react';
import './VideoUploader.css';

export default function VideoUploader({ onVideoSelect, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.type.startsWith('video/')) {
      onVideoSelect(file);
    } else {
      alert('Please upload a valid video file.');
    }
  }, [onVideoSelect]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (!disabled) setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      className={`upload ${isDragging ? 'upload--drag' : ''} ${disabled ? 'upload--off' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      id="video-uploader"
    >
      <div className="upload__inner">
        <div className="upload__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="upload__text">
          {isDragging ? 'Drop to upload' : 'Drag a video here'}
        </p>
        <p className="upload__sub">or</p>
        <label className="upload__btn" htmlFor="video-file-input">Browse files</label>
        <input
          type="file"
          id="video-file-input"
          accept="video/*"
          onChange={handleInputChange}
          disabled={disabled}
          hidden
        />
        <p className="upload__formats">MP4 · WebM · MOV · AVI · MKV</p>
      </div>
    </div>
  );
}

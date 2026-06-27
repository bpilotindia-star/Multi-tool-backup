import { useState, useRef, useCallback, useEffect } from 'react';
import useSEO from '../hooks/useSEO';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { HexColorPicker } from 'react-colorful';
import './VideoWatermarkPage.css';

export default function VideoWatermarkPage() {
  useSEO({
    title: 'Free Video Watermark Tool | Add Text or Image to Video',
    description: 'Protect your videos by adding text or image watermarks. Real-time preview and drag-and-drop placement. 100% private processing.',
    keywords: 'add watermark to video, video watermark software, text watermark video, image watermark video, brand video online, free video watermark',
    url: 'https://multi-tool-platform.online/video-watermark'
  });

  const [sourceFile, setSourceFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  
  const [wmType, setWmType] = useState('text'); // 'text' | 'image'
  const [wmText, setWmText] = useState('Multi-Tools');
  const [wmFontSize, setWmFontSize] = useState(24);
  const [wmFontFamily, setWmFontFamily] = useState('sans-serif');
  const [wmColor, setWmColor] = useState('#ffffff');
  const [wmOpacity, setWmOpacity] = useState(0.8);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  const [wmImageFile, setWmImageFile] = useState(null);
  const [wmImageUrl, setWmImageUrl] = useState('');
  const [wmImageSize, setWmImageSize] = useState(150);
  
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDraggingWM, setIsDraggingWM] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartElementPos = useRef({ x: 0, y: 0 });

  const [status, setStatus] = useState('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const dragCounter = useRef(0);
  const videoRef = useRef(null);
  const ffmpegRef = useRef(null);
  const wmImgRef = useRef(null);

  // --- Drag & Drop Video ---
  const loadVideo = (file) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const ext = file.name.split('.').pop().toLowerCase();
    const validExts = ['mp4', 'webm', 'mov', 'mkv'];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      alert('Please upload a valid video file (MP4, WebM, MOV, MKV).');
      return;
    }

    const url = URL.createObjectURL(file);
    setSourceFile(file);
    setVideoUrl(url);
    setStatus('idle');
    setPosition({ x: 20, y: 20 });
  };

  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); dragCounter.current = 0; setIsDragging(false); if (e.dataTransfer.files[0]) loadVideo(e.dataTransfer.files[0]); };
  const handleInputChange = (e) => { if (e.target.files[0]) loadVideo(e.target.files[0]); e.target.value = ''; };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setWmImageFile(file);
      setWmImageUrl(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const clearFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setSourceFile(null);
    setVideoUrl('');
    setStatus('idle');
  };

  // --- Watermark Drag Logic ---
  const onPointerDown = (e) => {
    e.preventDefault();
    setIsDraggingWM(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartElementPos.current = { ...position };
  };

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!isDraggingWM) return;
      
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      setPosition({
        x: dragStartElementPos.current.x + dx,
        y: dragStartElementPos.current.y + dy
      });
    };

    const onPointerUp = () => {
      setIsDraggingWM(false);
    };

    if (isDraggingWM) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDraggingWM]);

  // --- Canvas Watermark Generation ---
  const generateWatermarkBlob = async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return null;

    // Calculate ratio between native video size and displayed UI size
    const scaleX = videoEl.videoWidth / videoEl.clientWidth;
    const scaleY = videoEl.videoHeight / videoEl.clientHeight;
    
    // Use average scale for font sizing to keep it proportional
    const scale = (scaleX + scaleY) / 2;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (wmType === 'text') {
      const nativeFontSize = wmFontSize * scale;
      ctx.font = `bold ${nativeFontSize}px "${wmFontFamily}"`;
      const metrics = ctx.measureText(wmText);
      
      // Add small padding
      canvas.width = metrics.width + (10 * scale);
      canvas.height = nativeFontSize + (15 * scale);
      
      ctx.globalAlpha = wmOpacity;
      ctx.font = `bold ${nativeFontSize}px "${wmFontFamily}"`;
      ctx.fillStyle = wmColor;
      ctx.textBaseline = 'top';
      ctx.fillText(wmText, 5 * scale, 5 * scale);
    } else {
      if (!wmImgRef.current) return null;
      const imgEl = wmImgRef.current;
      
      const nativeWidth = imgEl.clientWidth * scaleX;
      const nativeHeight = imgEl.clientHeight * scaleY;
      canvas.width = nativeWidth;
      canvas.height = nativeHeight;
      
      ctx.globalAlpha = wmOpacity;
      ctx.drawImage(imgEl, 0, 0, nativeWidth, nativeHeight);
    }
    
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  };

  // --- FFmpeg Processing ---
  const handleApply = useCallback(async () => {
    if (!sourceFile || !videoRef.current) return;
    if (wmType === 'text' && !wmText.trim()) {
      alert('Please enter some text for the watermark.'); return;
    }
    if (wmType === 'image' && !wmImageUrl) {
      alert('Please upload an image for the watermark.'); return;
    }

    setStatus('processing');
    setProgressMsg('Initializing processing engine...');

    try {
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }) => {
          if (progress > 0) setProgressMsg(`Rendering frames: ${Math.round(progress * 100)}%`);
        });
        await ffmpeg.load();
        ffmpegRef.current = ffmpeg;
      }
      const ffmpeg = ffmpegRef.current;

      setProgressMsg('Generating watermark graphics...');
      const wmBlob = await generateWatermarkBlob();
      if (!wmBlob) throw new Error("Failed to generate watermark");

      const ext = sourceFile.name.split('.').pop().toLowerCase();
      const inputName = `input.${ext}`;
      const wmName = `watermark.png`;
      const outputName = `output.mp4`;

      setProgressMsg('Writing files to memory...');
      await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));
      await ffmpeg.writeFile(wmName, await fetchFile(wmBlob));

      // Calculate absolute position for FFmpeg
      const videoEl = videoRef.current;
      const scaleX = videoEl.videoWidth / videoEl.clientWidth;
      const scaleY = videoEl.videoHeight / videoEl.clientHeight;
      const nativeX = Math.round(position.x * scaleX);
      const nativeY = Math.round(position.y * scaleY);

      setProgressMsg('Applying overlay (this may take a while)...');
      
      await ffmpeg.exec([
        '-i', inputName,
        '-i', wmName,
        '-filter_complex', `[0:v][1:v]overlay=x=${nativeX}:y=${nativeY}`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'copy',
        outputName
      ]);

      setProgressMsg('Exporting video...');
      const data = await ffmpeg.readFile(outputName);
      
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceFile.name.replace(/\.[^.]+$/, '')}_watermarked.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(wmName);
      await ffmpeg.deleteFile(outputName);

      setStatus('done');
      setProgressMsg('Video downloaded successfully!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setProgressMsg('An error occurred during rendering.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [sourceFile, wmType, wmText, wmFontFamily, wmImageUrl, wmImageSize, wmFontSize, wmColor, wmOpacity, position]);

  return (
    <div className="vw-page">
      <div className="vw-header">
        <h1 className="vw-title">Video Watermark</h1>
        <p className="vw-desc">
          Add custom text or image watermarks to your videos. Drag to position. Processed 100% locally.
        </p>
      </div>

      <div className="vw-workspace">
        {!sourceFile && (
          <div
            className={`vw-upload ${isDragging ? 'vw-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="vw-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="vw-upload__icon">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="2" y1="7" x2="7" y2="7"></line>
                <line x1="2" y1="17" x2="7" y2="17"></line>
                <line x1="17" y1="17" x2="22" y2="17"></line>
                <line x1="17" y1="7" x2="22" y2="7"></line>
              </svg>
              <p className="vw-upload__text">Drag & drop a video file</p>
              <label className="vw-upload__btn" htmlFor="vw-upload">Select Video</label>
              <input type="file" id="vw-upload" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {sourceFile && (
          <div className="vw-editor">
            <div className="vw-editor-header">
              <h2 className="vw-editor-title">{sourceFile.name}</h2>
              <div className="vw-editor-actions">
                <button className="vw-btn vw-btn--secondary" onClick={clearFile} disabled={status === 'processing'}>Clear</button>
                <button className="vw-btn vw-btn--primary" onClick={handleApply} disabled={status === 'processing'}>
                  {status === 'processing' ? 'Processing...' : 'Apply Watermark'}
                </button>
              </div>
            </div>

            {status === 'processing' && (
              <div className="vw-progress-card">
                <h3 className="vw-progress-title">{progressMsg}</h3>
                <div className="vw-progress-bar">
                  <div className="vw-progress-fill" style={{ width: '100%', animation: 'vw-loading 1.5s infinite linear' }}></div>
                </div>
              </div>
            )}

            <div className="vw-editor-layout">
              {/* Settings Panel */}
              <div className="vw-settings">
                <h3 className="vw-settings-title">Watermark Settings</h3>
                
                <div className="vw-toggle">
                  <button className={`vw-toggle-btn ${wmType === 'text' ? 'active' : ''}`} onClick={() => setWmType('text')}>Text</button>
                  <button className={`vw-toggle-btn ${wmType === 'image' ? 'active' : ''}`} onClick={() => setWmType('image')}>Image</button>
                </div>

                {wmType === 'text' && (
                  <>
                    <div className="vw-control-group">
                      <label className="vw-label">Text Content</label>
                      <input type="text" className="vw-input" value={wmText} onChange={e => setWmText(e.target.value)} />
                    </div>
                    <div className="vw-control-group">
                      <label className="vw-label">Font Style</label>
                      <select className="vw-input" value={wmFontFamily} onChange={e => setWmFontFamily(e.target.value)}>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Impact">Impact</option>
                        <option value="Comic Sans MS">Comic Sans MS</option>
                      </select>
                    </div>
                    <div className="vw-control-group">
                      <label className="vw-label">Font Size ({wmFontSize}px)</label>
                      <input type="range" min="12" max="120" value={wmFontSize} onChange={e => setWmFontSize(parseInt(e.target.value))} />
                    </div>
                    <div className="vw-control-group">
                      <label className="vw-label">Text Color</label>
                      <div className="vw-color-picker-wrapper">
                        <div 
                          className="vw-color-swatch"
                          style={{ backgroundColor: wmColor }}
                          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                        />
                        <input 
                          type="text" 
                          className="vw-color-hex-input" 
                          value={wmColor.toUpperCase()}
                          onChange={(e) => setWmColor(e.target.value)}
                        />
                        {isColorPickerOpen && (
                          <div className="vw-color-popover">
                            <div className="vw-color-cover" onClick={() => setIsColorPickerOpen(false)} />
                            <HexColorPicker color={wmColor} onChange={setWmColor} />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {wmType === 'image' && (
                  <>
                    <div className="vw-control-group">
                      <label className="vw-label">Upload Image</label>
                      <div className="vw-file-input-wrapper">
                        <label className="vw-file-btn" htmlFor="wm-img-upload">
                          {wmImageFile ? wmImageFile.name : 'Choose Image (PNG/JPG)'}
                        </label>
                        <input type="file" id="wm-img-upload" accept="image/png,image/jpeg" onChange={handleImageChange} hidden />
                      </div>
                    </div>
                    {wmImageFile && (
                      <div className="vw-control-group">
                        <label className="vw-label">Image Size</label>
                        <input type="range" min="30" max="800" value={wmImageSize} onChange={e => setWmImageSize(parseInt(e.target.value))} />
                      </div>
                    )}
                  </>
                )}

                <div className="vw-control-group" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="vw-label">Opacity ({Math.round(wmOpacity * 100)}%)</label>
                  <input type="range" min="0.1" max="1" step="0.05" value={wmOpacity} onChange={e => setWmOpacity(parseFloat(e.target.value))} />
                </div>
                
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                  Tip: Drag the watermark directly on the video to position it.
                </p>
              </div>

              {/* Preview Panel */}
              <div className="vw-preview">
                <div className="vw-preview-wrapper">
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    className="vw-video"
                    loop
                    muted
                    autoPlay
                    playsInline
                  />
                  
                  {/* Draggable Overlay */}
                  <div className="vw-overlay">
                    <div 
                      className="vw-watermark"
                      onPointerDown={onPointerDown}
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        opacity: wmOpacity
                      }}
                    >
                      {wmType === 'text' ? (
                        <span style={{
                          fontSize: `${wmFontSize}px`,
                          color: wmColor,
                          fontWeight: 'bold',
                          fontFamily: `"${wmFontFamily}"`,
                          padding: '5px',
                          display: 'block'
                        }}>
                          {wmText}
                        </span>
                      ) : (
                        wmImageUrl ? (
                          <img 
                            ref={wmImgRef} 
                            src={wmImageUrl} 
                            alt="Watermark" 
                            className="vw-watermark-img" 
                            style={{ width: `${wmImageSize}px`, height: 'auto', display: 'block', maxWidth: 'none' }}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-muted)', padding: '5px' }}>No image selected</span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

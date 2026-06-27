import { useState, useRef, useCallback, useEffect } from 'react';
import useSEO from '../hooks/useSEO';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import './VideoClipCutterPage.css';

// Helper: seconds to HH:MM:SS.ms format
const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds % 1) * 100);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
};

// Helper: HH:MM:SS.ms string to seconds
const parseTime = (str) => {
  const parts = str.split(':');
  if (parts.length !== 3) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const sParts = parts[2].split('.');
  const s = parseInt(sParts[0], 10) || 0;
  const ms = parseInt(sParts[1] || '0', 10) || 0;
  return h * 3600 + m * 60 + s + ms / 100;
};

export default function VideoClipCutterPage() {
  useSEO({
    title: 'Free Video Clip Cutter | Trim & Cut Videos Online',
    description: 'Easily cut, trim, and extract clips from your videos directly in your browser. Powered by FFmpeg WebAssembly for 100% private processing.',
    keywords: 'video clip cutter, video trimmer, cut video online, trim video free, extract video clip, client side video cutter, ffmpeg wasm',
    url: 'https://multi-tool-platform.online/video-cutter'
  });

  const [sourceFile, setSourceFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  
  const [status, setStatus] = useState('idle'); // idle | loading | processing | done | error
  const [progressMsg, setProgressMsg] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const videoRef = useRef(null);
  const ffmpegRef = useRef(null);

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
    setStartTime(0);
    setEndTime(0);
    setStatus('idle');
  };

  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(dur);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); dragCounter.current = 0; setIsDragging(false); if (e.dataTransfer.files[0]) loadVideo(e.dataTransfer.files[0]); };
  const handleInputChange = (e) => { if (e.target.files[0]) loadVideo(e.target.files[0]); e.target.value = ''; };

  const setStartFromPlayer = () => {
    if (videoRef.current) setStartTime(videoRef.current.currentTime);
  };
  const setEndFromPlayer = () => {
    if (videoRef.current) setEndTime(videoRef.current.currentTime);
  };

  const clearFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setSourceFile(null);
    setVideoUrl('');
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setStatus('idle');
  };

  const handleCut = useCallback(async () => {
    if (!sourceFile) return;
    if (startTime >= endTime) {
      alert('Start time must be before end time.');
      return;
    }

    setStatus('loading');
    setProgressMsg('Loading video engine (this may take a moment)...');

    try {
      // Initialize FFmpeg if not already loaded
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('log', ({ message }) => {
          console.log('[ffmpeg]', message);
        });
        ffmpeg.on('progress', ({ progress }) => {
          if (progress > 0) {
            setProgressMsg(`Processing: ${Math.round(progress * 100)}%`);
          }
        });
        await ffmpeg.load();
        ffmpegRef.current = ffmpeg;
      }

      const ffmpeg = ffmpegRef.current;
      setStatus('processing');
      setProgressMsg('Writing video to memory...');

      // Determine file extension
      const ext = sourceFile.name.split('.').pop().toLowerCase();
      const inputName = `input.${ext}`;
      const outputName = `output.mp4`;

      // Write the source file to FFmpeg's virtual FS
      await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));

      setProgressMsg('Cutting clip...');

      // Execute the trim command
      // -ss before -i = fast input seeking
      // Re-encode to avoid black frames caused by keyframe misalignment with -c copy
      await ffmpeg.exec([
        '-ss', formatTime(startTime),
        '-i', inputName,
        '-t', formatTime(endTime - startTime),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        outputName
      ]);

      setProgressMsg('Reading output...');

      // Read the output file
      const data = await ffmpeg.readFile(outputName);
      
      // Create download
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceFile.name.replace(/\.[^.]+$/, '')}_clip.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Cleanup virtual FS
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      setStatus('done');
      setProgressMsg('Clip downloaded!');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setProgressMsg('An error occurred while cutting the video.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [sourceFile, startTime, endTime]);

  const clipDuration = Math.max(0, endTime - startTime);

  return (
    <div className="vc-page">
      <div className="vc-header">
        <h1 className="vc-title">Video Clip Cutter</h1>
        <p className="vc-desc">
          Upload a video, select a time range, and download the trimmed clip. Processed 100% locally using FFmpeg WebAssembly.
        </p>
      </div>

      <div className="vc-workspace">
        {!sourceFile && (
          <div
            className={`vc-upload ${isDragging ? 'vc-upload--drag' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="vc-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="vc-upload__icon">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <p className="vc-upload__text">Drag & drop a video file</p>
              <p className="vc-upload__sub">Supports MP4, WebM, MOV, MKV</p>
              <label className="vc-upload__btn" htmlFor="vc-upload">Select Video</label>
              <input type="file" id="vc-upload" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" onChange={handleInputChange} hidden />
            </div>
          </div>
        )}

        {sourceFile && (
          <div className="vc-editor">
            <div className="vc-editor-header">
              <div>
                <h2 className="vc-editor-title">{sourceFile.name}</h2>
                <p className="vc-editor-subtitle">Duration: {formatTime(duration)}</p>
              </div>
              <div className="vc-editor-actions">
                <button className="vc-btn vc-btn--secondary" onClick={clearFile} disabled={status === 'processing' || status === 'loading'}>Clear</button>
                <button className="vc-btn vc-btn--primary" onClick={handleCut} disabled={status === 'processing' || status === 'loading'}>
                  {status === 'loading' || status === 'processing' ? 'Processing...' : 'Cut Clip'}
                </button>
              </div>
            </div>

            {(status === 'loading' || status === 'processing') && (
              <div className="vc-progress-card">
                <h3 className="vc-progress-title">{progressMsg}</h3>
                <p className="vc-progress-subtitle">Please wait, this may take a moment for large files.</p>
                <div className="vc-progress-bar">
                  <div className="vc-progress-fill" style={{ width: '100%', animation: 'vc-loading 1.5s infinite linear' }}></div>
                </div>
              </div>
            )}

            <div className="vc-player-card">
              <video
                ref={videoRef}
                src={videoUrl}
                className="vc-video"
                controls
                onLoadedMetadata={handleMetadataLoaded}
              />

              {/* Timeline */}
              {duration > 0 && (
                <div className="vc-timeline">
                  <div className="vc-timeline-label">
                    <span>Start: {formatTime(startTime)}</span>
                    <span>End: {formatTime(endTime)}</span>
                  </div>
                  <div className="vc-range-track">
                    <div
                      className="vc-range-fill"
                      style={{
                        left: `${(startTime / duration) * 100}%`,
                        width: `${((endTime - startTime) / duration) * 100}%`
                      }}
                    />
                    <input
                      type="range"
                      className="vc-range-input"
                      min="0"
                      max={duration}
                      step="0.01"
                      value={startTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val < endTime) setStartTime(val);
                      }}
                    />
                    <input
                      type="range"
                      className="vc-range-input"
                      min="0"
                      max={duration}
                      step="0.01"
                      value={endTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > startTime) setEndTime(val);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Timestamp Controls */}
              <div className="vc-timestamp-controls">
                <div className="vc-timestamp-group">
                  <label className="vc-timestamp-label">Start Time</label>
                  <div className="vc-timestamp-row">
                    <input
                      type="text"
                      className="vc-timestamp-input"
                      value={formatTime(startTime)}
                      onChange={(e) => {
                        const parsed = parseTime(e.target.value);
                        if (!isNaN(parsed) && parsed < endTime) setStartTime(parsed);
                      }}
                    />
                    <button className="vc-set-btn" onClick={setStartFromPlayer}>Set from player</button>
                  </div>
                </div>

                <div className="vc-timestamp-group">
                  <label className="vc-timestamp-label">End Time</label>
                  <div className="vc-timestamp-row">
                    <input
                      type="text"
                      className="vc-timestamp-input"
                      value={formatTime(endTime)}
                      onChange={(e) => {
                        const parsed = parseTime(e.target.value);
                        if (!isNaN(parsed) && parsed > startTime) setEndTime(parsed);
                      }}
                    />
                    <button className="vc-set-btn" onClick={setEndFromPlayer}>Set from player</button>
                  </div>
                </div>
              </div>

              {/* Clip info */}
              <div className="vc-clip-info">
                Clip Duration: <strong>{formatTime(clipDuration)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero__title">Our Tools</h1>
        <p className="hero__desc">
          A collection of 100% free, client-side tools that run entirely in your browser. No data is uploaded, no servers are involved. Fast, secure, and minimal.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="tools-grid">
        <Link to="/video-to-frames" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Video to Frames</h3>
            <p className="tool-card__desc">Extract high-quality PNG images from any video instantly. Free video to frame converter online.</p>
          </div>
        </Link>

        <Link to="/bg-remover" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Image Background Remover</h3>
            <p className="tool-card__desc">Remove backgrounds from images instantly using local AI. 100% private and free.</p>
          </div>
        </Link>

        <Link to="/image-compressor" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 17 4 4 4-4" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Image Compressor</h3>
            <p className="tool-card__desc">Compress images to an exact target file size (KB) instantly without uploading to any server.</p>
          </div>
        </Link>

        <Link to="/image-converter" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Format Converter</h3>
            <p className="tool-card__desc">Instantly convert images between PNG, JPG, and WEBP formats directly in your browser.</p>
          </div>
        </Link>

        <Link to="/image-resizer" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Image Cropper</h3>
            <p className="tool-card__desc">Easily crop and resize images to standard aspect ratios (1:1, 16:9, etc.) locally.</p>
          </div>
        </Link>

        <Link to="/image-blur" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a10 10 0 0 1 10 10" opacity="0.3"/>
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Blur Tool</h3>
            <p className="tool-card__desc">Censor or obscure parts of your image with shapes and freehand pens.</p>
          </div>
        </Link>

        <Link to="/pdf-to-image" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">PDF to Image</h3>
            <p className="tool-card__desc">Extract every page from a PDF document into high-quality downloadable images.</p>
          </div>
        </Link>

        <Link to="/image-to-pdf" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <circle cx="10" cy="13" r="2" />
              <path d="M6 17l4-4 4 4" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Image to PDF</h3>
            <p className="tool-card__desc">Combine multiple images into a single, beautifully formatted PDF document.</p>
          </div>
        </Link>

        <Link to="/image-upscaler" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <line x1="9" y1="21" x2="21" y2="9" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Image Upscaler</h3>
            <p className="tool-card__desc">Increase the dimensions and file size of your images without losing quality.</p>
          </div>
        </Link>

        <Link to="/pdf-compressor" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">PDF Compressor</h3>
            <p className="tool-card__desc">Drastically reduce the file size of your PDF documents locally.</p>
          </div>
        </Link>

        <Link to="/pdf-merge" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Merge PDF</h3>
            <p className="tool-card__desc">Combine multiple PDF files into a single document quickly and securely.</p>
          </div>
        </Link>

        <Link to="/pdf-split" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M10 18v-4a2 2 0 0 1 4 0v4" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Split PDF</h3>
            <p className="tool-card__desc">Extract pages from your PDF or save each page as a separate PDF file.</p>
          </div>
        </Link>

        <Link to="/word-to-pdf" className="tool-card">
          <div className="tool-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
              <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="tool-card__content">
            <h3 className="tool-card__title">Word to PDF</h3>
            <p className="tool-card__desc">Convert your .docx documents to PDF format natively in your browser.</p>
          </div>
        </Link>
      </section>
    </div>
  );
}

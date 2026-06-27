import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VideoToFramesPage from './pages/VideoToFramesPage';
import BgRemoverPage from './pages/BgRemoverPage';
import ImageCompressorPage from './pages/ImageCompressorPage';
import ImageConverterPage from './pages/ImageConverterPage';
import ImageResizerPage from './pages/ImageResizerPage';
import ImageBlurPage from './pages/ImageBlurPage';
import PdfToImagePage from './pages/PdfToImagePage';
import ImageToPdfPage from './pages/ImageToPdfPage';
import ImageUpscalerPage from './pages/ImageUpscalerPage';
import PdfCompressorPage from './pages/PdfCompressorPage';
import PdfMergePage from './pages/PdfMergePage';
import PdfSplitPage from './pages/PdfSplitPage';
import PdfWordToPdfPage from './pages/PdfWordToPdfPage';
import PdfExcelToPdfPage from './pages/PdfExcelToPdfPage';
import './App.css';

function TopNav() {
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <div className="top-nav">
      <Link to="/" className="back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Tools
      </Link>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      {/* Nav */}
      <nav className="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__left" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="Logo" className="nav__logo" />
            <span className="nav__name">Multi-Tool Platform</span>
          </Link>
          <div className="nav__right">
            <span className="nav__tag">Client-side</span>
          </div>
        </div>
      </nav>

      <main className="main">
        <TopNav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video-to-frames" element={<VideoToFramesPage />} />
          <Route path="/bg-remover" element={<BgRemoverPage />} />
          <Route path="/image-compressor" element={<ImageCompressorPage />} />
          <Route path="/image-converter" element={<ImageConverterPage />} />
          <Route path="/image-resizer" element={<ImageResizerPage />} />
          <Route path="/image-blur" element={<ImageBlurPage />} />
          <Route path="/pdf-to-image" element={<PdfToImagePage />} />
          <Route path="/image-to-pdf" element={<ImageToPdfPage />} />
          <Route path="/image-upscaler" element={<ImageUpscalerPage />} />
          <Route path="/pdf-compressor" element={<PdfCompressorPage />} />
          <Route path="/pdf-merge" element={<PdfMergePage />} />
          <Route path="/pdf-split" element={<PdfSplitPage />} />
          <Route path="/word-to-pdf" element={<PdfWordToPdfPage />} />
          <Route path="/excel-to-pdf" element={<PdfExcelToPdfPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>All processing happens in your browser. No data leaves your device.</p>
      </footer>
    </div>
  );
}

export default App;

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const TOOLS = [
  // --- Image Tools ---
  {
    path: '/bg-remover',
    title: 'Image Background Remover',
    desc: 'Remove backgrounds from images instantly using local AI. 100% private and free.',
    category: 'image',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    path: '/image-compressor',
    title: 'Image Compressor',
    desc: 'Compress images to an exact target file size (KB) instantly without uploading to any server.',
    category: 'image',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M12 12v9" />
        <path d="m8 17 4 4 4-4" />
      </svg>
    ),
  },
  {
    path: '/image-converter',
    title: 'Format Converter',
    desc: 'Instantly convert images between PNG, JPG, and WEBP formats directly in your browser.',
    category: 'image',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    path: '/image-resizer',
    title: 'Image Cropper',
    desc: 'Easily crop and resize images to standard aspect ratios (1:1, 16:9, etc.) locally.',
    category: 'image',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2v14a2 2 0 0 0 2 2h14" />
        <path d="M18 22V8a2 2 0 0 0-2-2H2" />
      </svg>
    ),
  },
  {
    path: '/image-blur',
    title: 'Blur Tool',
    desc: 'Censor or obscure parts of your image with shapes and freehand pens.',
    category: 'image',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a10 10 0 0 1 10 10" opacity="0.3"/>
      </svg>
    ),
  },
  {
    path: '/image-upscaler',
    title: 'Image Upscaler',
    desc: 'Increase the dimensions and file size of your images without losing quality.',
    category: 'image',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9" />
        <line x1="9" y1="21" x2="21" y2="9" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
      </svg>
    ),
  },

  {
    path: '/photo-grid',
    title: 'Photo Grid Printer',
    desc: 'Generate print-ready A4 sheets with grids of passport/stamp photos and dashed cutting guides.',
    category: 'image',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },

  // --- PDF Tools ---
  {
    path: '/pdf-to-image',
    title: 'PDF to Image',
    desc: 'Extract every page from a PDF document into high-quality downloadable images.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    path: '/image-to-pdf',
    title: 'Image to PDF',
    desc: 'Combine multiple images into a single, beautifully formatted PDF document.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <circle cx="10" cy="13" r="2" />
        <path d="M6 17l4-4 4 4" />
      </svg>
    ),
  },
  {
    path: '/pdf-compressor',
    title: 'PDF Compressor',
    desc: 'Drastically reduce the file size of your PDF documents locally.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M12 18v-6" />
        <polyline points="9 15 12 18 15 15" />
      </svg>
    ),
  },
  {
    path: '/pdf-merge',
    title: 'Merge PDF',
    desc: 'Combine multiple PDF files into a single document quickly and securely.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    path: '/pdf-split',
    title: 'Split PDF',
    desc: 'Extract pages from your PDF or save each page as a separate PDF file.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M10 18v-4a2 2 0 0 1 4 0v4" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    path: '/word-to-pdf',
    title: 'Word to PDF',
    desc: 'Convert your .docx documents to PDF format natively in your browser.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
        <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    path: '/excel-to-pdf',
    title: 'Excel to PDF',
    desc: 'Convert your .xlsx or .csv spreadsheets into PDF directly in your browser.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="12" y1="9" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    path: '/pdf-watermark',
    title: 'Watermark PDF',
    desc: 'Add custom text or image watermarks to all pages of your PDF instantly.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    path: '/pdf-protect',
    title: 'Protect PDF',
    desc: 'Lock your PDF file with a secure password using AES-256 encryption.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
  },
  {
    path: '/pdf-unlock',
    title: 'Unlock PDF',
    desc: 'Permanently remove password protection from an encrypted PDF.',
    category: 'pdf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
      </svg>
    ),
  },

  // --- Video Tools ---
  {
    path: '/video-to-frames',
    title: 'Video to Frames',
    desc: 'Extract high-quality PNG images from any video instantly. Free video to frame converter online.',
    category: 'video',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    path: '/video-cutter',
    title: 'Video Clip Cutter',
    desc: 'Trim and cut video clips by selecting start and end timestamps.',
    category: 'video',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
      </svg>
    ),
  },
  {
    path: '/video-watermark',
    title: 'Video Watermark',
    desc: 'Drag and drop text or image watermarks directly onto your videos.',
    category: 'video',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
        <line x1="7" y1="2" x2="7" y2="22"></line>
        <line x1="17" y1="2" x2="17" y2="22"></line>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <line x1="2" y1="7" x2="7" y2="7"></line>
        <line x1="2" y1="17" x2="7" y2="17"></line>
        <line x1="17" y1="17" x2="22" y2="17"></line>
        <line x1="17" y1="7" x2="22" y2="7"></line>
      </svg>
    ),
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Tools' },
  { id: 'image', label: 'Image Tools' },
  { id: 'video', label: 'Video Tools' },
  { id: 'pdf', label: 'PDF Tools' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' ||
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero__title">Our Tools</h1>
        <p className="hero__desc">
          A collection of 100% free, client-side tools that run entirely in your browser. No data is uploaded, no servers are involved. Fast, secure, and minimal.
        </p>
      </section>

      {/* Search & Filter Bar */}
      <section className="filter-bar">
        <div className="search-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="category-tags">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-tag ${activeCategory === cat.id ? 'category-tag--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tools Grid */}
      <section className="tools-grid">
        {filteredTools.length > 0 ? (
          filteredTools.map(tool => (
            <Link to={tool.path} className="tool-card" key={tool.path}>
              <div className="tool-card__icon">{tool.icon}</div>
              <div className="tool-card__content">
                <h3 className="tool-card__title">{tool.title}</h3>
                <p className="tool-card__desc">{tool.desc}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="no-results">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="no-results__text">No tools found for "{searchQuery}"</p>
            <button className="no-results__btn" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
              Clear Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

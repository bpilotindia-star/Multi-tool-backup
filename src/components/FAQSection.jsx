import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './FAQSection.css';

// Central FAQ database containing high-CTR, search-optimized items for every single route
const FAQ_DATABASE = {
  '/': [
    {
      q: 'What is the Multi-Tool Platform?',
      a: 'The <strong>Multi-Tool Platform</strong> is a fast, web-based toolbox containing over 20+ utilities for images, videos, and PDFs. It is completely free and works instantly in any web browser without registration or software downloads.'
    },
    {
      q: 'Is my data secure when using your online tools?',
      a: 'Absolutely. Unlike traditional converters, our platform processes <strong>100% of your files client-side</strong>. This means background removal, image compression, and PDF merging happen directly on your device. Your sensitive files are <strong>never uploaded to a server</strong>, offering absolute data privacy.'
    },
    {
      q: 'Why should I choose local browser tools over online servers?',
      a: 'Offline-capable local tools provide <strong>instant conversions</strong> because you do not have to wait for large files to upload and download. Additionally, it guarantees zero leakage of confidential legal documents or personal photos since nothing leaves your browser.'
    },
    {
      q: 'Are there conversion limits or hidden costs?',
      a: 'No. This is a <strong>completely free online tool suite</strong>. There are no subscription fees, no file size limits, and no account log-in requirements. You get unlimited, unrestricted access to all premium features.'
    }
  ],
  '/bg-remover': [
    {
      q: 'How do I remove image backgrounds online for free?',
      a: 'Simply upload your photo to our <strong>free online background remover</strong>. Our advanced local artificial intelligence detects the subject and makes the background transparent in seconds, exporting as a high-quality PNG.'
    },
    {
      q: 'Are my private photos uploaded to a server for background removal?',
      a: 'No. Our <strong>private background remover</strong> runs an AI model locally inside your browser. Your images stay on your device, making it 100% secure for sensitive or personal files.'
    },
    {
      q: 'Does removing the background reduce my photo quality?',
      a: 'No, this tool exports your images in their <strong>original HD resolution</strong>. It cuts out the background cleanly while preserving the exact pixels and quality of the foreground subject.'
    }
  ],
  '/image-compressor': [
    {
      q: 'How can I compress images online without losing quality?',
      a: 'Use our <strong>lossless image compressor</strong>. By uploading your JPG, PNG, or WebP files, the tool shrinks the metadata and optimizes pixels directly in the browser to reduce file size without any noticeable drop in visual quality.'
    },
    {
      q: 'Can I compress multiple image formats at once?',
      a: 'Yes, you can upload and batch-compress multiple files. The tool handles <strong>JPG, PNG, and WebP compression</strong> simultaneously, allowing you to download all compressed files instantly.'
    },
    {
      q: 'Is it secure to compress confidential or private screenshots?',
      a: 'Yes. Since all optimization happens locally on your computer via client-side code, it is the safest way to compress private screenshots, receipts, or legal IDs without sending them to unknown online servers.'
    }
  ],
  '/image-converter': [
    {
      q: 'What is the easiest way to convert JPG to PNG or WebP?',
      a: 'Our <strong>online image converter</strong> allows you to drop any image and change its format instantly. It supports conversions between all popular formats: <strong>convert JPG to PNG, PNG to WebP, WebP to JPG, GIF to PNG</strong>, and more.'
    },
    {
      q: 'Can I batch convert images in bulk?',
      a: 'Yes! You can select multiple photos, select a target format, and convert them in bulk. All processing is processed in parallel, saving you time without compromising on quality.'
    },
    {
      q: 'Will my converted image lose resolution?',
      a: 'No, our converter performs format changes at <strong>100% original quality and resolution</strong>. It maps image pixel arrays directly, ensuring no blurring or resolution drops.'
    }
  ],
  '/image-resizer': [
    {
      q: 'How do I resize image pixels online for free?',
      a: 'Upload your photo to our <strong>free image resizer</strong> and input your target width or height in pixels. You can lock the aspect ratio to prevent stretching, or crop the image to fit custom dimensions.'
    },
    {
      q: 'Can I scale photos by percentage?',
      a: 'Yes. Our tool allows you to scale images by percentages (e.g., 50% smaller, 200% larger) or input exact custom width/height dimensions depending on your requirement.'
    },
    {
      q: 'How does the tool prevent my resized photos from looking pixelated?',
      a: 'We use high-quality canvas bicubic interpolation algorithms to ensure that when you upscale or downscale photos, the details stay clean, sharp, and artifact-free.'
    }
  ],
  '/image-blur': [
    {
      q: 'How do I blur sensitive text or faces in a photo?',
      a: 'Select our <strong>free online image blur tool</strong>, upload your image, and add customized blur overlays. You can drag, resize, and place circular or rectangular blur shapes to censor faces, license plates, or credit card numbers.'
    },
    {
      q: 'Is the original, unblurred image saved or uploaded?',
      a: 'Never. Our <strong>private photo censoring tool</strong> operates entirely in your web browser. The original image remains inside your computer memory and is never uploaded anywhere.'
    },
    {
      q: 'Can I adjust the blur intensity?',
      a: 'Yes, you can customize the opacity and blur radius of each individual shape overlay to get the perfect amount of obfuscation.'
    }
  ],
  '/pdf-to-image': [
    {
      q: 'How do I convert PDF pages to high-quality JPGs?',
      a: 'Upload your document to our <strong>PDF to JPG converter</strong>. The tool renders every page of the PDF onto a digital canvas and lets you export them as individual high-resolution JPG or PNG images, or download them all in a single ZIP file.'
    },
    {
      q: 'Can I convert password-secured PDFs into images?',
      a: 'Yes, as long as you enter the password, our local script can decrypt and convert the secure PDF pages into image formats without sending the password to a database.'
    },
    {
      q: 'Is there a limit on how many PDF pages I can extract?',
      a: 'No. You can convert large PDF manuals with hundreds of pages. Because the rendering runs using your browser resources, there is no file size or page limit.'
    }
  ],
  '/image-to-pdf': [
    {
      q: 'How do I combine multiple photos into a single PDF?',
      a: 'Drag and drop your images into our <strong>image to PDF converter</strong>. You can arrange their order using drag-and-drop, customize page margins, select page orientation (portrait/landscape), and export them as a single clean PDF.'
    },
    {
      q: 'What image formats are supported for PDF conversion?',
      a: 'The converter supports all major image formats. You can convert <strong>JPG to PDF, PNG to PDF, WebP to PDF</strong>, and combine mixed formats into one document.'
    },
    {
      q: 'Are my combined PDF sheets private?',
      a: 'Yes, the PDF is compiled locally using client-side JavaScript. Your personal photos and documents never cross the internet, making it 100% private.'
    }
  ],
  '/image-upscaler': [
    {
      q: 'How do I upscale low-resolution photos online for free?',
      a: 'Upload your image to our <strong>AI photo upscaler</strong>. The tool analyzes the pixels and scales up your images (2x or 4x) using intelligent client-side interpolation models to sharpen details and enlarge images without pixelation.'
    },
    {
      q: 'Does upscaling blurry photos make them clear?',
      a: 'Yes, the tool is designed to enhance blurry details, sharpen edges, and remove noise, giving you a cleaner, higher-resolution version of low-quality pictures.'
    },
    {
      q: 'What is the limit of file sizes I can upscale?',
      a: 'You can upscale standard images (PNG, JPG, WebP) directly in your browser. Because AI model inference runs on your graphics processor or CPU locally, it works completely privately.'
    }
  ],
  '/pdf-compressor': [
    {
      q: 'How can I reduce PDF file sizes to under 100KB for online forms?',
      a: 'Drop your document into our <strong>free PDF compressor</strong>. Choose your compression level (Low, Medium, or Extreme) to strip unneeded metadata and compress heavy images to shrink the file size instantly.'
    },
    {
      q: 'Will my PDF lose readability after compression?',
      a: 'Our default medium compression uses intelligent downscaling that keeps text crystal clear and graphics highly readable while shaving off up to 80% of the storage size.'
    },
    {
      q: 'Is it safe to compress private bank statements or government IDs?',
      a: 'Absolutely. Since the file is compressed locally using your web browser, no server ever has access to your private financial sheets or personal details.'
    }
  ],
  '/pdf-merge': [
    {
      q: 'How do I merge multiple PDFs into one document?',
      a: 'Upload your documents to our <strong>online PDF merger</strong>. You can drag and drop the files to rearrange their ordering, delete unwanted pages, and click "Merge" to instantly download a single combined PDF.'
    },
    {
      q: 'Can I combine PDFs of different page sizes?',
      a: 'Yes. Our merger maps different page formats (A4, Letter, Custom) correctly into the new consolidated file without resizing or clipping the content.'
    },
    {
      q: 'Is there a limit on how many PDFs I can join?',
      a: 'No. You can merge as many PDF files as your device memory can handle. Everything is joined in seconds right in your browser.'
    }
  ],
  '/pdf-split': [
    {
      q: 'How do I extract pages from a PDF for free?',
      a: 'Use our <strong>free PDF splitter</strong>. Upload your PDF, view all page thumbnails, and choose whether to extract a specific page range (e.g., pages 2-5) or split every page into separate individual files.'
    },
    {
      q: 'Can I preview PDF page contents before splitting?',
      a: 'Yes, our tool generates high-quality visual thumbnails of every page in your PDF document, so you know exactly which page numbers you want to split or delete.'
    },
    {
      q: 'Will my interactive links and bookmarks be preserved after splitting?',
      a: 'Yes. Our client-side library preserves internal formatting, links, annotations, and formatting layers, ensuring your extracted pages remain fully interactive.'
    }
  ],
  '/word-to-pdf': [
    {
      q: 'How do I convert Word document files to PDF without Microsoft Office?',
      a: 'Upload your file to our <strong>DOCX to PDF converter</strong>. The client-side parser reads the file contents and exports it directly to PDF format in seconds, keeping fonts and margins intact.'
    },
    {
      q: 'Does it preserve tables, formatting, and images?',
      a: 'Yes. Our converter parses standard Word layouts including paragraph spacing, headers, nested tables, and colored text, rendering them as layout-precise PDF elements.'
    },
    {
      q: 'Is my uploaded resume or letter private?',
      a: '100% private. Unlike other converters that upload files to cloud servers where copies can linger, our conversion is purely client-side. Your resume, letters, or contracts never leave your browser.'
    }
  ],
  '/excel-to-pdf': [
    {
      q: 'How do I convert an Excel spreadsheet into a PDF file?',
      a: 'Upload your XLSX or CSV file to our <strong>Excel to PDF converter</strong>. Select the sheet you want to export, preview the rendered tables, and save it as a high-quality PDF page layout.'
    },
    {
      q: 'Can I convert multi-sheet Excel workbooks?',
      a: 'Yes, our tool detects all worksheets inside your Excel workbook, letting you choose between sheets and preview the tabular layout before exporting.'
    },
    {
      q: 'How does it handle gridlines and wide table columns?',
      a: 'The converter maps spreadsheet tables onto PDF page formats, ensuring gridlines are kept visible and columns are fit proportionally to prevent text clippings.'
    }
  ],
  '/pdf-watermark': [
    {
      q: 'How can I add watermarks to a PDF document online?',
      a: 'Drop your document into our <strong>PDF watermarker</strong>. Choose to insert a custom text (e.g., "CONFIDENTIAL") or an image logo. You can rotate the watermark, set its opacity, and position it via drag-and-drop.'
    },
    {
      q: 'Does it apply the watermark to every page in the PDF?',
      a: 'Yes, by default it repeats the watermark across every single page. You can customize the transparency to ensure your content remains readable.'
    },
    {
      q: 'Can my watermark be easily removed by others?',
      a: 'The watermark is baked directly into the PDF layout content stream, making it highly secure and difficult to remove without professional editing software.'
    }
  ],
  '/pdf-protect': [
    {
      q: 'How do I password protect a PDF online for free?',
      a: 'Drop your document into our <strong>PDF protection tool</strong>, type in your strong password, and click encrypt. It locks the PDF using industry-standard security so nobody can open it without the password.'
    },
    {
      q: 'What encryption algorithm is used to protect my PDF?',
      a: 'We use high-security 256-bit AES encryption to protect your PDF files. This is the global standard for securing banking documents and military records.'
    },
    {
      q: 'Is it secure to type passwords into your platform?',
      a: 'Yes. Because the encryption happens entirely in your local browser, the password you type never travels across the internet and is never sent to any database.'
    }
  ],
  '/pdf-unlock': [
    {
      q: 'How do I decrypt and unlock a password-locked PDF?',
      a: 'Upload your file to our <strong>PDF password remover</strong>, enter the valid user/owner password, and download the fully decrypted PDF version that opens without asking for password prompts.'
    },
    {
      q: 'Can I unlock a PDF if I do not know the password?',
      a: 'No, to ensure legal security compliance, this tool does not perform password cracking. You must enter the correct password once to permanently decrypt the document.'
    },
    {
      q: 'Is my unlocked PDF file saved anywhere?',
      a: 'Never. The file decryption takes place locally in browser memory. Once you download the unlocked copy, it exists solely on your local device.'
    }
  ],
  '/video-cutter': [
    {
      q: 'How do I trim and cut video clips online without watermarks?',
      a: 'Use our <strong>free online video cutter</strong>. Upload your video, drag the start and end sliders to define your clip range, and export. There are no branding watermarks added to your exported clips.'
    },
    {
      q: 'Does trimming a video clip degrade the output quality?',
      a: 'No. Our cutter runs local FFmpeg code which allows extracting and trimming specific segments with high fidelity, maintaining your original video resolution.'
    },
    {
      q: 'How long does the video trimming process take?',
      a: 'Since we use WebAssembly to execute video slicing locally on your CPU/GPU, it is extremely fast and avoids the slow upload/download speeds of cloud video platforms.'
    }
  ],
  '/video-watermark': [
    {
      q: 'How do I watermark videos online without downloading software?',
      a: 'Upload your clip to our <strong>free video watermarking tool</strong>. Add a custom text or logo image, drag it to the desired position, adjust sizing and transparency, and export.'
    },
    {
      q: 'Can I add multiple image logos and text lines to my video?',
      a: 'Yes! The tool lets you combine text stamps and PNG images. You can position them independently and view a live real-time preview of their placement.'
    },
    {
      q: 'Does watermarking re-encode the entire video file?',
      a: 'Yes, adding custom overlays requires processing the frame stream. We run WebAssembly FFmpeg inside your browser to burn the watermark into each frame securely and privately.'
    }
  ],
  '/photo-grid': [
    {
      q: 'How do I print a sheet of passport size photos at home?',
      a: 'Upload your portrait photo to our <strong>passport photo grid maker</strong>. Select the required photo size (e.g., 35x45mm passport, stamp size, 2x2 inch), choose page size (A4 or 4x6"), adjust margins and spacing, and click print or download PDF.'
    },
    {
      q: 'Can I choose exactly how many photo copies to print?',
      a: 'Yes, you can choose "Fill Entire Page" or select "Custom Amount" and specify the exact number of copies. The grid starts from the top-left to avoid wasting expensive photo paper.'
    },
    {
      q: 'What are the dashed guidelines for?',
      a: 'We draw optional dashed guidelines between photos to show you exactly where to cut. They prevent cutting into the photos and ensure perfectly sized passport cards.'
    }
  ]
};

export default function FAQSection() {
  const { pathname } = useLocation();
  const faqs = FAQ_DATABASE[pathname] || null;
  const [activeIndex, setActiveIndex] = useState(null);

  // Dynamically inject structured data (JSON-LD) for SEO Rich Snippets
  useEffect(() => {
    if (!faqs || faqs.length === 0) return;

    // Build the Schema object
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.q.replace(/<\/?[^>]+(>|$)/g, ""), // strip HTML
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.a.replace(/<\/?[^>]+(>|$)/g, "") // strip HTML
        }
      }))
    };

    // Create script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-schema-markup';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);

    // Clean up on unmount or route change
    return () => {
      const existingScript = document.getElementById('faq-schema-markup');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [pathname, faqs]);

  if (!faqs) return null;

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <p className="faq-subtitle">Everything you need to know about this tool</p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => {
          const isActive = activeIndex === index;
          return (
            <div 
              key={index} 
              className={`faq-item ${isActive ? 'faq-item--active' : ''}`}
            >
              <button 
                className="faq-trigger" 
                onClick={() => toggleFAQ(index)}
                aria-expanded={isActive}
              >
                <span className="faq-question">{faq.q}</span>
                <span className="faq-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </span>
              </button>
              <div 
                className="faq-content"
                style={{
                  maxHeight: isActive ? '300px' : '0px',
                  transition: 'max-height var(--duration-base) var(--ease), padding var(--duration-base) var(--ease)'
                }}
              >
                <p 
                  className="faq-answer"
                  dangerouslySetInnerHTML={{ __html: faq.a }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

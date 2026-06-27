import { useEffect } from 'react';

export default function useSEO({ title, description, keywords, url }) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = title;
      
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
      
      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) twitterTitle.setAttribute('content', title);
    }

    // 2. Update Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', description);
      
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);
      
      let twitterDesc = document.querySelector('meta[name="twitter:description"]');
      if (twitterDesc) twitterDesc.setAttribute('content', description);
    }

    // 3. Update Keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) metaKeywords.setAttribute('content', keywords);
    }

    // 4. Update Canonical / OG URL
    if (url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute('href', url);
      
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', url);
    }

    // Cleanup: revert to homepage defaults when unmounting (optional but good for SPA)
    return () => {
      document.title = "Multi-Tool Platform | Free Online Image, Video & PDF Tools — 100% Private";
      
      const defaultDesc = "Free browser-based tools: remove backgrounds, compress images, convert video to frames, merge & split PDFs, add watermarks, cut video clips, create photo grids & more. All processing happens locally — no uploads, no servers, 100% private.";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
      
      const defaultKeywords = "free online tools, image tools, video tools, pdf tools, remove background online free, image compressor, image resizer, image converter, image upscaler, image blur tool, video to frame converter, video to frame online free, video clip cutter, video watermark, pdf compressor, pdf merge, pdf split, word to pdf, excel to pdf, pdf watermark, pdf protect, pdf unlock, pdf to image, image to pdf, photo grid printer, passport photo grid, stamp photo print, client side tools, browser based tools, no upload tools, privacy tools, free tools online, multi tool platform";
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) metaKeywords.setAttribute('content', defaultKeywords);
      
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute('href', "https://multi-tool-platform.online/");
    };
  }, [title, description, keywords, url]);
}

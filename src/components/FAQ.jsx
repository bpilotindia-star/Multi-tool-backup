import { useState } from 'react';
import './FAQ.css';

const faqs = [
  {
    q: 'What is the best free video to frame converter online?',
    a: 'Our tool is the best free video to frame convertor online. It lets you easily extract individual frames from any video file without losing quality. Just upload your video, set your desired frame rate, and get your video to frames PNG format instantly.',
  },
  {
    q: 'Is this video to frame extractor free to use?',
    a: 'Yes! This is a 100% free video to frame tool. There are no limits on video length or the number of extractions. You can use our video to frame converter free of charge, with no hidden fees, watermarks, or premium plans.',
  },
  {
    q: 'Do you offer a video frame free download option?',
    a: 'Absolutely. Once the extraction is complete, you get a video frame free download as a ZIP file. Every single frame is saved as a high-quality PNG image right to your device.',
  },
  {
    q: 'Can I extract a video to frame online free without uploading my data?',
    a: 'Yes, this free video to frame online tool processes everything locally in your browser using HTML5 and JavaScript. Your video never leaves your device, ensuring maximum privacy while using our video to frame convertor.',
  },
  {
    q: 'Do you have a video frame extractor from URL feature?',
    a: 'Currently, our free video to frame tool only supports local file uploads to ensure maximum privacy and processing speed. A video frame extractor from URL feature is actively being developed for a future update.',
  },
  {
    q: 'What video formats can this video to frame converter handle?',
    a: 'Our video to frame online tool supports all major video formats including MP4, WebM, MOV, AVI, and MKV. If your browser can play the video, you can convert video to frame free using our platform.',
  },
  {
    q: 'What does FPS mean when I convert video to frames PNG?',
    a: 'FPS stands for Frames Per Second. It dictates how many images are extracted from each second of your video. For example, if you set 1 FPS on a 10-second clip, you will get a video to frames PNG download containing exactly 10 images.',
  },
  {
    q: 'Can I use this free video to frame convertor online on my phone?',
    a: 'Yes, our free video to frame convertor works seamlessly on any modern browser across desktop, tablet, and mobile devices. However, for extracting frames from very large videos, a desktop computer is recommended for optimal performance.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="faq" id="faq-section">
      <h2 className="faq__title">Frequently Asked Questions</h2>

      <div className="faq__list">
        {faqs.map((item, i) => (
          <div
            key={i}
            className={`faq__item ${openIndex === i ? 'faq__item--open' : ''}`}
          >
            <button className="faq__q" onClick={() => toggle(i)}>
              <span>{item.q}</span>
              <svg
                className="faq__chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="faq__a-wrap">
              <p className="faq__a">{item.a}</p>
            </div>
          </div>
        ))}
      </div>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          }),
        }}
      />
    </section>
  );
}

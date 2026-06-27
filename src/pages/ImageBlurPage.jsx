import { useState, useRef, useEffect, useCallback } from 'react';
import useSEO from '../hooks/useSEO';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Line, Group, Transformer } from 'react-konva';
import { saveAs } from 'file-saver';
import './ImageBlurPage.css';

const TOOLS = [
  { id: 'select', label: 'Select' },
  { id: 'pen', label: 'Pen' },
  { id: 'rect', label: 'Rectangle' },
  { id: 'rounded_rect', label: 'Rounded Rect' },
  { id: 'circle', label: 'Circle' }
];

export default function ImageBlurPage() {
  useSEO({
    title: 'Free Image Blur Tool | Blur Faces & Backgrounds Online',
    description: 'Easily blur sensitive information, faces, or backgrounds in your photos. 100% private client-side processing.',
    keywords: 'image blur, blur face online, blur background, censor image, privacy tool, client side image editor, free image blur',
    url: 'https://multi-tool-platform.online/image-blur'
  });

  const [sourceFile, setSourceFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [blurredImageObj, setBlurredImageObj] = useState(null);

  const [shapes, setShapes] = useState([]);
  const [mode, setMode] = useState('select');
  const [blurType, setBlurType] = useState('blur'); // blur | pixelate
  const [intensity, setIntensity] = useState(20);

  const [selectedId, setSelectedId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Resize canvas to fit container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sourceFile]);

  // Load Image Object
  useEffect(() => {
    if (sourceFile) {
      const url = URL.createObjectURL(sourceFile);
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        setImageObj(img);
        setShapes([]);
        setSelectedId(null);
      };
      return () => URL.revokeObjectURL(url);
    }
  }, [sourceFile]);

  // Generate Blurred/Pixelated Image
  useEffect(() => {
    if (!imageObj) return;

    let isMounted = true;
    const generateEffect = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imageObj.width;
      canvas.height = imageObj.height;
      const ctx = canvas.getContext('2d');

      if (blurType === 'blur') {
        ctx.filter = `blur(${intensity}px)`;
        ctx.drawImage(imageObj, 0, 0);
      } else if (blurType === 'pixelate') {
        const size = (intensity / 100) * 0.1; // scale 0.01 to 0.1
        const w = Math.max(1, Math.floor(imageObj.width * size));
        const h = Math.max(1, Math.floor(imageObj.height * size));
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(imageObj, 0, 0, w, h);
        ctx.drawImage(canvas, 0, 0, w, h, 0, 0, imageObj.width, imageObj.height);
      }

      const newImg = new window.Image();
      newImg.src = canvas.toDataURL('image/jpeg', 0.9);
      newImg.onload = () => {
        if (isMounted) setBlurredImageObj(newImg);
      };
    };

    // Debounce generation slightly
    const timer = setTimeout(generateEffect, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [imageObj, blurType, intensity]);

  // Handle Selection Transformer
  useEffect(() => {
    if (mode === 'select' && selectedId && trRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedId, mode]);

  // Calculate Scale to fit image inside container
  const scale = imageObj 
    ? Math.min(
        containerSize.width / imageObj.width,
        containerSize.height / imageObj.height,
        1
      )
    : 1;

  const stageWidth = imageObj ? imageObj.width * scale : containerSize.width;
  const stageHeight = imageObj ? imageObj.height * scale : containerSize.height;

  // Drawing Handlers
  const handleMouseDown = (e) => {
    if (mode === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'bg-image';
      if (clickedOnEmpty) setSelectedId(null);
      return;
    }

    setIsDrawing(true);
    setSelectedId(null);
    const pos = e.target.getStage().getPointerPosition();
    const x = pos.x / scale;
    const y = pos.y / scale;

    const id = Date.now().toString();

    if (mode === 'pen') {
      setShapes([...shapes, { id, type: 'pen', points: [x, y], strokeWidth: 40 / scale }]);
    } else if (mode === 'rect' || mode === 'rounded_rect') {
      setShapes([...shapes, { id, type: mode, x, y, width: 0, height: 0, cornerRadius: mode === 'rounded_rect' ? 20 : 0 }]);
    } else if (mode === 'circle') {
      setShapes([...shapes, { id, type: 'circle', x, y, radius: 0 }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const x = point.x / scale;
    const y = point.y / scale;

    setShapes(shapes.map((shape, i) => {
      if (i !== shapes.length - 1) return shape;
      
      if (mode === 'pen') {
        return { ...shape, points: shape.points.concat([x, y]) };
      } else if (mode === 'rect' || mode === 'rounded_rect') {
        return { ...shape, width: x - shape.x, height: y - shape.y };
      } else if (mode === 'circle') {
        const dx = x - shape.x;
        const dy = y - shape.y;
        return { ...shape, radius: Math.sqrt(dx * dx + dy * dy) };
      }
      return shape;
    }));
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleDragEnd = (e, id) => {
    const node = e.target;
    setShapes(shapes.map(s => {
      if (s.id === id) {
        return { ...s, x: node.x(), y: node.y() };
      }
      return s;
    }));
  };

  const handleTransformEnd = (e, id) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    setShapes(shapes.map(s => {
      if (s.id === id) {
        if (s.type === 'rect' || s.type === 'rounded_rect') {
          return {
            ...s,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          };
        } else if (s.type === 'circle') {
          return {
            ...s,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            radius: Math.max(5, node.radius() * scaleX),
          };
        }
      }
      return s;
    }));
  };

  const handleShapeClick = (e, id) => {
    if (mode === 'select') {
      setSelectedId(id);
    }
  };

  const handleDeleteShape = () => {
    if (selectedId) {
      setShapes(shapes.filter(s => s.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleExport = () => {
    if (!stageRef.current) return;
    
    // Deselect before export
    setSelectedId(null);
    
    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 1 / scale, // Export at original resolution
        mimeType: 'image/jpeg',
        quality: 1
      });
      const name = sourceFile.name.replace(/\.[^/.]+$/, "");
      saveAs(dataURL, `${name}_blurred.jpg`);
    }, 100);
  };

  // Upload Logic
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) setSourceFile(file);
  };

  return (
    <div className="imb-page">
      <div className="imb-header">
        <h1 className="imb-title">Image Blur Tool</h1>
        <p className="imb-desc">
          Censor faces, license plates, or sensitive info locally.
        </p>
      </div>

      {!sourceFile ? (
        <div className="imb-workspace" style={{ maxWidth: 600 }}>
          <div className="imb-upload">
            <div className="imb-upload__inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="imb-upload__icon">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 10 10" opacity="0.3"/>
              </svg>
              <p className="imb-upload__text">Select an image to blur</p>
              <label className="imb-upload__btn" htmlFor="imb-upload">Browse files</label>
              <input type="file" id="imb-upload" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0])} hidden />
            </div>
          </div>
        </div>
      ) : (
        <div className="imb-editor">
          {/* Toolbar */}
          <div className="imb-toolbar">
            
            <div className="imb-toolbar__group">
              <span className="imb-toolbar__label">Tools</span>
              <div className="imb-toolbar__tools">
                {TOOLS.map(t => (
                  <button 
                    key={t.id} 
                    className={`imb-tool-btn ${mode === t.id ? 'active' : ''}`}
                    onClick={() => { setMode(t.id); setSelectedId(null); }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="imb-toolbar__group">
              <span className="imb-toolbar__label">Effect Type</span>
              <select className="imb-select" value={blurType} onChange={e => setBlurType(e.target.value)}>
                <option value="blur">Gaussian Blur</option>
                <option value="pixelate">Pixelate</option>
              </select>
            </div>

            <div className="imb-toolbar__group" style={{ flex: 1, minWidth: 200 }}>
              <span className="imb-toolbar__label">Intensity ({intensity})</span>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={intensity} 
                onChange={e => setIntensity(Number(e.target.value))}
                className="imb-slider"
              />
            </div>

            <div className="imb-toolbar__actions">
              {selectedId && (
                <button className="imb-btn imb-btn--danger" onClick={handleDeleteShape}>Delete Selected</button>
              )}
              <button className="imb-btn imb-btn--secondary" onClick={() => setSourceFile(null)}>Reset</button>
              <button className="imb-btn imb-btn--primary" onClick={handleExport}>Download Image</button>
            </div>
          </div>

          {/* Canvas Workspace */}
          <div className="imb-canvas-wrap" ref={containerRef}>
            {imageObj && (
              <Stage
                width={stageWidth}
                height={stageHeight}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onTouchStart={(e) => { e.evt.preventDefault(); handleMouseDown(e); }}
                onTouchMove={(e) => { e.evt.preventDefault(); handleMouseMove(e); }}
                onTouchEnd={(e) => { e.evt.preventDefault(); handleMouseUp(); }}
                ref={stageRef}
                style={{ background: '#000', margin: '0 auto', display: 'block' }}
              >
                {/* Background Sharp Image */}
                <Layer>
                  <Group scaleX={scale} scaleY={scale}>
                    <KonvaImage 
                      name="bg-image"
                      image={imageObj} 
                      width={imageObj.width} 
                      height={imageObj.height} 
                    />
                  </Group>
                </Layer>

                {/* Mask Layer: Shapes are drawn black, then blurred image is composited in */}
                <Layer>
                  <Group scaleX={scale} scaleY={scale}>
                    {shapes.map(shape => {
                      const commonProps = {
                        key: shape.id,
                        id: shape.id,
                        draggable: mode === 'select',
                        onClick: (e) => handleShapeClick(e, shape.id),
                        onTap: (e) => handleShapeClick(e, shape.id),
                        onDragEnd: (e) => handleDragEnd(e, shape.id),
                        onTransformEnd: (e) => handleTransformEnd(e, shape.id),
                        x: shape.x,
                        y: shape.y,
                        rotation: shape.rotation || 0,
                      };

                      if (shape.type === 'rect' || shape.type === 'rounded_rect') {
                        return <Rect {...commonProps} width={shape.width} height={shape.height} cornerRadius={shape.cornerRadius} fill="black" />;
                      } else if (shape.type === 'circle') {
                        return <Circle {...commonProps} radius={shape.radius} fill="black" />;
                      } else if (shape.type === 'pen') {
                        return <Line {...commonProps} points={shape.points} stroke="black" strokeWidth={shape.strokeWidth} tension={0.5} lineCap="round" lineJoin="round" />;
                      }
                      return null;
                    })}
                    
                    {blurredImageObj && (
                      <KonvaImage
                        image={blurredImageObj}
                        width={imageObj.width}
                        height={imageObj.height}
                        globalCompositeOperation="source-in"
                        listening={false} 
                      />
                    )}
                  </Group>
                </Layer>

                {/* UI Layer for Transformer */}
                <Layer>
                  {mode === 'select' && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} />}
                </Layer>
              </Stage>
            )}
          </div>

          {/* Quick Guide for Beginners */}
          <div className="imb-guide">
            <h3 className="imb-guide__title">How to use this tool</h3>
            <div className="imb-guide__steps">
              <div className="imb-guide__step">
                <div className="imb-guide__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                </div>
                <div className="imb-guide__text">
                  <strong>1. Draw a Shape</strong>
                  <p>Choose Pen, Rectangle, or Circle and draw directly over the face or object you want to hide.</p>
                </div>
              </div>
              <div className="imb-guide__step">
                <div className="imb-guide__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l4 4-4 4"/><path d="M19 9l-4 4 4 4"/><path d="M9 5l4-4 4 4"/><path d="M9 19l4 4 4-4"/></svg>
                </div>
                <div className="imb-guide__text">
                  <strong>2. Adjust & Move</strong>
                  <p>Click "Select" from the tools to drag, resize, rotate, or delete the shapes you've drawn.</p>
                </div>
              </div>
              <div className="imb-guide__step">
                <div className="imb-guide__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                </div>
                <div className="imb-guide__text">
                  <strong>3. Apply Effect</strong>
                  <p>Choose between smooth Blur or Pixelate, adjust the intensity, and click Download!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

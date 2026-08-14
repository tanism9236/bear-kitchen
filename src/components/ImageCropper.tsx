import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}

const OUTPUT_SIZE = 600; // output 600x600 px

export function ImageCropper({ imageSrc, onCrop, onCancel }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);

  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);

  // Image position (top-left) and scale relative to container
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(3);
  const [containerSize, setContainerSize] = useState(0);

  // Drag state
  const dragStart = useRef<{ x: number; y: number; imgX: number; imgY: number } | null>(null);

  // Load image to get natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const size = containerRef.current.clientWidth;
        setContainerSize(size);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Initialize position and scale when dimensions are known
  useEffect(() => {
    if (!naturalW || !naturalH || !containerSize) return;

    // Fit scale: image fills the square (cover behavior)
    const fit = Math.max(containerSize / naturalW, containerSize / naturalH);
    setMinScale(fit);
    setMaxScale(fit * 4);
    setScale(fit);

    // Center the image
    const dispW = naturalW * fit;
    const dispH = naturalH * fit;
    setImgX((containerSize - dispW) / 2);
    setImgY((containerSize - dispH) / 2);
  }, [naturalW, naturalH, containerSize]);

  // Clamp position so image always covers the square
  const clampPos = useCallback(
    (x: number, y: number, s: number) => {
      const dispW = naturalW * s;
      const dispH = naturalH * s;
      const maxX = 0;
      const minX = containerSize - dispW;
      const maxY = 0;
      const minY = containerSize - dispH;
      return {
        x: Math.min(maxX, Math.max(minX, x)),
        y: Math.min(maxY, Math.max(minY, y)),
      };
    },
    [naturalW, naturalH, containerSize]
  );

  // Pointer events for drag
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, imgX, imgY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const { x, y } = clampPos(
      dragStart.current.imgX + dx,
      dragStart.current.imgY + dy,
      scale
    );
    setImgX(x);
    setImgY(y);
  };

  const onPointerUp = () => {
    dragStart.current = null;
  };

  // Zoom
  const handleZoom = (newScale: number) => {
    const clamped = Math.min(maxScale, Math.max(minScale, newScale));
    // Zoom toward center of container
    const cx = containerSize / 2;
    const cy = containerSize / 2;
    // Image point under center before zoom
    const imgPx = (cx - imgX) / scale;
    const imgPy = (cy - imgY) / scale;
    // New position to keep that point under center
    const newX = cx - imgPx * clamped;
    const newY = cy - imgPy * clamped;
    const { x, y } = clampPos(newX, newY, clamped);
    setImgX(x);
    setImgY(y);
    setScale(clamped);
  };

  // Reset
  const handleReset = () => {
    const fit = Math.max(containerSize / naturalW, containerSize / naturalH);
    const dispW = naturalW * fit;
    const dispH = naturalH * fit;
    setScale(fit);
    setImgX((containerSize - dispW) / 2);
    setImgY((containerSize - dispH) / 2);
  };

  // Crop: extract 1:1 from original image
  const handleCrop = () => {
    if (!imgElRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate source rectangle in original image coordinates
    // srcX = -imgX / scale, srcY = -imgY / scale
    // srcW = srcH = containerSize / scale
    const sx = -imgX / scale;
    const sy = -imgY / scale;
    const sw = containerSize / scale;
    const sh = containerSize / scale;

    ctx.drawImage(imgElRef.current, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCrop(dataUrl);
  };

  const zoomPercent = ((scale - minScale) / (maxScale - minScale)) * 100;

  return (
    <div className="cropper-overlay" onClick={onCancel}>
      <div
        className="cropper-modal animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="cropper-title">裁剪封面</h3>
        <p className="cropper-hint">拖动调整位置，缩放调整大小</p>

        {/* Crop area */}
        <div
          ref={containerRef}
          className="cropper-container"
          style={{
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '1 / 1',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="裁剪预览"
            className="cropper-image"
            style={{
              transform: `translate(${imgX}px, ${imgY}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: naturalW,
              height: naturalH,
            }}
            draggable={false}
          />
          {/* Grid overlay */}
          <div className="cropper-grid">
            <div className="cropper-grid-line h" style={{ top: '33.33%' }} />
            <div className="cropper-grid-line h" style={{ top: '66.66%' }} />
            <div className="cropper-grid-line v" style={{ left: '33.33%' }} />
            <div className="cropper-grid-line v" style={{ left: '66.66%' }} />
          </div>
          <div className="cropper-border" />
        </div>

        {/* Zoom slider */}
        <div className="cropper-zoom">
          <button
            className="cropper-zoom-btn"
            onClick={() => handleZoom(scale / 1.2)}
          >
            <span>−</span>
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={zoomPercent}
            onChange={(e) => {
              const pct = Number(e.target.value);
              const newScale = minScale + (pct / 100) * (maxScale - minScale);
              handleZoom(newScale);
            }}
            className="cropper-zoom-slider"
          />
          <button
            className="cropper-zoom-btn"
            onClick={() => handleZoom(scale * 1.2)}
          >
            <span>+</span>
          </button>
        </div>

        {/* Actions */}
        <div className="cropper-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            重置
          </button>
          <button className="btn btn-primary" onClick={handleCrop}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

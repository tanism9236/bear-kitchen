import { useState, useRef } from 'react';
import { ImageCropper } from './ImageCropper';

interface CoverImageUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function CoverImageUploader({ value, onChange }: CoverImageUploaderProps) {
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleCrop = (dataUrl: string) => {
    onChange(dataUrl);
    setRawImage(null);
  };

  const handleRemove = () => {
    onChange(null);
  };

  if (rawImage) {
    return (
      <ImageCropper
        imageSrc={rawImage}
        onCrop={handleCrop}
        onCancel={() => setRawImage(null)}
      />
    );
  }

  if (value) {
    return (
      <div className="cover-uploader-preview">
        <img src={value} alt="封面预览" className="cover-uploader-img" />
        <div className="cover-uploader-actions">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            更换图片
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleRemove}
          >
            移除
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={`cover-uploader-empty ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="cover-uploader-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="cover-uploader-text">点击或拖拽上传封面图片</p>
        <p className="cover-uploader-hint">将裁剪为 1:1 正方形</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </>
  );
}

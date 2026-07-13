/**
 * 图片查看器（Lightbox）- 点击缩略图后全屏查看原图
 */
import React, { useState, useEffect, useCallback } from 'react';

interface ImageViewerProps {
  images: { url: string; thumbUrl: string; filename?: string | null }[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);

  const current = images[currentIndex];

  // 键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') {
      setLoading(true);
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
    if (e.key === 'ArrowRight') {
      setLoading(true);
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
  }, [images.length, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // 阻止点击遮罩关闭时误触内部
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-all z-10"
      >
        ✕
      </button>

      {/* 图片计数 */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* 上一张 */}
      {images.length > 1 && (
        <button
          onClick={() => { setLoading(true); setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1)); }}
          className="absolute left-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition-all z-10"
        >
          ‹
        </button>
      )}

      {/* 图片 */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {loading && (
          <div className="absolute text-white/50 text-sm animate-pulse">
            加载中...
          </div>
        )}
        <img
          src={current.url}
          alt={current.filename || '照片'}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl select-none"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* 下一张 */}
      {images.length > 1 && (
        <button
          onClick={() => { setLoading(true); setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0)); }}
          className="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition-all z-10"
        >
          ›
        </button>
      )}

      {/* 底部信息 */}
      {current.filename && (
        <div className="absolute bottom-4 text-white/50 text-xs">
          {current.filename}
        </div>
      )}
    </div>
  );
}

/**
 * 记录卡片组件 - 展示单条记录（缩略图 + 点击查看原图）
 */
import React, { useState } from 'react';
import { getThumbUrl, getFullUrl } from '../utils/image';
import ImageViewer from './ImageViewer';

interface Photo {
  id: number;
  record_id: number;
  r2_key: string;
  filename: string | null;
}

interface RecordItem {
  id: number;
  type: 'eat' | 'play';
  date: string;
  title: string;
  location: string | null;
  description: string | null;
  created_by: number;
  creator_nickname?: string;
  photos: Photo[];
  created_at: string;
}

interface RecordCardProps {
  record: RecordItem;
  onDelete?: (id: number) => void;
  onEdit?: (record: RecordItem) => void;
  isOwner?: boolean;
  isAdmin?: boolean;
}

export default function RecordCard({ record, onDelete, onEdit, isOwner, isAdmin }: RecordCardProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const typeConfig = {
    eat: {
      emoji: '🍽️',
      label: '吃',
      bgGradient: 'from-macaron-pink-100 to-candy-peach',
      borderColor: 'border-macaron-pink-200',
      badgeColor: 'bg-macaron-pink-200 text-macaron-pink-800',
    },
    play: {
      emoji: '🎮',
      label: '玩',
      bgGradient: 'from-macaron-blue-100 to-candy-mint',
      borderColor: 'border-macaron-blue-200',
      badgeColor: 'bg-macaron-blue-200 text-macaron-blue-800',
    },
  };

  const config = typeConfig[record.type];
  const displayPhotos = showAllPhotos ? record.photos : record.photos.slice(0, 3);

  // 构建图片查看器数据
  const lightboxImages = record.photos.map((p) => ({
    url: getFullUrl(p.r2_key),
    thumbUrl: getThumbUrl(p.r2_key),
    filename: p.filename,
  }));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className={`bg-white rounded-3xl shadow-cute border ${config.borderColor} overflow-hidden card-hover`}>
        {/* 头部 */}
        <div className={`bg-gradient-to-r ${config.bgGradient} px-5 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{config.emoji}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
                {config.label}
              </span>
              <span className="text-sm text-gray-500">{record.date}</span>
            </div>
            {(isOwner || isAdmin) && (
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(record)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-macaron-blue-500 transition-all"
                    title="编辑"
                  >
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(record.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-red-500 transition-all"
                    title="删除"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 内容体 */}
        <div className="p-5">
          {/* 标题 */}
          <h3 className="text-lg font-bold text-gray-800 mb-2">{record.title}</h3>

          {/* 地点 */}
          {record.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
              <span>📍</span>
              <span>{record.location}</span>
            </div>
          )}

          {/* 描述 */}
          {record.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">
              {record.description}
            </p>
          )}

          {/* 创建者信息 + 可见性标签 */}
          <div className="flex items-center gap-2 mb-3">
            {record.creator_nickname && (
              <span className="text-xs text-gray-400">👤 {record.creator_nickname}</span>
            )}
            {record.visibility && record.visibility !== 'public' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                record.visibility === 'users'
                  ? 'bg-blue-50 text-blue-500'
                  : 'bg-pink-50 text-pink-500'
              }`}>
                {record.visibility === 'users' ? '👥 登录可见' : '🔒 私密'}
              </span>
            )}
          </div>

          {/* 照片展示 - 缩略图网格，点击查看原图 */}
          {record.photos.length > 0 && (
            <div>
              <div className="photo-grid">
                {displayPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => openLightbox(index)}
                    className="block rounded-2xl overflow-hidden w-full text-left group relative"
                  >
                    <img
                      src={getThumbUrl(photo.r2_key)}
                      alt={photo.filename || '照片'}
                      className="w-full h-48 object-cover transition-all duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        // 缩略图加载失败时回退到原图
                        (e.target as HTMLImageElement).src = getFullUrl(photo.r2_key);
                      }}
                    />
                    {/* 悬停提示 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium drop-shadow-lg">
                        🔍 查看大图
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {record.photos.length > 3 && (
                <button
                  onClick={() => setShowAllPhotos(!showAllPhotos)}
                  className="mt-2 text-sm text-macaron-pink-500 hover:text-macaron-pink-700 transition-colors"
                >
                  {showAllPhotos
                    ? `收起照片`
                    : `查看全部 ${record.photos.length} 张照片 📸`}
                </button>
              )}
            </div>
          )}

          {/* 如果没有照片 */}
          {record.photos.length === 0 && (
            <div className="text-center py-4 text-gray-300 text-sm">
              📷 暂无照片
            </div>
          )}
        </div>
      </div>

      {/* 图片查看器 Lightbox */}
      {lightboxOpen && (
        <ImageViewer
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

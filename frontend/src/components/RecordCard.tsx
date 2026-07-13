/**
 * 记录卡片组件 - 展示单条记录
 */
import React, { useState } from 'react';

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

// 将 R2 key 转换为可访问的图片 URL
function getPhotoUrl(r2Key: string): string {
  // r2 key 格式: photos/123/123456-abc.jpg
  // Worker 代理 URL: /api/photos/photos/123/123456-abc.jpg
  return `/api/photos/${r2Key}`;
}

export default function RecordCard({ record, onDelete, onEdit, isOwner, isAdmin }: RecordCardProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);

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

  return (
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

        {/* 创建者信息 */}
        {record.creator_nickname && (
          <div className="text-xs text-gray-400 mb-3">
            👤 {record.creator_nickname}
          </div>
        )}

        {/* 照片展示 */}
        {record.photos.length > 0 && (
          <div>
            <div className="photo-grid">
              {displayPhotos.map((photo) => (
                <a
                  key={photo.id}
                  href={getPhotoUrl(photo.r2_key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden"
                >
                  <img
                    src={getPhotoUrl(photo.r2_key)}
                    alt={photo.filename || '照片'}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </a>
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
  );
}

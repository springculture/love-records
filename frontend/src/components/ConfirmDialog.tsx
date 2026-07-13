/**
 * 确认操作弹窗 - 替换浏览器原生 confirm
 */
import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  type = 'info',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />

      {/* 弹窗 */}
      <div className="relative bg-white rounded-3xl shadow-cute-lg w-full max-w-sm p-6 text-center animate-in">
        {/* 图标 */}
        <div className="text-5xl mb-4">
          {isDanger ? '🗑️' : '💕'}
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-cute text-gray-700 mb-2">
          {title}
        </h3>

        {/* 消息 */}
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {message}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] ${
              isDanger
                ? 'bg-gradient-to-r from-red-400 to-macaron-pink-500 shadow-cute hover:shadow-cute-lg'
                : 'bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 shadow-cute hover:shadow-cute-lg'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

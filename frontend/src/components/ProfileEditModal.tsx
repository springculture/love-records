/**
 * 个人资料编辑弹窗 - 修改昵称
 */
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/client';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({ open, onClose }: ProfileEditModalProps) {
  const { user, login } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authApi.updateProfile({ nickname: nickname.trim() });
      // 更新本地存储的用户信息
      const updatedUser = { ...user, nickname: nickname.trim() };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // 刷新页面状态
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.error || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-cute-lg w-full max-w-sm p-6">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          ✕
        </button>

        {/* 标题 */}
        <div className="text-center mb-5">
          <span className="text-3xl block mb-2">✏️</span>
          <h2 className="text-xl font-cute bg-gradient-to-r from-macaron-pink-500 to-macaron-blue-500 bg-clip-text text-transparent">
            修改昵称
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              当前昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入新昵称"
              maxLength={20}
              required
              className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50"
            />
            <p className="text-xs text-gray-400 mt-1">最多 20 个字符</p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-2xl bg-green-50 text-green-600 text-sm text-center">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 text-white font-medium rounded-2xl shadow-cute hover:shadow-cute-lg transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? '保存中...' : '💕 保存昵称'}
          </button>
        </form>
      </div>
    </div>
  );
}

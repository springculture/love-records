/**
 * 登录/注册弹窗组件
 */
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, password, nickname || undefined);
      } else {
        await login(username, password);
      }
      onClose();
      setUsername('');
      setPassword('');
      setNickname('');
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="relative bg-white rounded-3xl shadow-cute-lg w-full max-w-md p-8 animate-in">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          ✕
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <span className="text-4xl block mb-2">{isRegister ? '💕' : '✨'}</span>
          <h2 className="text-2xl font-cute bg-gradient-to-r from-macaron-pink-500 to-macaron-blue-500 bg-clip-text text-transparent">
            {isRegister ? '注册账号' : '欢迎回来'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isRegister ? '加入我们，记录甜蜜时光' : '登录后继续记录美好'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              required
              minLength={2}
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码（至少6位）"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                昵称（可选）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="给自己取个可爱的昵称吧"
                className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 text-white font-medium rounded-2xl shadow-cute hover:shadow-cute-lg transition-all hover:scale-[1.02] disabled:opacity-50 heart-beat"
          >
            {loading ? '处理中...' : isRegister ? '💕 注册' : '✨ 登录'}
          </button>
        </form>

        {/* 切换模式 */}
        <div className="text-center mt-4">
          <button
            onClick={switchMode}
            className="text-sm text-macaron-blue-500 hover:text-macaron-pink-500 transition-colors"
          >
            {isRegister ? '已有账号？去登录 ✨' : '没有账号？去注册 💕'}
          </button>
        </div>
      </div>
    </div>
  );
}

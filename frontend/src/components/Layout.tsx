/**
 * 页面布局组件 - 顶部导航栏 + 底部
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: '🏠 首页', icon: '🏠' },
    { path: '/records', label: '📝 记录', icon: '📝' },
    ...(isAdmin ? [{ path: '/admin', label: '⚙️ 管理', icon: '⚙️' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-cute sticky top-0 z-50 border-b border-macaron-pink-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl float-animation">💕</span>
              <span className="font-cute text-xl bg-gradient-to-r from-macaron-pink-500 to-macaron-blue-500 bg-clip-text text-transparent">
                恋爱记录
              </span>
            </Link>

            {/* 桌面端导航链接 */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'bg-gradient-to-r from-macaron-pink-200 to-macaron-blue-200 text-macaron-pink-800 shadow-sm'
                      : 'text-gray-600 hover:bg-macaron-pink-50 hover:text-macaron-pink-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* 用户操作区 */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-sm text-gray-600">
                    <span className="font-medium text-macaron-pink-600">{user.nickname}</span>
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-macaron-blue-100 text-macaron-blue-700">
                      {user.role === 'admin' ? '管理员' : user.role === 'user' ? '用户' : '游客'}
                    </span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-macaron-pink-600 hover:bg-macaron-pink-50 rounded-2xl transition-all"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-5 py-2 bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 text-white text-sm font-medium rounded-2xl shadow-cute hover:shadow-cute-lg transition-all hover:scale-105 heart-beat"
                >
                  ✨ 登录
                </button>
              )}

              {/* 移动端菜单按钮 */}
              <button
                className="md:hidden p-2 text-gray-500 hover:text-macaron-pink-600"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* 移动端菜单 */}
          {showMobileMenu && (
            <div className="md:hidden pb-4 border-t border-macaron-pink-100 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'bg-macaron-pink-100 text-macaron-pink-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* 主内容 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 底部 */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-macaron-pink-100 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            💕 用爱记录每一个美好瞬间
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Made with 💖
          </p>
        </div>
      </footer>

      {/* 登录/注册弹窗 */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

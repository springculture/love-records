/**
 * 首页 - 展示概览信息和最近记录
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recordsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import RecordCard from '../components/RecordCard';

export default function Home() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, eat: 0, play: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await recordsApi.list({ page: 1, limit: 6 });
        const { records, pagination } = response.data;
        setRecentRecords(records);
        setStats({
          total: pagination.total,
          eat: records.filter((r: any) => r.type === 'eat').length,
          play: records.filter((r: any) => r.type === 'play').length,
        });
      } catch (err) {
        console.error('获取数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 装饰性浮动元素
  const floatingElements = [
    { emoji: '💕', top: '10%', left: '5%', delay: '0s', size: 'text-3xl' },
    { emoji: '🌸', top: '20%', right: '8%', delay: '1s', size: 'text-2xl' },
    { emoji: '✨', bottom: '30%', left: '10%', delay: '0.5s', size: 'text-2xl' },
    { emoji: '💫', bottom: '20%', right: '5%', delay: '1.5s', size: 'text-3xl' },
    { emoji: '🎀', top: '40%', left: '3%', delay: '2s', size: 'text-xl' },
    { emoji: '🦋', top: '60%', right: '4%', delay: '0.8s', size: 'text-2xl' },
  ];

  return (
    <div>
      {/* 英雄区 */}
      <section className="relative overflow-hidden gradient-pink-blue py-20">
        {/* 浮动装饰 */}
        {floatingElements.map((el, i) => (
          <span
            key={i}
            className={`absolute float-animation opacity-40 ${el.size}`}
            style={{
              top: el.top,
              left: el.left,
              right: el.right,
              bottom: el.bottom,
              animationDelay: el.delay,
            }}
          >
            {el.emoji}
          </span>
        ))}

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="mb-6">
            <span className="text-7xl block mb-4">💕</span>
            <h1 className="text-4xl md:text-5xl font-cute text-white mb-4 drop-shadow-sm">
              恋爱记录
            </h1>
            <p className="text-lg text-white/80 max-w-lg mx-auto">
              记录我们一起吃过的美食，去过的远方
              <br />
              每一个瞬间都是爱的见证
            </p>
          </div>

          {/* 快捷操作 */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {isAuthenticated ? (
              <>
                <Link
                  to="/records?type=eat"
                  className="px-8 py-3 bg-white/90 backdrop-blur-sm text-macaron-pink-600 font-medium rounded-2xl shadow-cute hover:shadow-cute-lg transition-all hover:scale-105"
                >
                  🍽️ 记录美食
                </Link>
                <Link
                  to="/records?type=play"
                  className="px-8 py-3 bg-white/90 backdrop-blur-sm text-macaron-blue-600 font-medium rounded-2xl shadow-cute hover:shadow-cute-lg transition-all hover:scale-105"
                >
                  🎮 记录游玩
                </Link>
              </>
            ) : (
              <p className="text-white/70 text-sm">
                登录后即可开始记录 💕
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 统计区 */}
      <section className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-cute p-6 grid grid-cols-3 gap-4">
          {[
            { value: stats.total, label: '总记录', color: 'text-macaron-pink-500', emoji: '📝' },
            { value: stats.eat + '🍽️', label: '吃', color: 'text-macaron-pink-500', emoji: '' },
            { value: stats.play + '🎮', label: '玩', color: 'text-macaron-blue-500', emoji: '' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>
                {typeof stat.value === 'number' ? stat.value : stat.value.split('')[0]}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {stat.emoji} {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 最近记录 */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-cute text-gray-700">
            ✨ 最近记录
          </h2>
          <Link
            to="/records"
            className="text-sm text-macaron-blue-500 hover:text-macaron-pink-500 transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">💕</div>
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : recentRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentRecords.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                isOwner={user?.id === record.created_by}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/50 rounded-3xl">
            <span className="text-6xl block mb-4">💕</span>
            <h3 className="text-xl font-cute text-gray-500 mb-2">还没有记录哦</h3>
            <p className="text-gray-400 mb-6">开始记录你们的甜蜜时光吧！</p>
            {isAuthenticated && (
              <Link
                to="/records"
                className="inline-block px-6 py-3 bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 text-white rounded-2xl font-medium shadow-cute hover:shadow-cute-lg transition-all"
              >
                开始记录 ✨
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 特色展示 */}
      <section className="max-w-4xl mx-auto px-4 mt-16 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { emoji: '🍽️', title: '美食记录', desc: '记录每一顿一起享用的美食，留住味蕾的幸福瞬间', color: 'from-macaron-pink-100 to-candy-peach' },
            { emoji: '🎮', title: '玩乐记录', desc: '收藏每一次共同的冒险和欢乐时光', color: 'from-macaron-blue-100 to-candy-mint' },
            { emoji: '📸', title: '照片回忆', desc: '上传照片，让回忆更加生动立体', color: 'from-candy-lavender to-macaron-pink-100' },
            { emoji: '💝', title: '爱的见证', desc: '所有记录汇集成属于你们的爱情故事', color: 'from-candy-peach to-macaron-blue-100' },
          ].map((feature, i) => (
            <div key={i} className={`bg-gradient-to-br ${feature.color} p-6 rounded-3xl card-hover`}>
              <span className="text-3xl block mb-3">{feature.emoji}</span>
              <h3 className="text-lg font-bold text-gray-700 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

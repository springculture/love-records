/**
 * 记录列表页 - 展示/创建/编辑记录
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recordsApi, uploadApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import RecordCard from '../components/RecordCard';

export default function Records() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') || 'all';

  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // 创建/编辑表单状态
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<number | null>(null);
  const [formType, setFormType] = useState<'eat' | 'play'>('eat');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPhotos, setFormPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (activeType !== 'all') params.type = activeType;
      const response = await recordsApi.list(params);
      setRecords(response.data.records);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('获取记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // 切换 tab 时重置
  const handleTypeChange = (type: string) => {
    if (type === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ type });
    }
  };

  // 打开创建表单
  const openCreateForm = (type?: 'eat' | 'play') => {
    setFormMode('create');
    setEditId(null);
    setFormType(type || 'eat');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTitle('');
    setFormLocation('');
    setFormDescription('');
    setFormPhotos([]);
    setPhotoPreviews([]);
    setError('');
    setShowCreate(true);
  };

  // 打开编辑表单
  const openEditForm = (record: any) => {
    setFormMode('edit');
    setEditId(record.id);
    setFormType(record.type);
    setFormDate(record.date);
    setFormTitle(record.title);
    setFormLocation(record.location || '');
    setFormDescription(record.description || '');
    setFormPhotos([]);
    setPhotoPreviews([]);
    setError('');
    setShowCreate(true);
  };

  // 照片预览
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotoPreviews((prev) => [...prev, ev.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      // 先上传照片
      const photoKeys: { key: string; filename: string }[] = [];
      if (formPhotos.length > 0) {
        for (const file of formPhotos) {
          const uploadRes = await uploadApi.uploadFile(file);
          photoKeys.push({
            key: uploadRes.data.photo.key,
            filename: uploadRes.data.photo.filename,
          });
        }
      }

      const recordData = {
        type: formType,
        date: formDate,
        title: formTitle,
        location: formLocation || undefined,
        description: formDescription || undefined,
        photoKeys: photoKeys.length > 0 ? photoKeys : undefined,
      };

      if (formMode === 'create') {
        await recordsApi.create(recordData);
      } else if (editId) {
        await recordsApi.update(editId, recordData);
      }

      setShowCreate(false);
      fetchRecords(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setUploading(false);
    }
  };

  // 删除记录
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await recordsApi.delete(id);
      fetchRecords(pagination.page);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const tabs = [
    { key: 'all', label: '📋 全部', emoji: '📋' },
    { key: 'eat', label: '🍽️ 吃', emoji: '🍽️' },
    { key: 'play', label: '🎮 玩', emoji: '🎮' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-cute text-gray-700">📝 记录</h1>
          <p className="text-sm text-gray-400 mt-1">记录我们一起的美好时光</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => openCreateForm()}
            className="px-6 py-3 bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 text-white font-medium rounded-2xl shadow-cute hover:shadow-cute-lg transition-all hover:scale-105 heart-beat"
          >
            ✨ 新建记录
          </button>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTypeChange(tab.key)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              activeType === tab.key
                ? 'bg-gradient-to-r from-macaron-pink-200 to-macaron-blue-200 text-gray-700 shadow-sm'
                : 'bg-white/60 text-gray-500 hover:bg-macaron-pink-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 记录列表 */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin text-4xl mb-4">💕</div>
          <p className="text-gray-400">加载中...</p>
        </div>
      ) : records.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onDelete={handleDelete}
                onEdit={openEditForm}
                isOwner={user?.id === record.created_by}
                isAdmin={isAdmin}
              />
            ))}
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchRecords(page)}
                  className={`w-10 h-10 rounded-2xl text-sm font-medium transition-all ${
                    pagination.page === page
                      ? 'bg-macaron-pink-400 text-white shadow-cute'
                      : 'bg-white/60 text-gray-500 hover:bg-macaron-pink-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white/50 rounded-3xl">
          <span className="text-6xl block mb-4">💕</span>
          <h3 className="text-xl font-cute text-gray-500 mb-2">还没有{activeType !== 'all' ? (activeType === 'eat' ? '🍽️ 吃' : '🎮 玩') : ''}的记录哦</h3>
          <p className="text-gray-400 mb-6">开始记录甜蜜时光吧！</p>
          {isAuthenticated && (
            <button
              onClick={() => openCreateForm(activeType === 'all' ? undefined : activeType as 'eat' | 'play')}
              className="px-6 py-3 bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 text-white rounded-2xl font-medium shadow-cute hover:shadow-cute-lg transition-all"
            >
              创建第一条记录 ✨
            </button>
          )}
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-3xl shadow-cute-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cute bg-gradient-to-r from-macaron-pink-500 to-macaron-blue-500 bg-clip-text text-transparent">
                {formMode === 'create' ? '✨ 新建记录' : '✏️ 编辑记录'}
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">类型</label>
                <div className="flex gap-3">
                  {[
                    { value: 'eat', label: '🍽️ 吃', color: 'border-macaron-pink-300 bg-macaron-pink-50' },
                    { value: 'play', label: '🎮 玩', color: 'border-macaron-blue-300 bg-macaron-blue-50' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormType(option.value as 'eat' | 'play')}
                      className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all border-2 ${
                        formType === option.value
                          ? option.color + ' shadow-sm'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">日期</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50"
                />
              </div>

              {/* 主题 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">主题</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="给这次记录取个名字吧"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50"
                />
              </div>

              {/* 地点 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">地点</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="在哪里呀？"
                  className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="写下当时的感受吧..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-macaron-pink-200 focus:border-macaron-pink-400 focus:ring-2 focus:ring-macaron-pink-200 outline-none transition-all bg-macaron-pink-50/50 resize-none"
                />
              </div>

              {/* 照片上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">照片</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {photoPreviews.map((preview, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/40 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/60"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-macaron-pink-300 flex items-center justify-center cursor-pointer hover:bg-macaron-pink-50 transition-all">
                    <span className="text-2xl text-macaron-pink-400">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400">支持 JPG、PNG、GIF、WebP，每张不超过 10MB</p>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="p-3 rounded-2xl bg-red-50 text-red-500 text-sm">{error}</div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-macaron-pink-400 to-macaron-blue-400 text-white font-medium rounded-2xl shadow-cute hover:shadow-cute-lg transition-all disabled:opacity-50 heart-beat"
              >
                {uploading ? '⏳ 处理中...' : formMode === 'create' ? '💕 创建记录' : '💕 保存修改'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

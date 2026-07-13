/**
 * 管理页面 - 用户管理 & 权限配置 & 记录管理（仅管理员）
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi, permissionsApi, recordsApi } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';

const visibilityLabels: Record<string, { label: string; emoji: string; color: string }> = {
  public: { label: '公开', emoji: '🌍', color: 'bg-green-100 text-green-700 border-green-200' },
  users: { label: '登录用户', emoji: '👥', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  private: { label: '私密', emoji: '🔒', color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'records'>('users');

  // 用户列表
  const [users, setUsers] = useState<any[]>([]);

  // 权限配置
  const [permissions, setPermissions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 记录管理
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [changingVis, setChangingVis] = useState<number | null>(null);

  // 确认删除弹窗
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; recordId: number; recordTitle: string }>({
    open: false, recordId: 0, recordTitle: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'records') fetchAllRecords();
  }, [activeTab, recordsPage]);

  const fetchData = async () => {
    try {
      const [usersRes, permsRes] = await Promise.all([
        authApi.getUsers(),
        permissionsApi.list(),
      ]);
      setUsers(usersRes.data.users);
      setPermissions(permsRes.data.permissions);
    } catch (err) {
      console.error('获取数据失败:', err);
    }
  };

  const fetchAllRecords = async () => {
    setRecordsLoading(true);
    try {
      const res = await recordsApi.listAll({ page: recordsPage, limit: 20 });
      setAllRecords(res.data.records);
      setRecordsTotal(res.data.pagination.total);
    } catch (err) {
      console.error('获取记录失败:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleVisibilityChange = async (recordId: number, visibility: string) => {
    setChangingVis(recordId);
    try {
      await recordsApi.updateVisibility(recordId, visibility);
      setMessage(`可见性已更新 ✅ (ID: ${recordId})`);
      fetchAllRecords();
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      console.error('更新可见性失败:', err);
    } finally {
      setChangingVis(null);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      await recordsApi.delete(id);
      setMessage(`记录已删除 ✅`);
      fetchAllRecords();
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const openDeleteConfirm = (record: any) => {
    setDeleteConfirm({ open: true, recordId: record.id, recordTitle: record.title });
  };

  const confirmDelete = () => {
    handleDeleteRecord(deleteConfirm.recordId);
    setDeleteConfirm({ open: false, recordId: 0, recordTitle: '' });
  };

  // 更新权限
  const handlePermissionChange = async (
    role: string,
    resource: string,
    field: string,
    value: boolean
  ) => {
    setSaving(true);
    try {
      const perm = permissions.find(
        (p: any) => p.role === role && p.resource === resource
      );
      await permissionsApi.update({
        role,
        resource,
        can_read: field === 'can_read' ? value : perm?.can_read === 1,
        can_create: field === 'can_create' ? value : perm?.can_create === 1,
        can_update: field === 'can_update' ? value : perm?.can_update === 1,
        can_delete: field === 'can_delete' ? value : perm?.can_delete === 1,
      });
      setMessage('权限更新成功 ✅');
      fetchData();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('更新权限失败:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  const tabs = [
    { key: 'records', label: '📝 记录管理' },
    { key: 'users', label: '👥 用户管理' },
    { key: 'permissions', label: '🔐 权限配置' },
  ];

  const actionLabels: Record<string, string> = {
    can_read: '查看',
    can_create: '创建',
    can_update: '编辑',
    can_delete: '删除',
  };

  const roleLabels: Record<string, string> = {
    visitor: '👤 游客',
    user: '👥 用户',
    admin: '⭐ 管理员',
  };

  const resourceLabels: Record<string, string> = {
    records: '📝 记录',
    photos: '📸 照片',
    permissions: '🔐 权限管理',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-cute text-gray-700">⚙️ 管理后台</h1>
        <p className="text-sm text-gray-400 mt-1">管理用户、记录和权限配置</p>
        {message && (
          <div className="mt-3 p-3 rounded-2xl bg-green-50 text-green-600 text-sm inline-block">
            {message}
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-macaron-pink-200 to-macaron-blue-200 text-gray-700 shadow-sm'
                : 'bg-white/60 text-gray-500 hover:bg-macaron-pink-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== 记录管理 ========== */}
      {activeTab === 'records' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-cute overflow-hidden">
          <div className="p-6 border-b border-macaron-pink-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-700">📝 记录管理</h2>
              <p className="text-sm text-gray-400">共 {recordsTotal} 条记录 — 可修改每条记录的可见范围</p>
            </div>
          </div>

          {recordsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin text-3xl">💕</div>
              <p className="text-gray-400 mt-2">加载中...</p>
            </div>
          ) : allRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-macaron-pink-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">主题</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">日期</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">创建者</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">可见范围</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allRecords.map((record: any) => (
                    <tr key={record.id} className="border-t border-macaron-pink-50 hover:bg-macaron-pink-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">#{record.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {record.type === 'eat' ? '🍽️ 吃' : '🎮 玩'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 max-w-[200px] truncate">
                        {record.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{record.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {record.creator_nickname || `#${record.created_by}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {['public', 'users', 'private'].map((v) => {
                            const vl = visibilityLabels[v];
                            return (
                              <button
                                key={v}
                                onClick={() => handleVisibilityChange(record.id, v)}
                                disabled={changingVis === record.id}
                                className={`px-2 py-1 text-xs rounded-xl border transition-all ${
                                  record.visibility === v
                                    ? `${vl.color} font-bold shadow-sm`
                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                }`}
                              >
                                {vl.emoji} {vl.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openDeleteConfirm(record)}
                          className="px-3 py-1 text-xs rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          🗑️ 删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 分页 */}
              {Math.ceil(recordsTotal / 20) > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t border-macaron-pink-100">
                  {Array.from({ length: Math.ceil(recordsTotal / 20) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setRecordsPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-medium transition-all ${
                        recordsPage === p
                          ? 'bg-macaron-pink-400 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========== 用户管理 ========== */}
      {activeTab === 'users' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-cute overflow-hidden">
          <div className="p-6 border-b border-macaron-pink-100">
            <h2 className="text-lg font-bold text-gray-700">👥 用户列表</h2>
            <p className="text-sm text-gray-400">共 {users.length} 个用户</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-macaron-pink-50/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">用户名</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">昵称</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">角色</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-t border-macaron-pink-50 hover:bg-macaron-pink-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">#{u.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{u.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.nickname || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-macaron-pink-200 text-macaron-pink-800'
                          : u.role === 'user'
                          ? 'bg-macaron-blue-200 text-macaron-blue-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {u.role === 'admin' ? '管理员' : u.role === 'user' ? '用户' : '游客'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== 权限配置 ========== */}
      {activeTab === 'permissions' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-cute p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-1">🔐 权限配置</h2>
          <p className="text-sm text-gray-400 mb-6">
            管理不同角色对各资源的访问权限
          </p>

          <div className="space-y-6">
            {['records', 'photos', 'permissions'].map((resource) => (
              <div key={resource} className="bg-macaron-pink-50/30 rounded-2xl p-5">
                <h3 className="text-base font-bold text-gray-700 mb-4">
                  {resourceLabels[resource] || resource}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-sm font-medium text-gray-500 pb-2">角色</th>
                        {['can_read', 'can_create', 'can_update', 'can_delete'].map((action) => (
                          <th key={action} className="text-center text-sm font-medium text-gray-500 pb-2 px-3">
                            {actionLabels[action]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['visitor', 'user', 'admin'].map((role) => {
                        const perm = permissions.find(
                          (p: any) => p.role === role && p.resource === resource
                        );
                        return (
                          <tr key={role} className="border-t border-macaron-pink-100">
                            <td className="py-3 text-sm text-gray-600">
                              {roleLabels[role] || role}
                            </td>
                            {['can_read', 'can_create', 'can_update', 'can_delete'].map((action) => (
                              <td key={action} className="text-center py-3 px-3">
                                {role === 'admin' ? (
                                  <span className="text-green-500">✅</span>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handlePermissionChange(
                                        role,
                                        resource,
                                        action,
                                        !(perm?.[action] === 1)
                                      )
                                    }
                                    disabled={saving}
                                    className={`w-8 h-8 rounded-xl transition-all ${
                                      perm?.[action] === 1
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                  >
                                    {perm?.[action] === 1 ? '✓' : '−'}
                                  </button>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-macaron-blue-50/50 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">💡 提示</p>
            <p>管理员拥有所有权限，不可更改。游客只能查看内容，用户可创建和编辑自己的内容。</p>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="删除记录"
        message={`确定要删除「${deleteConfirm.recordTitle}」吗？\n此操作无法撤销，相关照片也会被一并删除。`}
        confirmText="🗑️ 确认删除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, recordId: 0, recordTitle: '' })}
      />
    </div>
  );
}

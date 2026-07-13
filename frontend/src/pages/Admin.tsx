/**
 * 管理页面 - 用户管理 & 权限配置（仅管理员）
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi, permissionsApi } from '../api/client';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

  // 用户列表
  const [users, setUsers] = useState<any[]>([]);

  // 权限配置
  const [permissions, setPermissions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin]);

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
    { key: 'users', label: '👥 用户管理', emoji: '👥' },
    { key: 'permissions', label: '🔐 权限配置', emoji: '🔐' },
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
        <p className="text-sm text-gray-400 mt-1">管理用户和权限配置</p>
        {message && (
          <div className="mt-3 p-3 rounded-2xl bg-green-50 text-green-600 text-sm inline-block">
            {message}
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'users' | 'permissions')}
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

      {/* 用户管理 */}
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

      {/* 权限配置 */}
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
    </div>
  );
}

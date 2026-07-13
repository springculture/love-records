/**
 * API 客户端 - 封装 axios 请求
 */
import axios from 'axios';

// API 地址：Pages Function 会代理 /api/* 到 Worker
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加 Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理 401 错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 触发自定义事件，让 AuthContext 感知
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// ====== 认证相关 API ======

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
    nickname: string;
    avatar_url?: string;
  };
}

export const authApi = {
  login: (params: LoginParams) =>
    apiClient.post<AuthResponse>('/auth/login', params),

  register: (params: RegisterParams) =>
    apiClient.post<AuthResponse>('/auth/register', params),

  getMe: () =>
    apiClient.get<{ user: any }>('/auth/me'),

  getUsers: () =>
    apiClient.get<{ users: any[] }>('/auth/users'),

  /** 修改昵称 */
  updateProfile: (params: { nickname: string }) =>
    apiClient.put<{ message: string; user: any }>('/auth/profile', params),
};

// ====== 记录相关 API ======

export interface RecordParams {
  type: 'eat' | 'play';
  date: string;
  title: string;
  location?: string;
  description?: string;
  photoKeys?: { key: string; filename: string }[];
}

export interface RecordResponse {
  records: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const recordsApi = {
  list: (params?: { page?: number; limit?: number; type?: string }) =>
    apiClient.get<RecordResponse>('/records', { params }),

  getById: (id: number) =>
    apiClient.get<{ record: any }>(`/records/${id}`),

  create: (params: RecordParams) =>
    apiClient.post<{ message: string; record: any }>('/records', params),

  update: (id: number, params: Partial<RecordParams>) =>
    apiClient.put<{ message: string; record: any }>(`/records/${id}`, params),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/records/${id}`),

  /** 管理员修改可见性 */
  updateVisibility: (id: number, visibility: string) =>
    apiClient.patch<{ message: string; visibility: string }>(`/records/${id}/visibility`, { visibility }),

  /** 管理员获取全部记录 */
  listAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<RecordResponse>('/records', { params: { ...params, admin_all: 'true' } }),
};

// ====== 上传相关 API ======

export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ message: string; photo: any }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** 上传缩略图到指定 key（在原图 key 基础上加 -thumb） */
  uploadThumbnail: (file: File, targetKey: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_key', targetKey);
    return apiClient.post<{ message: string; photo: any }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadBatch: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return apiClient.post<{ message: string; photos: any[] }>('/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ====== 权限相关 API ======

export const permissionsApi = {
  list: () =>
    apiClient.get<{ permissions: any[] }>('/permissions'),

  update: (params: { role: string; resource: string; can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean }) =>
    apiClient.put<{ message: string }>('/permissions', params),
};

export default apiClient;

/**
 * Cloudflare Worker 环境变量与绑定类型
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'visitor' | 'user' | 'admin';
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Record {
  id: number;
  type: 'eat' | 'play';
  date: string;
  title: string;
  location: string | null;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  record_id: number;
  r2_key: string;
  filename: string | null;
  created_at: string;
}

export interface Permission {
  id: number;
  role: 'visitor' | 'user' | 'admin';
  resource: string;
  can_read: number;
  can_create: number;
  can_update: number;
  can_delete: number;
}

/**
 * 记录附带照片信息的返回类型
 */
export interface RecordWithPhotos extends Record {
  photos: Photo[];
  creator_nickname?: string;
}

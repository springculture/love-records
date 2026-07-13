/**
 * 恋爱记录网站 - Cloudflare Worker 入口
 * 使用 Hono 框架
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import auth from './routes/auth';
import records from './routes/records';
import upload from './routes/upload';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    // 允许本地开发和所有 pages.dev 预览域名
    if (origin.includes('localhost') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.workers.dev')) {
      return origin;
    }
    return origin;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: '💕 恋爱记录网站 API 运行中' });
});

// 照片代理路由 - 通过 Worker 提供 R2 图片访问
app.get('/api/photos/*', async (c) => {
  try {
    const key = c.req.path.replace('/api/photos/', '');
    const object = await c.env.R2.get(key);

    if (!object) {
      return c.json({ error: '照片不存在' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('获取照片失败:', error);
    return c.json({ error: '获取照片失败' }, 500);
  }
});

// 注册子路由
app.route('/api/auth', auth);
app.route('/api/records', records);
app.route('/api/upload', upload);

// 管理路由 - 权限管理
app.get('/api/permissions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '请先登录' }, 401);
  }

  // 简化：验证 JWT
  const { verifyJWT } = await import('./utils/jwt');
  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload || payload.role !== 'admin') {
    return c.json({ error: '权限不足' }, 403);
  }

  const perms = await c.env.DB.prepare('SELECT * FROM permissions ORDER BY role, resource').all();
  return c.json({ permissions: perms.results });
});

// 更新权限（管理员）
app.put('/api/permissions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '请先登录' }, 401);
  }

  const { verifyJWT } = await import('./utils/jwt');
  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload || payload.role !== 'admin') {
    return c.json({ error: '权限不足' }, 403);
  }

  const { role, resource, can_read, can_create, can_update, can_delete } = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE permissions SET can_read = ?, can_create = ?, can_update = ?, can_delete = ?, updated_at = datetime('now')
     WHERE role = ? AND resource = ?`
  ).bind(can_read ? 1 : 0, can_create ? 1 : 0, can_update ? 1 : 0, can_delete ? 1 : 0, role, resource).run();

  return c.json({ message: '权限更新成功' });
});

// 404 处理
app.notFound((c) => {
  return c.json({ error: '接口不存在' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('服务器错误:', err);
  return c.json({ error: '服务器内部错误' }, 500);
});

export default app;

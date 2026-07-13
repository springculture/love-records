/**
 * 认证路由 - 登录 / 注册 / 个人信息
 */
import { Hono } from 'hono';
import { signJWT } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import { authenticate } from '../middleware/auth';
import type { Env, User } from '../types';

const auth = new Hono<{ Bindings: Env }>();

/**
 * POST /api/auth/register - 用户注册
 */
auth.post('/register', async (c) => {
  try {
    const { username, password, nickname } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空' }, 400);
    }

    if (username.length < 2 || username.length > 20) {
      return c.json({ error: '用户名长度为2-20个字符' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: '密码长度不能少于6位' }, 400);
    }

    // 检查用户名是否已存在
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    if (existing) {
      return c.json({ error: '用户名已存在' }, 409);
    }

    const passwordHash = await hashPassword(password);
    const result = await c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, role, nickname) VALUES (?, ?, ?, ?)'
    ).bind(username, passwordHash, 'user', nickname || username).run();

    const userId = result.meta.last_row_id;

    // 生成 JWT
    const token = await signJWT(
      { userId: Number(userId), username, role: 'user' },
      c.env.JWT_SECRET
    );

    return c.json({
      message: '注册成功',
      token,
      user: { id: userId, username, role: 'user', nickname: nickname || username },
    }, 201);
  } catch (error) {
    console.error('注册失败:', error);
    return c.json({ error: '注册失败，请稍后重试' }, 500);
  }
});

/**
 * POST /api/auth/login - 用户登录
 */
auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first<User>();

    if (!user) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 生成 JWT
    const token = await signJWT(
      { userId: user.id, username: user.username, role: user.role },
      c.env.JWT_SECRET
    );

    return c.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return c.json({ error: '登录失败，请稍后重试' }, 500);
  }
});

/**
 * GET /api/auth/me - 获取当前用户信息
 */
auth.get('/me', authenticate, async (c) => {
  const user = c.get('user');
  const dbUser = await c.env.DB.prepare(
    'SELECT id, username, role, nickname, avatar_url, created_at FROM users WHERE id = ?'
  ).bind(user.userId).first();

  if (!dbUser) {
    return c.json({ error: '用户不存在' }, 404);
  }

  return c.json({ user: dbUser });
});

/**
 * GET /api/auth/users - 获取用户列表（管理员）
 */
auth.get('/users', authenticate, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: '权限不足' }, 403);
  }

  const users = await c.env.DB.prepare(
    'SELECT id, username, role, nickname, avatar_url, created_at FROM users ORDER BY created_at DESC'
  ).all();

  return c.json({ users: users.results });
});

export default auth;

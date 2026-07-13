/**
 * 认证与权限中间件
 */
import type { MiddlewareHandler } from 'hono';
import { verifyJWT, type JWTPayload } from '../utils/jwt';
import type { Env } from '../types';

declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

/**
 * JWT 认证中间件
 * 验证 Bearer Token，将用户信息注入上下文
 */
export const authenticate: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未提供认证令牌' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ error: '认证令牌无效或已过期' }, 401);
  }

  c.set('user', payload);
  await next();
};

/**
 * 可选的认证中间件
 * 如果有 token 则解析用户信息，没有也不报错
 */
export const optionalAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (payload) {
      c.set('user', payload);
    }
  }
  await next();
};

/**
 * 角色权限检查中间件工厂
 * @param allowedRoles 允许访问的角色列表
 */
export const requireRole = (...allowedRoles: string[]): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: '请先登录' }, 401);
    }
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: '权限不足' }, 403);
    }
    await next();
  };
};

/**
 * 检查用户对特定资源的操作权限
 */
export async function checkPermission(
  c: { env: Env },
  userRole: string,
  resource: string,
  action: 'can_read' | 'can_create' | 'can_update' | 'can_delete'
): Promise<boolean> {
  const result = await c.env.DB.prepare(
    `SELECT ${action} FROM permissions WHERE role = ? AND resource = ?`
  ).bind(userRole, resource).first<{ [key: string]: number }>();

  return result ? result[action] === 1 : false;
}

/**
 * 资源操作权限中间件工厂
 */
export const requirePermission = (
  resource: string,
  action: 'can_read' | 'can_create' | 'can_update' | 'can_delete'
): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: '请先登录' }, 401);
    }

    // 管理员拥有所有权限
    if (user.role === 'admin') {
      await next();
      return;
    }

    const hasPermission = await checkPermission(c, user.role, resource, action);
    if (!hasPermission) {
      return c.json({ error: '您没有此操作权限' }, 403);
    }

    await next();
  };
};

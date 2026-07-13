/**
 * 记录路由 - 吃/玩记录的 CRUD
 */
import { Hono } from 'hono';
import { authenticate, optionalAuth, requirePermission } from '../middleware/auth';
import type { Env, Record, RecordWithPhotos, Photo } from '../types';

const records = new Hono<{ Bindings: Env }>();

/**
 * GET /api/records - 获取记录列表（支持分页和筛选 + 可见性控制）
 */
records.get('/', optionalAuth, async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const type = c.req.query('type'); // 'eat' | 'play' | undefined
    const adminAll = c.req.query('admin_all'); // 管理员查看全部
    const offset = (page - 1) * limit;

    let sql = `
      SELECT r.*, u.nickname as creator_nickname
      FROM records r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // 可见性过滤
    if (user?.role === 'admin' && adminAll === 'true') {
      // 管理员查看全部（admin_all 参数）
    } else if (user?.role === 'admin') {
      // 普通列表，管理员看到所有公开 + 登录用户可见的记录
      sql += ' AND (r.visibility IN (\'public\', \'users\') OR r.created_by = ?)';
      params.push(user.userId);
    } else if (user) {
      // 登录用户：公开 + 仅用户 + 自己的私密
      sql += ' AND (r.visibility IN (\'public\', \'users\') OR (r.visibility = \'private\' AND r.created_by = ?))';
      params.push(user.userId);
    } else {
      // 游客：仅公开
      sql += " AND r.visibility = 'public'";
    }

    if (type && (type === 'eat' || type === 'play')) {
      sql += ' AND r.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY r.date DESC, r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB.prepare(sql).bind(...params).all<RecordWithPhotos>();

    // 为每条记录获取照片
    const recordsWithPhotos = await Promise.all(
      result.results.map(async (record) => {
        const photos = await c.env.DB.prepare(
          'SELECT * FROM photos WHERE record_id = ? ORDER BY created_at ASC'
        ).bind(record.id).all<Photo>();
        return { ...record, photos: photos.results };
      })
    );

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM records WHERE 1=1';
    const countParams: any[] = [];
    if (user?.role === 'admin' && adminAll === 'true') {
      // 管理员全部
    } else if (user?.role === 'admin') {
      countSql += ' AND (visibility IN (\'public\', \'users\') OR created_by = ?)';
      countParams.push(user.userId);
    } else if (user) {
      countSql += ' AND (visibility IN (\'public\', \'users\') OR (visibility = \'private\' AND created_by = ?))';
      countParams.push(user.userId);
    } else {
      countSql += " AND visibility = 'public'";
    }
    if (type && (type === 'eat' || type === 'play')) {
      countSql += ' AND type = ?';
      countParams.push(type);
    }
    const countResult = await c.env.DB.prepare(countSql).bind(...countParams).first<{ total: number }>();

    return c.json({
      records: recordsWithPhotos,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('获取记录列表失败:', error);
    return c.json({ error: '获取记录列表失败' }, 500);
  }
});

/**
 * GET /api/records/:id - 获取单条记录详情
 */
records.get('/:id', optionalAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');
    if (isNaN(id)) {
      return c.json({ error: '无效的记录ID' }, 400);
    }

    const record = await c.env.DB.prepare(
      `SELECT r.*, u.nickname as creator_nickname
       FROM records r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`
    ).bind(id).first<RecordWithPhotos>();

    if (!record) {
      return c.json({ error: '记录不存在' }, 404);
    }

    // 可见性检查
    const canView =
      user?.role === 'admin' ||
      record.visibility === 'public' ||
      (record.visibility === 'users' && user) ||
      (record.visibility === 'private' && (record.created_by === user?.userId));

    if (!canView) {
      return c.json({ error: '无权查看此记录' }, 403);
    }

    const photos = await c.env.DB.prepare(
      'SELECT * FROM photos WHERE record_id = ? ORDER BY created_at ASC'
    ).bind(id).all<Photo>();

    record.photos = photos.results;

    return c.json({ record });
  } catch (error) {
    console.error('获取记录详情失败:', error);
    return c.json({ error: '获取记录详情失败' }, 500);
  }
});

/**
 * POST /api/records - 创建新记录
 */
records.post('/', authenticate, requirePermission('records', 'can_create'), async (c) => {
  try {
    const user = c.get('user');
    const { type, date, title, location, description, photoKeys, visibility } = await c.req.json();

    if (!type || !date || !title) {
      return c.json({ error: '类型、日期和主题不能为空' }, 400);
    }

    if (type !== 'eat' && type !== 'play') {
      return c.json({ error: '类型必须是 eat 或 play' }, 400);
    }

    // 可见性默认为 'public'
    const vis = visibility && ['public', 'users', 'private'].includes(visibility)
      ? visibility : 'public';

    const result = await c.env.DB.prepare(
      'INSERT INTO records (type, date, title, location, description, created_by, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(type, date, title, location || null, description || null, user.userId, vis).run();

    const recordId = result.meta.last_row_id;

    // 如果有上传的照片，保存照片记录
    if (photoKeys && Array.isArray(photoKeys) && photoKeys.length > 0) {
      const insertPhoto = c.env.DB.prepare(
        'INSERT INTO photos (record_id, r2_key, filename) VALUES (?, ?, ?)'
      );

      for (const photo of photoKeys) {
        await insertPhoto.bind(recordId, photo.key, photo.filename || null).run();
      }
    }

    // 获取创建后的完整记录
    const record = await c.env.DB.prepare(
      `SELECT r.*, u.nickname as creator_nickname
       FROM records r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`
    ).bind(recordId).first<RecordWithPhotos>();

    const photos = await c.env.DB.prepare(
      'SELECT * FROM photos WHERE record_id = ? ORDER BY created_at ASC'
    ).bind(recordId).all<Photo>();

    return c.json({
      message: '记录创建成功 💕',
      record: { ...record, photos: photos.results },
    }, 201);
  } catch (error) {
    console.error('创建记录失败:', error);
    return c.json({ error: '创建记录失败' }, 500);
  }
});

/**
 * PUT /api/records/:id - 更新记录
 */
records.put('/:id', authenticate, requirePermission('records', 'can_update'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');
    const { type, date, title, location, description, visibility } = await c.req.json();

    if (isNaN(id)) {
      return c.json({ error: '无效的记录ID' }, 400);
    }

    // 检查记录是否存在
    const existing = await c.env.DB.prepare(
      'SELECT * FROM records WHERE id = ?'
    ).bind(id).first<Record>();

    if (!existing) {
      return c.json({ error: '记录不存在' }, 404);
    }

    // 非管理员只能编辑自己的记录
    if (user.role !== 'admin' && existing.created_by !== user.userId) {
      return c.json({ error: '只能编辑自己的记录' }, 403);
    }

    const vis = visibility && ['public', 'users', 'private'].includes(visibility)
      ? visibility : existing.visibility;

    await c.env.DB.prepare(
      `UPDATE records
       SET type = ?, date = ?, title = ?, location = ?, description = ?,
           visibility = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      type || existing.type,
      date || existing.date,
      title || existing.title,
      location !== undefined ? location : existing.location,
      description !== undefined ? description : existing.description,
      vis,
      id
    ).run();

    const updated = await c.env.DB.prepare(
      `SELECT r.*, u.nickname as creator_nickname
       FROM records r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`
    ).bind(id).first<RecordWithPhotos>();

    const photos = await c.env.DB.prepare(
      'SELECT * FROM photos WHERE record_id = ? ORDER BY created_at ASC'
    ).bind(id).all<Photo>();

    return c.json({
      message: '记录更新成功 💕',
      record: { ...updated, photos: photos.results },
    });
  } catch (error) {
    console.error('更新记录失败:', error);
    return c.json({ error: '更新记录失败' }, 500);
  }
});

/**
 * DELETE /api/records/:id - 删除记录
 */
records.delete('/:id', authenticate, requirePermission('records', 'can_delete'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (isNaN(id)) {
      return c.json({ error: '无效的记录ID' }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT * FROM records WHERE id = ?'
    ).bind(id).first<Record>();

    if (!existing) {
      return c.json({ error: '记录不存在' }, 404);
    }

    // 非管理员只能删除自己的记录
    if (user.role !== 'admin' && existing.created_by !== user.userId) {
      return c.json({ error: '只能删除自己的记录' }, 403);
    }

    // 获取关联的照片以清理 R2
    const photos = await c.env.DB.prepare(
      'SELECT * FROM photos WHERE record_id = ?'
    ).bind(id).all<Photo>();

    // 删除 R2 中的照片
    if (photos.results.length > 0) {
      const deletePromises = photos.results.map((photo) =>
        c.env.R2.delete(photo.r2_key)
      );
      await Promise.all(deletePromises);
    }

    // 删除数据库记录（照片记录通过外键级联删除）
    await c.env.DB.prepare('DELETE FROM records WHERE id = ?').bind(id).run();

    return c.json({ message: '记录已删除' });
  } catch (error) {
    console.error('删除记录失败:', error);
    return c.json({ error: '删除记录失败' }, 500);
  }
});

/**
 * PATCH /api/records/:id/visibility - 管理员修改记录可见性
 */
records.patch('/:id/visibility', authenticate, async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json({ error: '仅管理员可修改可见性' }, 403);
    }

    const id = parseInt(c.req.param('id'));
    const { visibility } = await c.req.json();

    if (!visibility || !['public', 'users', 'private'].includes(visibility)) {
      return c.json({ error: '可见性值无效，可选: public, users, private' }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT id FROM records WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return c.json({ error: '记录不存在' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE records SET visibility = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(visibility, id).run();

    return c.json({ message: '可见性已更新 ✅', visibility });
  } catch (error) {
    console.error('更新可见性失败:', error);
    return c.json({ error: '更新可见性失败' }, 500);
  }
});

export default records;

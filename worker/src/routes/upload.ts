/**
 * 文件上传路由 - 使用 R2 存储照片
 */
import { Hono } from 'hono';
import { authenticate, requirePermission } from '../middleware/auth';
import type { Env } from '../types';

const upload = new Hono<{ Bindings: Env }>();

/**
 * POST /api/upload - 上传照片到 R2
 */
upload.post('/', authenticate, requirePermission('photos', 'can_create'), async (c) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ error: '请选择要上传的文件' }, 400);
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: '仅支持 JPG、PNG、GIF、WebP、HEIC 格式的图片' }, 400);
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: '图片大小不能超过 10MB' }, 400);
    }

    // 生成唯一的文件路径：user_id/timestamp-random.extension
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const r2Key = `photos/${user.userId}/${timestamp}-${random}.${ext}`;

    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${file.name}"`,
      },
      customMetadata: {
        uploadedBy: String(user.userId),
        originalName: file.name,
      },
    });

    // 生成公开可访问的 URL（使用 R2 的公开访问或通过 Worker 代理）
    const publicUrl = `/api/photos/${r2Key}`;

    return c.json({
      message: '上传成功 📸',
      photo: {
        key: r2Key,
        filename: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
    }, 201);
  } catch (error) {
    console.error('上传失败:', error);
    return c.json({ error: '上传失败，请稍后重试' }, 500);
  }
});

/**
 * POST /api/upload/batch - 批量上传照片
 */
upload.post('/batch', authenticate, requirePermission('photos', 'can_create'), async (c) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return c.json({ error: '请选择要上传的文件' }, 400);
    }

    if (files.length > 10) {
      return c.json({ error: '每次最多上传10张照片' }, 400);
    }

    const uploadedPhotos = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) continue;

      const ext = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const r2Key = `photos/${user.userId}/${timestamp}-${random}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      await c.env.R2.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType: file.type },
        customMetadata: { uploadedBy: String(user.userId), originalName: file.name },
      });

      uploadedPhotos.push({
        key: r2Key,
        filename: file.name,
        url: `/api/photos/${r2Key}`,
      });
    }

    return c.json({
      message: `成功上传 ${uploadedPhotos.length} 张照片 📸`,
      photos: uploadedPhotos,
    }, 201);
  } catch (error) {
    console.error('批量上传失败:', error);
    return c.json({ error: '批量上传失败' }, 500);
  }
});

/**
 * GET /api/photos/:key - 获取照片（通过 Worker 代理）
 * 注意：这里的路由是 /api/photos/*，但 Hono 路由匹配问题，
 * 我们在 index.ts 中处理这个路由
 */

export default upload;

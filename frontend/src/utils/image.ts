/**
 * 图片工具函数 - 缩略图生成
 */

/**
 * 从 R2 key 生成缩略图 key
 * 规则：在文件名前加 -thumb，如 photo/123/abc.jpg → photo/123/abc-thumb.jpg
 */
export function getThumbKey(r2Key: string): string {
  const dotIndex = r2Key.lastIndexOf('.');
  if (dotIndex === -1) return `${r2Key}-thumb`;
  return `${r2Key.slice(0, dotIndex)}-thumb${r2Key.slice(dotIndex)}`;
}

/**
 * 获取缩略图完整 URL
 */
export function getThumbUrl(r2Key: string): string {
  return `/api/photos/${getThumbKey(r2Key)}`;
}

/**
 * 获取原图完整 URL
 */
export function getFullUrl(r2Key: string): string {
  return `/api/photos/${r2Key}`;
}

/**
 * 在浏览器中用 canvas 压缩生成缩略图
 * @param file 原始图片文件
 * @param maxWidth 缩略图最大宽度（默认 300）
 * @returns Blob 形式的缩略图
 */
export async function createThumbnail(
  file: File,
  maxWidth: number = 300
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 计算缩放尺寸，保持宽高比
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);

      // 用 canvas 绘制缩略图
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'));
        return;
      }

      // 平滑缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // 导出为 WebP 格式（体积小、质量好）
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('缩略图生成失败'));
          }
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

/**
 * 判断是否应该使用缩略图
 */
export function shouldUseThumbnail(photosCount: number, index: number): boolean {
  // 前 3 张或总数少于 3 张时用缩略图
  return index < 3 || photosCount <= 3;
}

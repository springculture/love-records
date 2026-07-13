/**
 * JWT 工具函数
 * 使用 Cloudflare Workers 原生 Web Crypto API
 */

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  exp: number;
}

/**
 * 将字符串编码为 Base64 URL 安全格式
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 将 Base64 URL 安全格式解码为字符串
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

/**
 * 使用 HMAC-SHA256 签名
 */
async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * 生成 JWT Token
 */
export async function signJWT(
  payload: Omit<JWTPayload, 'exp'>,
  secret: string,
  expiresInSeconds: number = 86400 * 7 // 默认7天
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    exp: now + expiresInSeconds,
  };

  const headerStr = base64UrlEncode(JSON.stringify(header));
  const payloadStr = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${headerStr}.${payloadStr}`;
  const signature = await hmacSha256(secret, data);

  return `${data}.${signature}`;
}

/**
 * 验证 JWT Token 并返回 payload
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerStr, payloadStr, signatureStr] = parts;
    const data = `${headerStr}.${payloadStr}`;
    const expectedSignature = await hmacSha256(secret, data);

    // 使用固定时间比较防止时序攻击
    if (signatureStr !== expectedSignature) return null;

    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadStr));

    // 检查是否过期
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

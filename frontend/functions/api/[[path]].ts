/**
 * Cloudflare Pages Function
 * 将 /api/* 请求代理到 Worker，解决跨域问题
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 转发到 Worker API
  const workerUrl = `https://love-records-worker.johnwiiiiiick.workers.dev${url.pathname}${url.search}`;

  // 构造新请求，保留原始请求头和方法
  const proxyRequest = new Request(workerUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
  });

  // 发送请求到 Worker 并返回响应
  const response = await fetch(proxyRequest);

  // 返回响应，添加 CORS 头（如果需要）
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

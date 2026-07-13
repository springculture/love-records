# 💕 恋爱记录网站

记录我们一起吃过的美食，去过的远方。每一个瞬间都是爱的见证。

## 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Cloudflare Workers (Hono 框架)
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2 (照片存储)
- **部署**: GitHub Actions → Cloudflare Pages + Workers

## 功能

- ✅ 用户注册/登录（JWT 认证）
- ✅ 三权角色：游客、用户、管理员
- ✅ 记录管理：吃 🍽️ / 玩 🎮
- ✅ 日期、主题、地点、描述
- ✅ 照片上传（R2 存储）
- ✅ 管理员后台：用户管理 & 权限配置
- ✅ 可爱马卡龙蓝粉配色 UI

## 快速开始

### 1. 配置 Cloudflare

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 2. 创建资源

```bash
# 创建 D1 数据库
wrangler d1 create love-records-db

# 创建 R2 存储桶
wrangler r2 bucket create love-records-photos
```

### 3. 配置环境变量

编辑 `worker/wrangler.toml`，替换以下内容：

- `database_id`: 替换为你的 D1 数据库 ID
- `JWT_SECRET`: 替换为安全的 JWT 密钥

### 4. 初始化数据库

```bash
cd worker
npm install
npx wrangler d1 migrations apply love-records-db
```

### 5. 本地开发

```bash
# 启动 Worker API（终端 1）
cd worker
npm run dev

# 启动前端（终端 2）
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

## 部署

推送代码到 GitHub main 分支，GitHub Actions 会自动部署。

或在本地手动部署：

```bash
# 部署 Worker
cd worker && npm run deploy

# 部署前端
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=love-records
```

## 默认管理员

- 用户名: `admin`
- 密码: `admin123`

**⚠️ 生产环境请务必修改默认密码！**

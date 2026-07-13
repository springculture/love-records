-- 初始化数据库表结构
-- 恋爱记录网站 - 用户 & 记录表

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('visitor', 'user', 'admin')),
  nickname TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- 记录表（吃 & 玩）
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('eat', 'play')),
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 照片表
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  filename TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

-- 权限配置表（管理员可配置各角色的访问权限）
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('visitor', 'user', 'admin')),
  resource TEXT NOT NULL,
  can_read INTEGER DEFAULT 0,
  can_create INTEGER DEFAULT 0,
  can_update INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  UNIQUE(role, resource)
);

-- 插入默认权限
INSERT OR IGNORE INTO permissions (role, resource, can_read, can_create, can_update, can_delete) VALUES
  ('visitor', 'records', 1, 0, 0, 0),
  ('user', 'records', 1, 1, 1, 0),
  ('admin', 'records', 1, 1, 1, 1),
  ('visitor', 'photos', 1, 0, 0, 0),
  ('user', 'photos', 1, 1, 0, 0),
  ('admin', 'photos', 1, 1, 1, 1),
  ('admin', 'permissions', 1, 1, 1, 1);

-- 插入默认管理员（密码: admin123，请在生产环境修改！）
-- 密码使用 bcrypt 哈希，这里使用简单哈希方便开发
-- 生产环境请更换密码
INSERT OR IGNORE INTO users (username, password_hash, role, nickname) VALUES
  ('admin', 'admin123', 'admin', '管理员');

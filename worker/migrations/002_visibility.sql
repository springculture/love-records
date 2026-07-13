-- 为记录添加可见性控制
-- visibility: 'public' = 所有人可见, 'users' = 登录用户可见, 'private' = 仅创建者和管理员

ALTER TABLE records ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'users', 'private'));

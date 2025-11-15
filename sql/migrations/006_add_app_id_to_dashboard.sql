-- ============================================
-- 添加 app_id 字段到 dashboard 表
-- 版本: 1.0.0
-- 日期: 2025-11-14
-- 说明: 让 Dashboard 关联到 Application,实现应用级别的监控面板
-- ============================================

-- 执行命令: psql -U postgres -d postgres -f sql/migrations/006_add_app_id_to_dashboard.sql

-- ============================================
-- 1. 添加 appId 字段
-- ============================================
-- 注意: appId 可以为 NULL,允许全局 Dashboard (不关联特定应用)
ALTER TABLE dashboard
ADD COLUMN IF NOT EXISTS "appId" VARCHAR(80);

-- ============================================
-- 2. 确保 application.appId 有唯一约束
-- ============================================
-- 外键必须引用有唯一约束的列
ALTER TABLE application
ADD CONSTRAINT uq_application_app_id UNIQUE ("appId");

-- ============================================
-- 3. 创建外键约束
-- ============================================
-- 注意: 外键约束确保 appId 必须存在于 application 表中
ALTER TABLE dashboard
ADD CONSTRAINT fk_dashboard_application
FOREIGN KEY ("appId") REFERENCES application("appId") ON DELETE CASCADE;

-- ============================================
-- 4. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_dashboard_app_id ON dashboard("appId");

-- ============================================
-- 5. 添加注释
-- ============================================
COMMENT ON COLUMN dashboard."appId" IS '关联的应用 ID (可选,NULL 表示全局 Dashboard)';

-- ============================================
-- 6. 查询示例
-- ============================================

-- 查询某个应用的所有 Dashboard
-- SELECT * FROM dashboard WHERE "appId" = 'react123456' ORDER BY created_at DESC;

-- 查询全局 Dashboard (不关联特定应用)
-- SELECT * FROM dashboard WHERE "appId" IS NULL ORDER BY created_at DESC;

-- 查询应用及其 Dashboard
-- SELECT
--     a."appId",
--     a.name as app_name,
--     d.id as dashboard_id,
--     d.name as dashboard_name,
--     d.is_default
-- FROM application a
-- LEFT JOIN dashboard d ON a."appId" = d."appId"
-- WHERE a."appId" = 'react123456';


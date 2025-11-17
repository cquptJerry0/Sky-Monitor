-- ============================================
-- Sky Monitor PostgreSQL 完整初始化脚本
-- 版本: 1.0.0
-- 日期: 2025-11-17
-- 说明: 用于初始化空白 PostgreSQL 数据库的完整 Schema
-- ============================================

-- 执行命令: psql -U postgres -d postgres -f sql/init/postgresql/001_init_schema.sql

-- ============================================
-- 1. admin 表 (用户管理)
-- ============================================
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50),
    avatar VARCHAR(500),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);

COMMENT ON TABLE admin IS '管理员用户表';
COMMENT ON COLUMN admin.id IS '主键';
COMMENT ON COLUMN admin.username IS '用户名(唯一)';
COMMENT ON COLUMN admin.password IS '密码(加密存储)';
COMMENT ON COLUMN admin.email IS '邮箱';
COMMENT ON COLUMN admin.phone IS '手机号';
COMMENT ON COLUMN admin.role IS '角色';
COMMENT ON COLUMN admin.avatar IS '头像URL';

-- ============================================
-- 2. application 表 (应用管理)
-- ============================================
CREATE TABLE IF NOT EXISTS application (
    id SERIAL PRIMARY KEY,
    "appId" VARCHAR(80) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('vanilla', 'react', 'vue')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    CONSTRAINT uq_application_app_id UNIQUE ("appId"),
    CONSTRAINT fk_application_user FOREIGN KEY ("userId") REFERENCES admin(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_application_user_id ON application("userId");
CREATE INDEX IF NOT EXISTS idx_application_app_id ON application("appId");

COMMENT ON TABLE application IS '应用配置表';
COMMENT ON COLUMN application.id IS '主键';
COMMENT ON COLUMN application."appId" IS '应用唯一标识符';
COMMENT ON COLUMN application.type IS '应用类型: vanilla, react, vue';
COMMENT ON COLUMN application.name IS '应用名称';
COMMENT ON COLUMN application.description IS '应用描述';
COMMENT ON COLUMN application."userId" IS '所属用户ID(外键)';

-- ============================================
-- 3. source_maps 表 (SourceMap 管理)
-- ============================================
CREATE TABLE IF NOT EXISTS source_maps (
    id SERIAL PRIMARY KEY,
    "appId" VARCHAR(80) NOT NULL,
    release VARCHAR(100) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    "urlPrefix" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sourcemap UNIQUE ("appId", release, "fileName")
);

CREATE INDEX IF NOT EXISTS idx_sourcemap_app_release ON source_maps("appId", release);

COMMENT ON TABLE source_maps IS 'SourceMap 文件存储表';
COMMENT ON COLUMN source_maps.id IS '主键';
COMMENT ON COLUMN source_maps."appId" IS '应用ID';
COMMENT ON COLUMN source_maps.release IS '版本号';
COMMENT ON COLUMN source_maps."fileName" IS '文件名';
COMMENT ON COLUMN source_maps.content IS 'SourceMap 内容(JSON)';
COMMENT ON COLUMN source_maps."urlPrefix" IS 'URL 前缀';

-- ============================================
-- 4. dashboard 表 (监控面板)
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "isDefault" BOOLEAN DEFAULT FALSE,
    "userId" INTEGER NOT NULL,
    "appId" VARCHAR(80),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dashboard_user FOREIGN KEY ("userId") REFERENCES admin(id) ON DELETE CASCADE,
    CONSTRAINT fk_dashboard_application FOREIGN KEY ("appId") REFERENCES application("appId") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_user_id ON dashboard("userId");
CREATE INDEX IF NOT EXISTS idx_dashboard_app_id ON dashboard("appId");
CREATE INDEX IF NOT EXISTS idx_dashboard_is_default ON dashboard("isDefault");

COMMENT ON TABLE dashboard IS '用户自定义监控面板';
COMMENT ON COLUMN dashboard.id IS '主键(UUID)';
COMMENT ON COLUMN dashboard.name IS 'Dashboard 名称';
COMMENT ON COLUMN dashboard.description IS 'Dashboard 描述';
COMMENT ON COLUMN dashboard."isDefault" IS '是否为默认 Dashboard';
COMMENT ON COLUMN dashboard."userId" IS '创建者用户ID(外键)';
COMMENT ON COLUMN dashboard."appId" IS '关联的应用ID(可选,NULL表示全局Dashboard)';

-- ============================================
-- 5. dashboard_widget 表 (Widget 配置)
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_widget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dashboardId" UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    "widgetType" VARCHAR(50) NOT NULL CHECK ("widgetType" IN ('line', 'bar', 'area', 'table', 'world_map', 'big_number')),
    queries JSONB NOT NULL,
    "displayConfig" JSONB,
    layout JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_widget_dashboard FOREIGN KEY ("dashboardId") REFERENCES dashboard(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_widget_dashboard_id ON dashboard_widget("dashboardId");
CREATE INDEX IF NOT EXISTS idx_widget_type ON dashboard_widget("widgetType");

COMMENT ON TABLE dashboard_widget IS 'Dashboard Widget 配置表';
COMMENT ON COLUMN dashboard_widget.id IS '主键(UUID)';
COMMENT ON COLUMN dashboard_widget."dashboardId" IS '所属 Dashboard ID(外键)';
COMMENT ON COLUMN dashboard_widget.title IS 'Widget 标题';
COMMENT ON COLUMN dashboard_widget."widgetType" IS 'Widget 类型: line, bar, area, table, world_map, big_number';
COMMENT ON COLUMN dashboard_widget.queries IS '查询配置(JSONB数组)';
COMMENT ON COLUMN dashboard_widget."displayConfig" IS '显示配置(JSONB)';
COMMENT ON COLUMN dashboard_widget.layout IS '布局配置(JSONB): {x, y, w, h}';

-- ============================================
-- 6. alert_rules 表 (告警规则)
-- ============================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('error_rate', 'slow_request', 'session_anomaly')),
    threshold FLOAT NOT NULL,
    window VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    notification_channels JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES admin(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_app_id ON alert_rules(app_id);
CREATE INDEX IF NOT EXISTS idx_alert_user_id ON alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_enabled ON alert_rules(enabled);

COMMENT ON TABLE alert_rules IS '告警规则配置表';
COMMENT ON COLUMN alert_rules.id IS '主键(UUID)';
COMMENT ON COLUMN alert_rules.app_id IS '应用ID';
COMMENT ON COLUMN alert_rules.user_id IS '用户ID(外键)';
COMMENT ON COLUMN alert_rules.name IS '规则名称';
COMMENT ON COLUMN alert_rules.type IS '告警类型: error_rate, slow_request, session_anomaly';
COMMENT ON COLUMN alert_rules.threshold IS '阈值';
COMMENT ON COLUMN alert_rules.window IS '时间窗口';
COMMENT ON COLUMN alert_rules.enabled IS '是否启用';
COMMENT ON COLUMN alert_rules.notification_channels IS '通知渠道(JSONB)';

-- ============================================
-- 初始化完成
-- ============================================
-- 查询所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


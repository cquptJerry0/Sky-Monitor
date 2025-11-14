-- ============================================
-- 创建 Dashboard 相关表 (PostgreSQL)
-- 版本: 1.0.0
-- 日期: 2025-11-14
-- 说明: 用于存储用户自定义的监控面板配置
-- ============================================

-- 执行命令: psql -U postgres -d postgres -f sql/migrations/005_create_dashboard_tables.sql

-- ============================================
-- 1. 创建 dashboard 表
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    CONSTRAINT fk_dashboard_user FOREIGN KEY (user_id) REFERENCES admin(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_dashboard_user_id ON dashboard(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_is_default ON dashboard(is_default);

-- 添加注释
COMMENT ON TABLE dashboard IS '用户自定义监控面板';
COMMENT ON COLUMN dashboard.id IS '主键';
COMMENT ON COLUMN dashboard.name IS 'Dashboard 名称';
COMMENT ON COLUMN dashboard.description IS 'Dashboard 描述';
COMMENT ON COLUMN dashboard.is_default IS '是否为默认 Dashboard';
COMMENT ON COLUMN dashboard.user_id IS '创建者用户 ID';

-- ============================================
-- 2. 创建 dashboard_widget 表
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_widget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    queries JSONB NOT NULL,
    display_config JSONB,
    layout JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_widget_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboard(id) ON DELETE CASCADE,
    CONSTRAINT chk_widget_type CHECK (widget_type IN ('line', 'bar', 'area', 'table', 'world_map', 'big_number'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_widget_dashboard_id ON dashboard_widget(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_widget_type ON dashboard_widget(widget_type);

-- 添加注释
COMMENT ON TABLE dashboard_widget IS 'Dashboard 中的 Widget 配置';
COMMENT ON COLUMN dashboard_widget.id IS '主键';
COMMENT ON COLUMN dashboard_widget.dashboard_id IS '所属 Dashboard ID';
COMMENT ON COLUMN dashboard_widget.title IS 'Widget 标题';
COMMENT ON COLUMN dashboard_widget.widget_type IS 'Widget 类型: line, bar, area, table, world_map, big_number';
COMMENT ON COLUMN dashboard_widget.queries IS '查询配置 (JSON 数组)';
COMMENT ON COLUMN dashboard_widget.display_config IS '显示配置 (JSON)';
COMMENT ON COLUMN dashboard_widget.layout IS '布局配置 (JSON): {x, y, w, h}';

-- ============================================
-- 3. 创建默认 Dashboard
-- ============================================
-- 注意: 这里假设 user_id = 1 是管理员用户
-- 实际使用时需要根据实际情况调整

-- 插入默认 Dashboard
INSERT INTO dashboard (id, name, description, is_default, user_id)
VALUES (
    gen_random_uuid(),
    'Default Dashboard',
    '默认监控面板',
    TRUE,
    1
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 查询示例
-- ============================================

-- 查询用户的所有 Dashboard
-- SELECT * FROM dashboard WHERE user_id = 1 ORDER BY created_at DESC;

-- 查询 Dashboard 及其所有 Widget
-- SELECT 
--     d.id as dashboard_id,
--     d.name as dashboard_name,
--     w.id as widget_id,
--     w.title as widget_title,
--     w.widget_type
-- FROM dashboard d
-- LEFT JOIN dashboard_widget w ON d.id = w.dashboard_id
-- WHERE d.id = 'your-dashboard-id';

-- 查询默认 Dashboard
-- SELECT * FROM dashboard WHERE is_default = TRUE LIMIT 1;


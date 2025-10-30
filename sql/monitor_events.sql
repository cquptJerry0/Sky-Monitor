-- 监控事件表
-- 删除已有的表（如果存在）
DROP TABLE IF EXISTS monitor_events;

-- 创建监控事件表
CREATE TABLE monitor_events (
    id UUID DEFAULT generateUUIDv4 (), -- 事件唯一标识
    app_id String, -- 应用ID
    event_type String, -- 事件类型: error, unhandledrejection, webVital, message, event
    event_name String DEFAULT '', -- 事件名称，对于webVital是LCP/FCP/CLS/TTFB等
    event_data String, -- 事件数据，JSON格式
    path String DEFAULT '', -- 页面路径
    user_agent String DEFAULT '', -- 浏览器UA
    timestamp DateTime DEFAULT now(), -- 事件时间
    created_at DateTime DEFAULT now() -- 创建时间
) ENGINE = MergeTree ()
PARTITION BY
    toYYYYMM (timestamp)
ORDER BY (app_id, timestamp, event_type) SETTINGS index_granularity = 8192;

-- 创建索引以提高查询性能
-- ALTER TABLE monitor_events ADD INDEX idx_app_id (app_id) TYPE minmax GRANULARITY 4;
-- ALTER TABLE monitor_events ADD INDEX idx_event_type (event_type) TYPE set(100) GRANULARITY 4;

-- 查询示例
-- SELECT * FROM monitor_events ORDER BY timestamp DESC LIMIT 10;
-- SELECT event_type, count() as cnt FROM monitor_events GROUP BY event_type;
-- SELECT * FROM monitor_events WHERE app_id = 'your_app_id' ORDER BY timestamp DESC LIMIT 100;
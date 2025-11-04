-- 监控事件表
-- 删除已有的表（如果存在）
DROP TABLE IF EXISTS monitor_events;

-- 创建监控事件表
CREATE TABLE monitor_events (
    id UUID DEFAULT generateUUIDv4 (), -- 事件唯一标识
    app_id String, -- 应用ID
    event_type String, -- 事件类型: error, unhandledrejection, httpError, resourceError, webVital, message, event
    event_name String DEFAULT '', -- 事件名称，对于webVital是LCP/FCP/CLS/TTFB等
    event_data String, -- 事件数据，JSON格式（向后兼容）
    path String DEFAULT '', -- 页面路径
    user_agent String DEFAULT '', -- 浏览器UA
    timestamp DateTime DEFAULT now(), -- 事件时间
    created_at DateTime DEFAULT now(), -- 创建时间
    
    -- 错误相关字段
    error_message String DEFAULT '', -- 错误消息
    error_stack String DEFAULT '', -- 错误堆栈
    error_lineno UInt32 DEFAULT 0, -- 错误行号
    error_colno UInt32 DEFAULT 0, -- 错误列号
    error_fingerprint String DEFAULT '', -- 错误指纹（用于去重和聚合）
    
    -- 设备信息
    device_browser String DEFAULT '', -- 浏览器名称
    device_browser_version String DEFAULT '', -- 浏览器版本
    device_os String DEFAULT '', -- 操作系统
    device_os_version String DEFAULT '', -- 操作系统版本
    device_type String DEFAULT '', -- 设备类型: mobile, tablet, desktop
    device_screen String DEFAULT '', -- 屏幕分辨率
    
    -- 网络信息
    network_type String DEFAULT '', -- 网络类型: 4g, 3g, 2g, slow-2g
    network_rtt UInt32 DEFAULT 0, -- 往返时间(ms)
    
    -- 框架信息
    framework String DEFAULT '', -- 框架: vue, react, ''
    component_name String DEFAULT '', -- 组件名称
    component_stack String DEFAULT '', -- 组件堆栈
    
    -- HTTP 错误相关
    http_url String DEFAULT '', -- 请求URL
    http_method String DEFAULT '', -- 请求方法: GET, POST, etc.
    http_status UInt16 DEFAULT 0, -- HTTP状态码
    http_duration UInt32 DEFAULT 0, -- 请求耗时(ms)
    
    -- 资源错误相关
    resource_url String DEFAULT '', -- 资源URL
    resource_type String DEFAULT '' -- 资源类型: script, img, link, video, audio
) ENGINE = MergeTree ()
PARTITION BY
    toYYYYMM (timestamp)
ORDER BY (app_id, timestamp, event_type, error_fingerprint) SETTINGS index_granularity = 8192;

-- 创建索引以提高查询性能
-- 错误指纹索引（用于错误聚合）
ALTER TABLE monitor_events ADD INDEX idx_error_fingerprint (error_fingerprint) TYPE bloom_filter GRANULARITY 4;

-- 框架索引
ALTER TABLE monitor_events ADD INDEX idx_framework (framework) TYPE set(10) GRANULARITY 4;

-- 事件类型索引
ALTER TABLE monitor_events ADD INDEX idx_event_type (event_type) TYPE set(20) GRANULARITY 4;

-- HTTP状态码索引
ALTER TABLE monitor_events ADD INDEX idx_http_status (http_status) TYPE set(100) GRANULARITY 4;

-- 查询示例
-- SELECT * FROM monitor_events ORDER BY timestamp DESC LIMIT 10;
-- SELECT event_type, count() as cnt FROM monitor_events GROUP BY event_type;
-- SELECT * FROM monitor_events WHERE app_id = 'your_app_id' ORDER BY timestamp DESC LIMIT 100;